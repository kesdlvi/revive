import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

// Sample photo data - in a real app, this would come from an API
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

export default function FeedScreen() {
  const [columns, setColumns] = useState<{ left: any[], right: any[] }>({ left: [], right: [] });
  // Interactive swipe state
  const translateX = React.useRef(new Animated.Value(0)).current;
  const lastTranslationXRef = React.useRef(0);

  const onGestureEvent = ({ nativeEvent }: any) => {
    const x = Math.max(0, nativeEvent.translationX); // only allow right drag
    lastTranslationXRef.current = x;
    translateX.setValue(x);
  };

  React.useEffect(() => {
    // Distribute photos between columns for masonry layout
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    samplePhotos.forEach((photo) => {
      if (leftHeight <= rightHeight) {
        leftColumn.push(photo);
        leftHeight += photo.height;
      } else {
        rightColumn.push(photo);
        rightHeight += photo.height;
      }
    });

    setColumns({ left: leftColumn, right: rightColumn });
  }, []);

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const dragX = lastTranslationXRef.current;
      const shouldComplete = dragX > SWIPE_THRESHOLD;
      if (shouldComplete) {
        Animated.timing(translateX, {
          toValue: width,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          translateX.setValue(0);
          lastTranslationXRef.current = 0;
          router.replace('/camera');
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

  const navigateToCamera = () => {
    router.push('/camera');
  };

  // No navigation back to home from feed

  const PhotoCard = ({ photo }: { photo: any }) => (
    <View style={styles.photoCard}>
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
  );

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerButton} />

          <Text style={styles.headerTitle}>Inspiration Feed</Text>

        </View>

        {/* Masonry Grid */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columns.left.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </View>
            <View style={styles.column}>
              {columns.right.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Floating Camera Button */}
        <TouchableOpacity style={styles.floatingCameraButton} onPress={navigateToCamera}>
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>

        {/* Swipe Hint */}
        <View style={styles.swipeHint}>
          <View style={styles.swipeIndicator}>
            <Ionicons name="chevron-back" size={16} color="rgba(0,0,0,0.5)" />
            <Text style={styles.swipeText}>Swipe right for camera</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.5)" />
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  photoCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: '100%',
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  likeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCameraButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeText: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
    marginHorizontal: 8,
  },
});
