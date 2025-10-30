import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

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
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  const translateX = useRef(new Animated.Value(0)).current; // 0 = camera, -width = feed
  const lastX = useRef(0);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const onGestureEvent = ({ nativeEvent }: any) => {
    // Allow both directions, clamp between -width and 0
    const x = Math.max(-width, Math.min(0, lastX.current + nativeEvent.translationX));
    translateX.setValue(x);
  };

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const x = nativeEvent.translationX + lastX.current;
      const goingToFeed = x < -SWIPE_THRESHOLD;
      const goingToCamera = x > (-width + SWIPE_THRESHOLD);

      let toValue = 0;
      if (goingToFeed) toValue = -width;
      else if (!goingToCamera) toValue = -width; // if near middle, snap based on side

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

  const toggleCameraFacing = () => setFacing(cur => (cur === 'back' ? 'front' : 'back'));
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
        Alert.alert('Photo taken!', `Saved to: ${photo.uri}`);
      } catch (e) {
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
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={goToFeed}>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.bottomLeft}>
                <TouchableOpacity style={styles.controlButton}>
                  <Ionicons name="images" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.captureContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
              <View style={styles.bottomRight}>
                <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                  <Ionicons name="camera-reverse" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
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
            <Ionicons name="camera" size={24} color="black"  />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomLeft: { flex: 1, alignItems: 'flex-start' },
  bottomRight: { flex: 1, alignItems: 'flex-end' },
  captureContainer: { flex: 1, alignItems: 'center' },
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
});


