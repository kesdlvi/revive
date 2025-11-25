import { PhotoBottomSheet } from '@/components/PhotoBottomSheet';
import { PreviewOverlay } from '@/components/PreviewOverlay';
import { ScanFrame } from '@/components/ScanFrame';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeFurniture } from '@/services/openai';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const samplePhotos = [
  { id: 1, uri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', height: 400 },
  { id: 2, uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', height: 300 },
  { id: 3, uri: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80', height: 500 },
  { id: 4, uri: 'https://images.unsplash.com/photo-1551298370-9c4a0e0b1a0e?w=800&q=80', height: 350 },
  { id: 5, uri: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80', height: 450 },
  { id: 6, uri: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80', height: 320 },
  { id: 7, uri: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', height: 380 },
  { id: 8, uri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', height: 420 },
  { id: 9, uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', height: 360 },
  { id: 10, uri: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80', height: 480 },
  { id: 11, uri: 'https://images.unsplash.com/photo-1551298370-9c4a0e0b1a0e?w=800&q=80', height: 340 },
  { id: 12, uri: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80', height: 410 },
];

type ViewType = 'feed' | 'camera' | 'profile';

export default function SwipeScreen() {
  const params = useLocalSearchParams();
  const { user, signOut } = useAuth();
  const getInitialView = () => {
    if (params.initial === 'feed') return 0; // Feed is the first pane (leftmost)
    if (params.initial === 'profile') return -width * 2; // Profile is the third pane (rightmost)
    return -width; // Camera is the second pane (middle)
  };
  const initialView = getInitialView();
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [furnitureAnalysis, setFurnitureAnalysis] = useState<any>(null);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewType>(params.initial === 'feed' ? 'feed' : params.initial === 'profile' ? 'profile' : 'camera');
  const [lastView, setLastView] = useState<ViewType>('feed'); // Track last page before camera
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'Created' | 'Saved'>('Created');
  const [profileData, setProfileData] = useState<{ username?: string } | null>(null);

  // Fetch profile data when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfileData(data);
        }
      }
    };

    fetchProfile();
  }, [user?.id]);

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

  const translateX = useRef(new Animated.Value(initialView)).current; // -width = feed (left), 0 = camera (middle), width = profile (right)
  const lastX = useRef(initialView);
  
  // Animation values for page entrance effects
  const feedTranslateY = useRef(new Animated.Value(0)).current;
  const cameraTranslateY = useRef(new Animated.Value(0)).current;
  const profileTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const animatePageEntrance = (translateY: Animated.Value) => {
    // Reset to starting position
    translateY.setValue(5); // Start slightly down
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -.001, // Move up slightly
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, // Return to normal position
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Helper to get nav button color (avoids TypeScript narrowing issues)
  const getNavColor = (view: ViewType) => activeView === view ? '#FFF' : '#666';
  const isNavActive = (view: ViewType) => activeView === view;

  const goToFeed = () => {
    setActiveView('feed');
    // Animate page entrance
    animatePageEntrance(feedTranslateY);
  };
  const goToCamera = () => {
    // Remember the current view before going to camera
    if (activeView !== 'camera') {
      setLastView(activeView);
    }
    setActiveView('camera');
    // Animate page entrance
    animatePageEntrance(cameraTranslateY);
  };
  const goToProfile = () => {
    setActiveView('profile');
    // Animate page entrance
    animatePageEntrance(profileTranslateY);
  };
  const goBackFromCamera = () => {
    // Go back to the last page the user was on
    if (lastView === 'feed') {
      goToFeed();
    } else if (lastView === 'profile') {
      goToProfile();
    } else {
      goToFeed(); // Default to feed if no last view
    }
  };
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // @ts-ignore - takePictureAsync exists on CameraView
        const photo = await cameraRef.current.takePictureAsync();
        setPreviewUri(photo.uri);
        setCurrentPhotoUri(photo.uri);
        setShowPhotoSheet(true);
        
        // Analyze the furniture (start with simple mode only)
        setIsAnalyzing(true);
        try {
          // Start with simple identification only (saves cost)
          const simpleResult = await analyzeFurniture(photo.uri, 'simple');
          setFurnitureAnalysis(simpleResult);
        } catch (error: any) {
          console.error('Analysis error:', error);
          const errorMessage = error?.message || 'Failed to analyze furniture';
          Alert.alert(
            'Analysis Error',
            errorMessage + '\n\nShowing photo anyway.',
            [{ text: 'OK' }]
          );
        } finally {
          setIsAnalyzing(false);
        }
      } catch {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleRequestDetailedAnalysis = async () => {
    if (!currentPhotoUri) return;
    
    setIsAnalyzing(true);
    try {
      const detailedResult = await analyzeFurniture(currentPhotoUri, 'detailed');
      setFurnitureAnalysis(detailedResult);
    } catch (error: any) {
      console.error('Detailed analysis error:', error);
      const errorMessage = error?.message || 'Failed to get detailed analysis';
      Alert.alert('Analysis Error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const columns = useMemo(() => {
    const left: any[] = [];
    const right: any[] = [];
    let lh = 0;
    let rh = 0;
    samplePhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, []);

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
        <Animated.View style={[styles.pane, { transform: [{ translateY: feedTranslateY }] }]}>
          {/* Search Bar (Airbnb style) */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search reVive"
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={goToCamera} style={styles.cameraButton}>
                  <Ionicons name="camera" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {columns.left.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                    <TouchableOpacity style={styles.savedButton}>
                      <Ionicons name="bookmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                {columns.right.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                    <TouchableOpacity style={styles.savedButton}>
                      <Ionicons name="bookmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        )}

        {/* Camera Pane */}
        {activeView === 'camera' && (
        <Animated.View style={[styles.pane, { transform: [{ translateY: cameraTranslateY }] }]}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef} flash={flashEnabled ? 'on' : 'off'} />
          
          {/* Camera UI hidden while preview is visible */}
          {!previewUri ? (
            <>
              <View style={styles.topControls}>
                <TouchableOpacity style={styles.controlButton} onPress={goBackFromCamera}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={() => setFlashEnabled(!flashEnabled)}>
                  <Ionicons 
                    name={flashEnabled ? 'flash' : 'flash-off'} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>

              {/* AR-style scan corners overlay */}
              <ScanFrame />

              <View style={styles.bottomControls}>
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* Photo Preview Overlay */}
          {previewUri ? (
            <PreviewOverlay
              uri={previewUri}
              onClose={() => {
                setPreviewUri(null);
                setShowPhotoSheet(false);
                setFurnitureAnalysis(null);
                setCurrentPhotoUri(null);
              }}
            />
          ) : null}

          {/* Photo Bottom Sheet */}
          {showPhotoSheet && (
            <PhotoBottomSheet
              onClose={() => {
                setShowPhotoSheet(false);
                setFurnitureAnalysis(null);
                setCurrentPhotoUri(null);
              }}
              samplePhotos={samplePhotos}
              furnitureAnalysis={furnitureAnalysis}
              isAnalyzing={isAnalyzing}
              onRequestDetailedAnalysis={handleRequestDetailedAnalysis}
            />
          )}
        </Animated.View>
        )}

        {/* Profile Pane */}
        {activeView === 'profile' && (
        <Animated.View style={[styles.pane, { transform: [{ translateY: profileTranslateY }] }]}>
          <View style={styles.profileContainer}>
            {/* Edit Button */}
            <View style={styles.profileTopBar}>
              <View style={{ width: 44 }} />
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
        
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.profileContent}>
              <View style={styles.profileAvatarContainer}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={60} color="#666" />
                </View>
                <Text style={styles.profileName}>
                  {profileData?.username ? `@${profileData.username}` : user?.email}
                </Text>
                {user?.created_at && (
                  <Text style={styles.profileMemberSince}>
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={styles.profileSection}>
                <TouchableOpacity 
                  style={styles.profileTab}
                  onPress={() => setActiveProfileTab('Created')}
                >
                  <Text style={[styles.sectionTitle, activeProfileTab === 'Created' && styles.activeSectionTitle]}>
                    Created
                  </Text>
                  {activeProfileTab === 'Created' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.profileTab}
                  onPress={() => setActiveProfileTab('Saved')}
                >
                  <Text style={[styles.sectionTitle, activeProfileTab === 'Saved' && styles.activeSectionTitle]}>
                    Saved
                  </Text>
                  {activeProfileTab === 'Saved' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              </View>
              <Text style={styles.emptyText}>No posts yet</Text>
              
              {/* Sign Out Button */}
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
          </ScrollView>
        </View>
        </Animated.View>
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
  pane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  camera: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100, // Increased from 40 to move button higher up
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },

  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  permissionText: { fontSize: 16, textAlign: 'center', marginVertical: 20, color: '#666' },
  permissionButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  permissionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFF',
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    padding: 0,
    height: '100%',
    textAlignVertical: 'center',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  cameraButton: {
    marginLeft: 8,
    padding: 4,
  },
  masonryContainer: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10 },
  column: { flex: 1, paddingHorizontal: 5 },
  photoCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: { width: '100%', borderRadius: 12 },
  savedButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  profileTopBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  editButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileContent: {
    padding: 20,
    paddingTop: 120, // Add top padding to move content down
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#999',
  },
  profileMemberSince: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
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
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
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
});


