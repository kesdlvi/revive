import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50; // Lower threshold for easier swiping

const samplePhotos = [
  { id: 1, uri: 'https://picsum.photos/300/400?random=1', height: 400 },
  { id: 2, uri: 'https://picsum.photos/300/300?random=2', height: 300 },
  { id: 3, uri: 'https://picsum.photos/300/500?random=3', height: 500 },
  { id: 4, uri: 'https://picsum.photos/300/350?random=4', height: 350 },
  { id: 5, uri: 'https://picsum.photos/300/450?random=5', height: 450 },
  { id: 6, uri: 'https://picsum.photos/300/320?random=6', height: 320 },
  { id: 7, uri: 'https://picsum.photos/300/380?random=7', height: 380 },
  { id: 8, uri: 'https://picsum.photos/300/420?random=8', height: 420 },
  { id: 9, uri: 'https://picsum.photos/300/360?random=9', height: 360 },
  { id: 10, uri: 'https://picsum.photos/300/480?random=10', height: 480 },
  { id: 11, uri: 'https://picsum.photos/300/340?random=11', height: 340 },
  { id: 12, uri: 'https://picsum.photos/300/410?random=12', height: 410 },
];

export default function SwipeScreen() {
  const params = useLocalSearchParams();
  const initialView = params.initial === 'feed' ? -width : 0;
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const translateX = useRef(new Animated.Value(initialView)).current; // 0 = camera, -width = feed
  const lastX = useRef(initialView);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onGestureEvent = ({ nativeEvent }: any) => {
    // Allow both directions, clamp between -width and 0
    const x = Math.max(-width, Math.min(0, lastX.current + nativeEvent.translationX));
    translateX.setValue(x);
  };

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const swipeDistance = nativeEvent.translationX; // Positive = right, Negative = left
      
      // Determine which view we're currently on
      const isOnFeed = lastX.current <= -width / 2;
      
      let toValue;
      
      if (isOnFeed) {
        // Currently on feed - check if swiping right to go to camera
        if (swipeDistance > SWIPE_THRESHOLD) {
          toValue = 0; // Go to camera
        } else {
          toValue = -width; // Stay on feed
        }
      } else {
        // Currently on camera - check if swiping left to go to feed
        if (swipeDistance < -SWIPE_THRESHOLD) {
          toValue = -width; // Go to feed
        } else {
          toValue = 0; // Stay on camera
        }
      }

      Animated.timing(translateX, {
        toValue,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        lastX.current = toValue;
      });
    }
  };

  const goToCamera = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      lastX.current = 0;
    });
  };
  const goToFeed = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      lastX.current = -width;
    });
  };
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // @ts-ignore - takePictureAsync exists on CameraView
        const photo = await cameraRef.current.takePictureAsync();
        setPreviewUri(photo.uri);
        setShowPhotoSheet(true);
      } catch {
        Alert.alert('Error', 'Failed to take picture');
      }
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
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[styles.root, { transform: [{ translateX }] }]}>
        {/* Camera Pane */}
        <View style={styles.pane}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef}>
            {/* Camera UI hidden while preview is visible */}
            {!previewUri ? (
              <>
                <View style={styles.topControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={goToFeed}>
                    <Ionicons name="arrow-forward" size={24} color="white" />
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
                }}
              />
            ) : null}
          </CameraView>

          {/* Photo Bottom Sheet */}
          {showPhotoSheet && (
            <PhotoBottomSheet
              onClose={() => setShowPhotoSheet(false)}
            />
          )}
        </View>

        {/* Feed Pane */}
        <View style={styles.pane}>
          <View style={styles.feedHeader}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>Inspo</Text>
            <TouchableOpacity style={styles.headerButton}>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {columns.left.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                    <View style={styles.photoOverlay}>
                      <TouchableOpacity style={styles.likeButton}>
                        <Ionicons name="heart-outline" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                {columns.right.map(photo => (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                    <View style={styles.photoOverlay}>
                      <TouchableOpacity style={styles.likeButton}>
                        <Ionicons name="heart-outline" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          {/* Center Floating Camera Button */}
          <TouchableOpacity style={styles.fabCenter} onPress={goToCamera}>
            <Ionicons name="camera" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

// Full-screen draggable photo preview overlay
function PreviewOverlay({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <View style={styles.previewOverlay}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      <View style={styles.previewTopBar}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Bottom sheet that slides up from bottom showing photos
function PhotoBottomSheet({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'Inspo' | 'Community' | 'Revive'>('Inspo');

  // Generate different photo sets for each tab
  const getPhotosForTab = (tab: string) => {
    const basePhotos = samplePhotos;
    // Rotate/shuffle photos for variety
    if (tab === 'Community') {
      return basePhotos.map((p, i) => ({ ...p, id: p.id + 100, uri: `https://picsum.photos/300/${p.height}?random=${p.id + 20}` }));
    } else if (tab === 'Revive') {
      return basePhotos.map((p, i) => ({ ...p, id: p.id + 200, uri: `https://picsum.photos/300/${p.height}?random=${p.id + 40}` }));
    }
    return basePhotos;
  };

  const currentPhotos = useMemo(() => getPhotosForTab(activeTab), [activeTab]);

  // Use currentPhotos for Pinterest-style layout
  const columns = useMemo(() => {
    const left: any[] = [];
    const right: any[] = [];
    let lh = 0;
    let rh = 0;
    currentPhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, [currentPhotos]);
  const INITIAL_HEIGHT = height * 0.45; // 35% from bottom
  const MAX_HEIGHT = height * 0.95; // Can slide up to 90% of screen

  const translateY = useRef(new Animated.Value(height)).current; // Start off-screen
  const lastY = useRef(height - INITIAL_HEIGHT);
  const dragY = useRef(0);
  const THRESHOLD = 50;

  // Animate in when component mounts
  React.useEffect(() => {
    const targetY = height - INITIAL_HEIGHT;
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      lastY.current = targetY;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGestureEvent = ({ nativeEvent }: any) => {
    // Calculate new position based on drag - only allow dragging up
    const newY = lastY.current + nativeEvent.translationY;
    // Clamp between initial and max positions (no dragging down to close)
    const clampedY = Math.max(height - MAX_HEIGHT, Math.min(height - INITIAL_HEIGHT, newY));
    dragY.current = nativeEvent.translationY;
    translateY.setValue(clampedY);
  };

  const onStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.BEGAN) {
      // Track the starting position when drag begins - use the last known position
      // This will be updated after each animation completes
    }

    if (nativeEvent.state === State.END) {
      const dragDistance = dragY.current;

      // Only allow dragging up to expand, snap back to initial if dragged down
      if (dragDistance < -THRESHOLD) {
        // Dragging up - snap to max height
        Animated.spring(translateY, {
          toValue: height - MAX_HEIGHT,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start(() => {
          lastY.current = height - MAX_HEIGHT;
        });
      } else {
        // Snap back to initial position (no closing on drag down)
        Animated.spring(translateY, {
          toValue: height - INITIAL_HEIGHT,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start(() => {
          lastY.current = height - INITIAL_HEIGHT;
        });
      }
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onStateChange}>
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
            height: MAX_HEIGHT,
          }
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* Header with Tabs */}
        <View style={styles.bottomSheetHeader}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Inspo' && styles.activeTab]}
              onPress={() => setActiveTab('Inspo')}
            >
              <Text style={[styles.tabText, activeTab === 'Inspo' && styles.activeTabText]}>Inspo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Community' && styles.activeTab]}
              onPress={() => setActiveTab('Community')}
            >
              <Text style={[styles.tabText, activeTab === 'Community' && styles.activeTabText]}>Community</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Revive' && styles.activeTab]}
              onPress={() => setActiveTab('Revive')}
            >
              <Text style={[styles.tabText, activeTab === 'Revive' && styles.activeTabText]}>Revive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pinterest-style masonry layout */}
        <ScrollView
          style={styles.photoGridContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columns.left.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {columns.right.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={[styles.photo, { height: photo.height }]} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </PanGestureHandler>
  );
}

// Thin corner brackets overlay to suggest scan area
function ScanFrame() {
  const size = Math.min(width, height) * 0.65;
  const corner = 28;
  const stroke = 3;
  return (
    <View
      style={[
        styles.scanFrame,
        {
          width: size,
          height: size,
          top: (height - size) / 2,
          left: (width - size) / 2,
        },
      ]}
    >
      {/* Top-Left */}
      <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, left: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, left: 0 }]} />
      {/* Top-Right */}
      <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, right: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, right: 0 }]} />
      {/* Bottom-Left */}
      <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, left: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, left: 0 }]} />
      {/* Bottom-Right */}
      <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, right: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    width: width * 2,
  },
  pane: {
    width,
    height,
    backgroundColor: 'black',
  },
  camera: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
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
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    backgroundColor: '#000',
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', fontFamily: 'LibreFranklin-Bold' },
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
  photoOverlay: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 },
  likeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  shareButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  fabCenter: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    marginLeft: -28,
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
  scanFrame: {
    position: 'absolute',
    justifyContent: 'center',
  },
  cornerH: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  bottomSheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F0F0F0',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  photoGridContainer: {
    flex: 1,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.35, // Leave space for bottom sheet
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewTopBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});


