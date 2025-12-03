import { CameraPane } from '@/components/CameraPane';
import { FeedPane } from '@/components/FeedPane';
import { HomeIcon } from '@/components/HomeIcon';
import { NailIcon } from '@/components/NailIcon';
import { PersonIcon } from '@/components/PersonIcon';
import { PostThread } from '@/components/PostThread';
import { ProfilePane } from '@/components/ProfilePane';
import { TutorialsPage } from '@/components/TutorialsPage';
import { useAuth } from '@/contexts/AuthContext';
import { useCameraActions } from '@/hooks/useCameraActions';
import { useFeedPhotos } from '@/hooks/useFeedPhotos';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { useNavigation } from '@/hooks/useNavigation';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { updatePostDescription } from '@/services/postUpdates';
import { getSavedPostIds, savePost, unsavePost } from '@/services/savedPosts';
import { FurnitureImage, ViewType } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SwipeScreen() {
  const params = useLocalSearchParams();
  const { user, signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState<'Created' | 'Saved'>('Created');
  const [selectedPhoto, setSelectedPhoto] = useState<FurnitureImage | null>(null);
  const [photoOwner, setPhotoOwner] = useState<{ username?: string; display_name?: string; avatar_url?: string } | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<Set<string>>(new Set());
  const [selectedPhotoDimensions, setSelectedPhotoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const descriptionInputRef = React.useRef<TextInput>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load saved posts on mount
  useEffect(() => {
    if (user?.id) {
      getSavedPostIds(user.id).then(ids => {
        setSavedPhotos(ids);
      });
    }
  }, [user?.id]);

  // Handle save/unsave toggle
  const handleSaveToggle = async (photoId: string) => {
    if (!user?.id) return;

    const isCurrentlySaved = savedPhotos.has(photoId);
    
    // Optimistically update UI
    setSavedPhotos(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });

    // Update database
    if (isCurrentlySaved) {
      await unsavePost(photoId, user.id);
    } else {
      await savePost(photoId, user.id);
    }
  };

  // Initialize navigation
  const initialView: ViewType = params.initial === 'feed' ? 'feed' : params.initial === 'profile' ? 'profile' : 'camera';
  const {
    activeView,
    feedScale,
    cameraScale,
    profileScale,
    goToFeed,
    goToCamera,
    goToProfile,
    goBackFromCamera,
    getNavColor,
    isNavActive,
  } = useNavigation(initialView);

  // Fetch feed photos
  const { feedPhotos, loadingFeed, refreshing, onRefresh, fetchFeedPhotos } = useFeedPhotos(searchQuery, activeView);

  // Load image dimensions
  const photoDimensions = useImageDimensions(feedPhotos);

  // Profile data
  const { profileData, refetchProfile } = useProfile();

  // Camera actions
  const {
    cameraRef,
    cameraMode,
    setCameraMode,
    postPreviewUri,
    setPostPreviewUri,
    isUploading,
    previewUri,
    setPreviewUri,
    showPhotoSheet,
    setShowPhotoSheet,
    isAnalyzing,
    furnitureAnalysis,
    currentPhotoUri,
    flashEnabled,
    setFlashEnabled,
    similarPhotos,
    loadingSimilar,
    isValidatingFurniture,
    isFurnitureItem,
    aspectRatio,
    setAspectRatio,
    takePicture,
    pickImageFromLibrary,
    handlePostUpload,
    handleRequestDetailedAnalysis,
    clearPreview,
    tutorialPlan,
    setTutorialPlan,
    isGeneratingPlan,
    handleGeneratePlan,
    postDescription,
    setPostDescription,
  } = useCameraActions({
    onImageAnalyzed: () => {}, // Can be used for additional callbacks if needed
    onFeedRefresh: fetchFeedPhotos,
    onNavigateToFeed: goToFeed,
  });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Cache for profile lookups to reduce redundant queries
  const profileCacheRef = React.useRef<Map<string, { username?: string; display_name?: string }>>(new Map());

  // Fetch photo owner and dimensions when photo is selected
  useEffect(() => {
    const fetchPhotoOwner = async () => {
      if (selectedPhoto?.user_id) {
        // Check cache first to avoid redundant queries
        const cached = profileCacheRef.current.get(selectedPhoto.user_id);
        if (cached) {
          setPhotoOwner(cached);
          return;
        }

        setLoadingOwner(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', selectedPhoto.user_id)
            .single();

          if (error) {
            console.error('Error fetching photo owner:', error);
            setPhotoOwner(null);
        } else {
            // Cache the profile data
            profileCacheRef.current.set(selectedPhoto.user_id, data);
            setPhotoOwner(data);
        }
        } catch (error) {
          console.error('Error fetching photo owner:', error);
          setPhotoOwner(null);
        } finally {
          setLoadingOwner(false);
        }
      } else {
        setPhotoOwner(null);
      }
    };

    const loadPhotoDimensions = async () => {
      if (selectedPhoto) {
        // First check if dimensions are already loaded from feed
        const existingDims = photoDimensions[selectedPhoto.id];
        if (existingDims) {
          setSelectedPhotoDimensions(existingDims);
        } else {
          // Load dimensions if not already available
          try {
            await new Promise<void>((resolve, reject) => {
              Image.getSize(
                selectedPhoto.public_url,
                (imgWidth, imgHeight) => {
                  setSelectedPhotoDimensions({ width: imgWidth, height: imgHeight });
                  resolve();
                },
                (error) => {
                  console.warn('Failed to get dimensions for selected photo:', error);
                  // Fallback to square
                  setSelectedPhotoDimensions({ width: 1, height: 1 });
                  resolve();
                }
              );
            });
          } catch (error) {
            console.warn('Error loading photo dimensions:', error);
            setSelectedPhotoDimensions({ width: 1, height: 1 });
          }
        }
      } else {
        setSelectedPhotoDimensions(null);
      }
    };

    if (selectedPhoto) {
      fetchPhotoOwner();
      loadPhotoDimensions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto?.id, photoDimensions]);

  const handlePhotoPress = (photo: FurnitureImage) => {
    setSelectedPhoto(photo);
  };

  const handleClosePhotoDetail = () => {
    setSelectedPhoto(null);
    setPhotoOwner(null);
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  const handleStartEditDescription = () => {
    if (selectedPhoto) {
      setEditingDescription(selectedPhoto.description || '');
      setIsEditingDescription(true);
      // Scroll to description section and focus input after a short delay
      setTimeout(() => {
        descriptionInputRef.current?.focus();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  const handleSaveDescription = async () => {
    if (!selectedPhoto || !user?.id) return;

    setIsUpdatingDescription(true);
    try {
      const result = await updatePostDescription(
        selectedPhoto.id,
        editingDescription,
        user.id
      );

      if (result.success) {
        // Update the selected photo's description locally
        setSelectedPhoto({
          ...selectedPhoto,
          description: editingDescription.trim() || undefined,
        });
        // Refresh feed to get updated data
        fetchFeedPhotos();
        setIsEditingDescription(false);
        Alert.alert('Success', 'Description updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update description');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update description');
    } finally {
      setIsUpdatingDescription(false);
    }
  };


  const handleSignOut = async () => {
          Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  };

  // Convert feed photos to format with calculated heights based on aspect ratio
  // All images use the same width, height is calculated from aspect ratio
  const columns = useMemo(() => {
    const left: (FurnitureImage & { height: number; aspectRatio: number })[] = [];
    const right: (FurnitureImage & { height: number; aspectRatio: number })[] = [];
    let lh = 0;
    let rh = 0;
    
    // Column width is approximately half the screen minus padding and gap
    const columnWidth = (width - 20 - 16) / 2; // Account for container padding (10px each side) and gap between columns (16px)
    
    feedPhotos.forEach(photo => {
      // Get dimensions or use default aspect ratio
      const dims = photoDimensions[photo.id] || { width: 4, height: 3 };
      const aspectRatio = dims.width / dims.height;
      
      // Calculate height based on fixed width and aspect ratio
      const calculatedHeight = columnWidth / aspectRatio;
      
      const photoWithDimensions = { ...photo, height: calculatedHeight, aspectRatio };
      if (lh <= rh) {
        left.push(photoWithDimensions);
        lh += calculatedHeight;
      } else {
        right.push(photoWithDimensions);
        rh += calculatedHeight;
      }
    });
    
    return { left, right, columnWidth };
  }, [feedPhotos, photoDimensions]);

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
        {/* Feed Pane */}
        {activeView === 'feed' && (
          <FeedPane
            scale={feedScale}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCameraPress={goToCamera}
            feedPhotos={feedPhotos}
            loadingFeed={loadingFeed}
            refreshing={refreshing}
            onRefresh={onRefresh}
            columns={columns}
            onPhotoPress={handlePhotoPress}
            savedPhotos={savedPhotos}
            onSaveToggle={handleSaveToggle}
            currentUserId={user?.id}
          />
        )}

        {/* Photo Detail View */}
        {selectedPhoto && (
          <KeyboardAvoidingView 
            style={styles.photoDetailContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            {/* Back button overlay on photo */}
            <TouchableOpacity 
              style={styles.photoDetailBackButton}
              onPress={handleClosePhotoDetail}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <ScrollView 
              ref={scrollViewRef}
              style={styles.photoDetailScrollView}
              contentContainerStyle={styles.photoDetailContent}
              keyboardShouldPersistTaps="handled"
            >
              <Image 
                source={{ uri: selectedPhoto.public_url }} 
                style={[
                  styles.photoDetailImage,
                  selectedPhotoDimensions && (() => {
                    const calculatedHeight = (width * selectedPhotoDimensions.height) / selectedPhotoDimensions.width;
                    // Limit height to 80% of screen height to prevent photos from taking up entire screen
                    const maxHeight = SCREEN_HEIGHT * 0.8;
                    return {
                      height: Math.min(calculatedHeight, maxHeight),
                    };
                  })(),
                ]}
                resizeMode="contain"
                />
              
              <View style={styles.photoDetailInfo}>
                {loadingOwner ? (
                  <View style={styles.photoDetailOwnerLoading}>
                    <ActivityIndicator size="small" color="#999" />
                    <Text style={styles.photoDetailOwnerText}>Loading...</Text>
                  </View>
                ) : (
                  <View style={styles.photoDetailOwner}>
                    <View style={styles.photoDetailOwnerAvatar}>
                      {photoOwner?.avatar_url ? (
                        <Image 
                          source={{ uri: photoOwner.avatar_url }} 
                          style={styles.photoDetailOwnerAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={24} color="#666" />
                      )}
              </View>
                    <View style={styles.photoDetailOwnerInfo}>
                      <Text style={styles.photoDetailOwnerName}>
                        {photoOwner?.display_name || photoOwner?.username || 'Unknown User'}
                      </Text>
                      {photoOwner?.username && (
                        <Text style={styles.photoDetailOwnerUsername}>
                          @{photoOwner.username}
              </Text>
                      )}
          </View>
                    {selectedPhoto && selectedPhoto.user_id !== user?.id && (
                    <TouchableOpacity 
                      style={styles.photoDetailSaveButtonInline}
                      onPress={async () => {
                        if (selectedPhoto) {
                          await handleSaveToggle(selectedPhoto.id);
                        }
                      }}
                    >
                      <NailIcon 
                      size={24} 
                          color={selectedPhoto && savedPhotos.has(selectedPhoto.id) ? "#8AA64E" : "#FFF"} 
                        filled={selectedPhoto ? savedPhotos.has(selectedPhoto.id) : false} 
                      />
                    </TouchableOpacity>
                    )}
                </View>
                )}
                
                {/* Description Section */}
                <View style={styles.photoDetailDescriptionSection}>
                  {isEditingDescription ? (
                    <View style={styles.photoDetailEditDescription}>
                      <TextInput
                        ref={descriptionInputRef}
                        style={styles.photoDetailDescriptionInput}
                        value={editingDescription}
                        onChangeText={setEditingDescription}
                        placeholder="Add a description..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        editable={!isUpdatingDescription}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }}
                      />
                      <View style={styles.photoDetailEditActions}>
                        <TouchableOpacity
                          style={styles.photoDetailEditCancelButton}
                          onPress={handleCancelEditDescription}
                          disabled={isUpdatingDescription}
                        >
                          <Text style={styles.photoDetailEditCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.photoDetailEditSaveButton,
                            isUpdatingDescription && styles.photoDetailEditSaveButtonDisabled
                          ]}
                          onPress={handleSaveDescription}
                          disabled={isUpdatingDescription}
                        >
                          {isUpdatingDescription ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.photoDetailEditSaveText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.photoDetailDescriptionContainer}>
                      {selectedPhoto.description ? (
                        <Text style={styles.photoDetailDescriptionText}>
                          {selectedPhoto.description}
                        </Text>
                      ) : (
                        <Text style={styles.photoDetailDescriptionPlaceholder}>
                          No description
                        </Text>
                      )}
                      {selectedPhoto.user_id === user?.id && (
                        <TouchableOpacity
                          style={styles.photoDetailEditButton}
                          onPress={handleStartEditDescription}
                        >
                          <Ionicons name="pencil-outline" size={18} color="#999" />
                          <Text style={styles.photoDetailEditButtonText}>
                            {selectedPhoto.description ? 'Edit' : 'Add description'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Thread Section */}
                <View style={styles.photoDetailThreadSection}>
                  <PostThread
                    postId={selectedPhoto.id}
                    onCommentsUpdate={(comments) => {
                      // Comments are managed by PostThread component
                    }}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Camera Pane */}
        {activeView === 'camera' && (
          <CameraPane
            scale={cameraScale}
            cameraRef={cameraRef}
            flashEnabled={flashEnabled}
            onFlashToggle={() => setFlashEnabled(!flashEnabled)}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            onTakePicture={takePicture}
            onPickImageFromLibrary={pickImageFromLibrary}
            previewUri={previewUri}
            postPreviewUri={postPreviewUri}
            postPreviewImageUri={postPreviewUri}
            isUploading={isUploading}
            onPostCancel={() => setPostPreviewUri(null)}
            onPostUpload={handlePostUpload}
            showPhotoSheet={showPhotoSheet}
              furnitureAnalysis={furnitureAnalysis}
              isAnalyzing={isAnalyzing}
              onRequestDetailedAnalysis={handleRequestDetailedAnalysis}
            onClearPreview={clearPreview}
            similarPhotos={similarPhotos}
            loadingSimilar={loadingSimilar}
            isValidatingFurniture={isValidatingFurniture}
            isFurnitureItem={isFurnitureItem}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            onBackFromCamera={goBackFromCamera}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGeneratingPlan}
            postDescription={postDescription}
            onPostDescriptionChange={setPostDescription}
          />
        )}

        {/* Tutorials Page - Show when tutorial plan is generated */}
        {tutorialPlan && (
          <View style={styles.tutorialsOverlay}>
            <TutorialsPage
              tutorialPlan={tutorialPlan}
              onClose={() => setTutorialPlan(null)}
              onGoToFeed={() => {
                setTutorialPlan(null);
                clearPreview();
                goToFeed();
              }}
            />
          </View>
        )}

        {/* Profile Pane */}
        {activeView === 'profile' && (
          <ProfilePane
            scale={profileScale}
            profileData={profileData}
            userEmail={user?.email}
            userCreatedAt={user?.created_at}
            activeProfileTab={activeProfileTab}
            onProfileTabChange={setActiveProfileTab}
            onSignOut={handleSignOut}
            onPhotoPress={handlePhotoPress}
            savedPhotos={savedPhotos}
            onSaveToggle={handleSaveToggle}
            onProfileUpdate={refetchProfile}
          />
        )}
          
        {/* Fixed Bottom Navigation Bar - Hidden on Camera and Post Pages */}
        {activeView !== 'camera' && !selectedPhoto && (
          <View style={styles.bottomNav}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToFeed}
            >
              <HomeIcon 
                size={30} 
                color={getNavColor('feed')} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButtonCenter} 
              onPress={goToCamera}
            >
              <View style={styles.cameraNavButton}>
                <View style={styles.cameraNavButtonInner}>
                  <Ionicons 
                    name="camera" 
                    size={36} 
                    color="#000" 
                  />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToProfile}
            >
              <PersonIcon 
                size={30} 
                color={getNavColor('profile')} 
              />
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
}




const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  permissionContainer: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20 
  },
  permissionText: { 
    fontSize: 16,
    textAlign: 'center', 
    marginVertical: 20, 
    color: '#666' 
  },
  permissionButton: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 20,
    paddingVertical: 12, 
    borderRadius: 8 
  },
  permissionButtonText: { 
    color: 'white', 
    fontSize: 16,
    fontWeight: '600' 
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    alignItems: 'center',
    paddingBottom: 35,
    paddingTop: 25,
    zIndex: 1000,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 0,
    marginHorizontal: 20,
  },
  navButtonCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: -78, // Move up by half the button height (56/2 = 28) so center is at top of nav bar
  },
  cameraNavButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(4, 4, 4, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cameraNavButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#FFF',
  },
  photoDetailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  photoDetailBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoDetailScrollView: {
    flex: 1,
  },
  photoDetailContent: {
    paddingBottom: 40,
  },
  photoDetailImage: {
    width: width,
    backgroundColor: '#1A1A1A',
  },
  photoDetailInfo: {
    padding: 20,
    backgroundColor: '#000',
  },
  photoDetailOwner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoDetailOwnerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoDetailOwnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoDetailOwnerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  photoDetailOwnerInfo: {
    flex: 1,
  },
  photoDetailOwnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  photoDetailOwnerUsername: {
    fontSize: 14,
    color: '#999',
  },
  photoDetailOwnerText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  photoDetailSaveButtonInline: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailDescriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  photoDetailDescriptionContainer: {
    gap: 12,
  },
  photoDetailDescriptionText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
  },
  photoDetailDescriptionPlaceholder: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  photoDetailEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  photoDetailEditButtonText: {
    fontSize: 14,
    color: '#999',
  },
  photoDetailEditDescription: {
    gap: 12,
  },
  photoDetailDescriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 120,
    maxHeight: 250,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  photoDetailEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  photoDetailEditCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  photoDetailEditCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photoDetailEditSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  photoDetailEditSaveButtonDisabled: {
    opacity: 0.6,
  },
  photoDetailEditSaveText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  photoDetailThreadSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  tutorialsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 2000,
  },
});


