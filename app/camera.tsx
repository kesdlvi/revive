import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Interactive swipe state
  const translateX = React.useRef(new Animated.Value(0)).current;
  const lastTranslationXRef = React.useRef(0);

  const onGestureEvent = ({ nativeEvent }: any) => {
    const x = Math.min(0, nativeEvent.translationX); // only allow left drag
    lastTranslationXRef.current = x;
    translateX.setValue(x);
  };

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const dragX = lastTranslationXRef.current;
      const shouldComplete = dragX < -SWIPE_THRESHOLD;
      if (shouldComplete) {
        Animated.timing(translateX, {
          toValue: -width,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          translateX.setValue(0);
          lastTranslationXRef.current = 0;
          router.replace('/feed');
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start(() => {
          lastTranslationXRef.current = 0;
        });
      }
    }
  };

  // No animated styles needed for simple swipe navigation

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        Alert.alert('Photo taken!', `Saved to: ${photo.uri}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const navigateToFeed = () => {
    router.push('/feed');
  };

  // No navigation back to home from camera

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
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
              <TouchableOpacity style={styles.feedButton} onPress={navigateToFeed}>
                <Ionicons name="grid" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <View style={styles.swipeIndicator}>
              <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.swipeText}>Swipe left for feed</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </CameraView>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  bottomLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bottomRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    flex: 1,
    alignItems: 'center',
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
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  feedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swipeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginHorizontal: 8,
  },
});
