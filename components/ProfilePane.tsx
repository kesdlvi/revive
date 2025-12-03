import { NailIcon } from '@/components/NailIcon';
import { PencilIcon } from '@/components/PencilIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { supabase } from '@/lib/supabase';
import { uploadProfilePhoto } from '@/services/profilePhoto';
import { getSavedPosts } from '@/services/savedPosts';
import { getSavedTutorials, SavedTutorial } from '@/services/savedTutorials';
import { FurnitureImage } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ProfilePaneProps {
  scale: Animated.Value;
  profileData: { username?: string; avatar_url?: string } | null;
  userEmail?: string;
  userCreatedAt?: string;
  activeProfileTab: 'Created' | 'Saved';
  onProfileTabChange: (tab: 'Created' | 'Saved') => void;
  onSignOut: () => void;
  onPhotoPress?: (photo: FurnitureImage) => void;
  onTutorialPress?: (tutorial: SavedTutorial) => void;
  savedPhotos: Set<string>;
  onSaveToggle: (photoId: string) => Promise<void>;
  onProfileUpdate?: () => void;
}

export function ProfilePane({
  scale,
  profileData,
  userEmail,
  userCreatedAt,
  activeProfileTab,
  onProfileTabChange,
  onSignOut,
  onPhotoPress,
  onTutorialPress,
  savedPhotos,
  onSaveToggle,
  onProfileUpdate,
}: ProfilePaneProps) {
  const { user } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [savedPosts, setSavedPosts] = useState<FurnitureImage[]>([]);
  const [savedTutorials, setSavedTutorials] = useState<SavedTutorial[]>([]);
  const [createdPosts, setCreatedPosts] = useState<FurnitureImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSubTab, setSavedSubTab] = useState<'Posts' | 'Tutorials'>('Posts');

  // Fetch saved posts
  useEffect(() => {
    if (activeProfileTab === 'Saved' && savedSubTab === 'Posts' && user?.id) {
      setLoading(true);
      getSavedPosts(user.id).then(posts => {
        setSavedPosts(posts);
        setLoading(false);
      });
    }
  }, [activeProfileTab, savedSubTab, user?.id]);

  // Fetch saved tutorials
  useEffect(() => {
    if (activeProfileTab === 'Saved' && savedSubTab === 'Tutorials' && user?.id) {
      setLoading(true);
      getSavedTutorials(user.id).then(tutorials => {
        setSavedTutorials(tutorials);
        setLoading(false);
      });
    }
  }, [activeProfileTab, savedSubTab, user?.id]);

  // Fetch created posts
  useEffect(() => {
    if (activeProfileTab === 'Created' && user?.id) {
      setLoading(true);
      // Limit to 50 most recent posts to reduce egress
      supabase
        .from('furniture_images')
        .select('id, public_url, user_id, item, style, description, material, color, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data) {
            setCreatedPosts(data);
          }
          setLoading(false);
        });
    }
  }, [activeProfileTab, user?.id]);

  const currentPosts = activeProfileTab === 'Saved' ? savedPosts : createdPosts;

  // Load image dimensions
  const photoDimensions = useImageDimensions(currentPosts);

  // Calculate columns for masonry layout (same as FeedPane)
  const columnWidth = (width - 20 - 10) / 2; // padding + gap
  const columns = useMemo(() => {
    const left: (FurnitureImage & { height: number; aspectRatio: number })[] = [];
    const right: (FurnitureImage & { height: number; aspectRatio: number })[] = [];

    currentPosts.forEach((photo, index) => {
      const dimensions = photoDimensions[photo.id];
      const aspectRatio = dimensions ? dimensions.width / dimensions.height : 1;
      const photoHeight = dimensions ? (columnWidth / aspectRatio) : columnWidth * 1.2;
      
      const photoWithDimensions = {
        ...photo,
        height: photoHeight,
        aspectRatio,
      };

      if (index % 2 === 0) {
        left.push(photoWithDimensions);
      } else {
        right.push(photoWithDimensions);
      }
    });

    return { left, right, columnWidth };
  }, [currentPosts, photoDimensions, columnWidth]);

  const toggleSave = async (photoId: string, e: any) => {
    e.stopPropagation();
    await onSaveToggle(photoId);
  };

  const [showEditMenu, setShowEditMenu] = useState(false);

  const handleChangeProfilePhoto = async () => {
    if (!user?.id) return;

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        const uploadResult = await uploadProfilePhoto(result.assets[0].uri, user.id);
        
        if (uploadResult.success) {
          // Refresh profile data
          if (onProfileUpdate) {
            onProfileUpdate();
          }
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload profile photo');
        }
        setIsUploadingAvatar(false);
      }
    } catch (error: any) {
      console.error('Error changing profile photo:', error);
      Alert.alert('Error', 'Failed to change profile photo');
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Animated.View style={[styles.pane, { transform: [{ scale }] }]}>
      {/* Top Bar with Edit Button */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <View style={styles.editButtonContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditMenu(!showEditMenu)}
          >
            <PencilIcon size={26} color="#FFF" />
          </TouchableOpacity>
          
          {/* Edit Menu Bubble */}
          {showEditMenu && (
            <View style={styles.editMenu}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={async () => {
                  setShowEditMenu(false);
                  await handleChangeProfilePhoto();
                }}
              >
                <Text style={styles.menuItemText}>Change profile photo</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowEditMenu(false);
                  onSignOut();
                }}
              >
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Log out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.profileAvatar}
          onPress={handleChangeProfilePhoto}
          disabled={isUploadingAvatar}
        >
          {isUploadingAvatar ? (
            <ActivityIndicator size="large" color="#666" />
          ) : profileData?.avatar_url ? (
            <Image 
              source={{ uri: profileData.avatar_url }} 
              style={styles.profileAvatarImage}
            />
          ) : (
            <Ionicons name="person" size={60} color="#666" />
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {profileData?.username ? `@${profileData.username}` : userEmail}
        </Text>
        {userCreatedAt && (
          <Text style={styles.profileMemberSince}>
            Member since {new Date(userCreatedAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={styles.profileTab}
          onPress={() => onProfileTabChange('Created')}
        >
          <Text style={[styles.sectionTitle, activeProfileTab === 'Created' && styles.activeSectionTitle]}>
            Created
          </Text>
          {activeProfileTab === 'Created' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileTab}
          onPress={() => onProfileTabChange('Saved')}
        >
          <Text style={[styles.sectionTitle, activeProfileTab === 'Saved' && styles.activeSectionTitle]}>
            Saved
          </Text>
          {activeProfileTab === 'Saved' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Sub-tabs for Saved section */}
      {activeProfileTab === 'Saved' && (
        <View style={styles.subTabContainer}>
          <TouchableOpacity 
            style={styles.subTab}
            onPress={() => setSavedSubTab('Posts')}
          >
            <Text style={[styles.subTabText, savedSubTab === 'Posts' && styles.activeSubTabText]}>
              Posts
            </Text>
            {savedSubTab === 'Posts' && <View style={styles.subTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.subTab}
            onPress={() => setSavedSubTab('Tutorials')}
          >
            <Text style={[styles.subTabText, savedSubTab === 'Tutorials' && styles.activeSubTabText]}>
              Repair Plans
            </Text>
            {savedSubTab === 'Tutorials' && <View style={styles.subTabUnderline} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Posts Grid or Tutorials Grid */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeProfileTab === 'Saved' && savedSubTab === 'Tutorials' ? (
          // Saved Tutorials
          savedTutorials.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="hammer-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No repair plans yet</Text>
            </View>
          ) : (
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {savedTutorials.filter((_, i) => i % 2 === 0).map(tutorial => {
                  const firstIssue = tutorial.tutorial_plan?.tutorials?.[0]?.issue || 'Repair Tutorial';
                  return (
                    <View key={tutorial.id} style={styles.photoCard}>
                      <TouchableOpacity
                        onPress={() => onTutorialPress?.(tutorial)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: tutorial.scanned_image_uri }}
                          style={[styles.photo, { width: columns.columnWidth, height: columns.columnWidth * 1.2 }]}
                          resizeMode="cover"
                          fadeDuration={150}
                        />
                      </TouchableOpacity>
                      {/* User info section with issue name */}
                      <View style={styles.userInfo}>
                        <Text style={styles.username} numberOfLines={1}>
                          {firstIssue}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.column}>
                {savedTutorials.filter((_, i) => i % 2 === 1).map(tutorial => {
                  const firstIssue = tutorial.tutorial_plan?.tutorials?.[0]?.issue || 'Repair Tutorial';
                  return (
                    <View key={tutorial.id} style={styles.photoCard}>
                      <TouchableOpacity
                        onPress={() => onTutorialPress?.(tutorial)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: tutorial.scanned_image_uri }}
                          style={[styles.photo, { width: columns.columnWidth, height: columns.columnWidth * 1.2 }]}
                          resizeMode="cover"
                          fadeDuration={150}
                        />
                      </TouchableOpacity>
                      {/* User info section with issue name */}
                      <View style={styles.userInfo}>
                        <Text style={styles.username} numberOfLines={1}>
                          {firstIssue}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )
        ) : (
          // Saved Posts or Created Posts
          currentPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>
                No posts yet
              </Text>
            </View>
          ) : (
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {columns.left.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <TouchableOpacity
                      onPress={() => onPhotoPress?.(photo)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: photo.public_url }}
                        style={[styles.photo, { width: columns.columnWidth, height: photo.height }]}
                        resizeMode="contain"
                        fadeDuration={150}
                      />
                      {activeProfileTab === 'Saved' && savedSubTab === 'Posts' && (
                        <TouchableOpacity 
                          style={styles.savedButton}
                          onPress={(e) => toggleSave(photo.id, e)}
                        >
                          <NailIcon size={20} color={savedPhotos.has(photo.id) ? "#8AA64E" : "white"} filled={savedPhotos.has(photo.id)} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                    {/* User info - only show for saved posts */}
                    {activeProfileTab === 'Saved' && savedSubTab === 'Posts' && (
                      <View style={styles.userInfo}>
                        {photo.avatar_url ? (
                          <Image 
                            source={{ uri: photo.avatar_url }} 
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={16} color="#666" />
                          </View>
                        )}
                        <Text style={styles.username} numberOfLines={1}>
                          {photo.display_name || photo.username || 'Unknown'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                {columns.right.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <TouchableOpacity
                      onPress={() => onPhotoPress?.(photo)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: photo.public_url }}
                        style={[styles.photo, { width: columns.columnWidth, height: photo.height }]}
                        resizeMode="contain"
                        fadeDuration={150}
                      />
                      {activeProfileTab === 'Saved' && savedSubTab === 'Posts' && (
                        <TouchableOpacity 
                          style={styles.savedButton}
                          onPress={(e) => toggleSave(photo.id, e)}
                        >
                          <NailIcon size={20} color={savedPhotos.has(photo.id) ? "#8AA64E" : "white"} filled={savedPhotos.has(photo.id)} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                    {/* User info - only show for saved posts */}
                    {activeProfileTab === 'Saved' && savedSubTab === 'Posts' && (
                      <View style={styles.userInfo}>
                        {photo.avatar_url ? (
                          <Image 
                            source={{ uri: photo.avatar_url }} 
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={16} color="#666" />
                          </View>
                        )}
                        <Text style={styles.username} numberOfLines={1}>
                          {photo.display_name || photo.username || 'Unknown'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )
        )}
      </ScrollView>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  editButtonContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  editButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1001,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: '#FF3B30',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  profileMemberSince: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  profileTab: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  activeSectionTitle: {
    color: '#FFF',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFF',
  },
  subTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 24,
    backgroundColor: '#000',
  },
  subTab: {
    position: 'relative',
    paddingBottom: 8,
  },
  subTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeSubTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  subTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  masonryContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 10, 
    paddingTop: 10 
  },
  column: { 
    flex: 1, 
    paddingHorizontal: 5 
  },
  photoCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: { 
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
  },
  savedButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  signOutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  tutorialImageContainer: {
    position: 'relative',
    width: '100%',
  },
  tutorialOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F0A0A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tutorialIssueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
    flex: 1,
  },
});

