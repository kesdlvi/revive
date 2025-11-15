import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { height } = Dimensions.get('window');

interface Photo {
  id: number;
  uri: string;
  height: number;
}

interface PhotoBottomSheetProps {
  onClose: () => void;
  samplePhotos: Photo[];
}

type TabType = 'Inspo' | 'Community' | 'Revive';

/**
 * Bottom sheet that slides up from the bottom showing photos in tabs.
 * Features three tabs (Inspo, Community, Revive) with Pinterest-style masonry layout.
 * Can be dragged up to expand, but cannot be dismissed by dragging down.
 */
export function PhotoBottomSheet({ onClose, samplePhotos }: PhotoBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Inspo');

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

  const currentPhotos = useMemo(() => getPhotosForTab(activeTab), [activeTab, samplePhotos]);

  // Use currentPhotos for Pinterest-style layout
  const columns = useMemo(() => {
    const left: Photo[] = [];
    const right: Photo[] = [];
    let lh = 0;
    let rh = 0;
    currentPhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, [currentPhotos]);
  
  const INITIAL_HEIGHT = height * 0.45; // 45% from bottom
  const MAX_HEIGHT = height * 0.95; // Can slide up to 95% of screen

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

const styles = StyleSheet.create({
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
  photoGridContainer: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: '100%',
    borderRadius: 12,
  },
});

