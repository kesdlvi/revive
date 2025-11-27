import { CameraPane } from '@/components/CameraPane';
import { FeedPane } from '@/components/FeedPane';
import { ProfilePane } from '@/components/ProfilePane';
import { useAuth } from '@/contexts/AuthContext';
import { useCameraActions } from '@/hooks/useCameraActions';
import { useFeedPhotos } from '@/hooks/useFeedPhotos';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { useNavigation } from '@/hooks/useNavigation';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { FurnitureImage, ViewType } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function SwipeScreen() {
  const params = useLocalSearchParams();
  const { user, signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState<'Created' | 'Saved'>('Created');
  const [selectedPhoto, setSelectedPhoto] = useState<FurnitureImage | null>(null);
  const [photoOwner, setPhotoOwner] = useState<{ username?: string; display_name?: string } | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  // Initialize navigation
  const initialView: ViewType = params.initial === 'feed' ? 'feed' : params.initial === 'profile' ? 'profile' : 'camera';
  const {
    activeView,
    feedTranslateY,
    cameraTranslateY,
    profileTranslateY,
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
  const profileData = useProfile();

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
    takePicture,
    pickImageFromLibrary,
    handlePostUpload,
    handleRequestDetailedAnalysis,
    clearPreview,
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

  // Fetch photo owner when photo is selected
  useEffect(() => {
    const fetchPhotoOwner = async () => {
      if (selectedPhoto?.user_id) {
        setLoadingOwner(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', selectedPhoto.user_id)
            .single();

          if (error) {
            console.error('Error fetching photo owner:', error);
            setPhotoOwner(null);
          } else {
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

    fetchPhotoOwner();
  }, [selectedPhoto]);

  const handlePhotoPress = (photo: FurnitureImage) => {
    setSelectedPhoto(photo);
  };

  const handleClosePhotoDetail = () => {
    setSelectedPhoto(null);
    setPhotoOwner(null);
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
    
    // Column width is approximately half the screen minus padding
    const columnWidth = (width - 20) / 2; // Account for container padding (10px each side)
    
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
            translateY={feedTranslateY}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCameraPress={goToCamera}
            feedPhotos={feedPhotos}
            loadingFeed={loadingFeed}
            refreshing={refreshing}
            onRefresh={onRefresh}
            columns={columns}
            onPhotoPress={handlePhotoPress}
          />
        )}

        {/* Photo Detail View */}
        {selectedPhoto && (
          <View style={styles.photoDetailContainer}>
            {/* Back button overlay on photo */}
            <TouchableOpacity 
              style={styles.photoDetailBackButton}
              onPress={handleClosePhotoDetail}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <ScrollView 
              style={styles.photoDetailScrollView}
              contentContainerStyle={styles.photoDetailContent}
            >
              <Image 
                source={{ uri: selectedPhoto.public_url }} 
                style={styles.photoDetailImage}
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
                      <Ionicons name="person" size={24} color="#666" />
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
                    <TouchableOpacity 
                      style={styles.photoDetailSaveButtonInline}
                      onPress={() => {
                        // Save functionality will be implemented later
                      }}
                    >
                      <Ionicons name="bookmark-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Camera Pane */}
        {activeView === 'camera' && (
          <CameraPane
            translateY={cameraTranslateY}
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
            onBackFromCamera={goBackFromCamera}
          />
        )}

        {/* Profile Pane */}
        {activeView === 'profile' && (
          <ProfilePane
            translateY={profileTranslateY}
            profileData={profileData}
            userEmail={user?.email}
            userCreatedAt={user?.created_at}
            activeProfileTab={activeProfileTab}
            onProfileTabChange={setActiveProfileTab}
            onSignOut={handleSignOut}
          />
        )}
          
        {/* Fixed Bottom Navigation Bar - Hidden on Camera */}
        {activeView !== 'camera' && (
          <View style={styles.bottomNav}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToFeed}
            >
              <Ionicons 
                name="grid-outline" 
                size={24} 
                color={getNavColor('feed')} 
              />
              <Text style={[styles.navLabel, isNavActive('feed') && styles.navLabelActive]}>
                Feed
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButtonCenter} 
              onPress={goToCamera}
            >
              <View style={styles.cameraNavButton}>
                <Ionicons 
                  name="camera" 
                  size={28} 
                  color="#000" 
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToProfile}
            >
              <Ionicons 
                name="person-outline" 
                size={24} 
                color={getNavColor('profile')} 
              />
              <Text style={[styles.navLabel, isNavActive('profile') && styles.navLabelActive]}>
                Profile
              </Text>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    zIndex: 1000,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navButtonCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  cameraNavButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
    height: width,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


