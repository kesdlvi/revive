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
  furnitureAnalysis?: any;
  isAnalyzing?: boolean;
  onRequestDetailedAnalysis?: () => void;
}

type TabType = 'Inspo' | 'Community' | 'Revive';

/**
 * Bottom sheet that slides up from the bottom showing photos in tabs.
 * Features three tabs (Inspo, Community, Revive) with Pinterest-style masonry layout.
 * Can be dragged up to expand, but cannot be dismissed by dragging down.
 */
export function PhotoBottomSheet({ onClose, samplePhotos, furnitureAnalysis, isAnalyzing, onRequestDetailedAnalysis }: PhotoBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Inspo');

  // Calculate columns separately for Inspo and Community tabs only
  // This prevents recalculation when switching to/from Revive tab
  const inspoPhotos = useMemo(() => samplePhotos, [samplePhotos]);
  const communityPhotos = useMemo(() => {
    return samplePhotos.map((p, i) => ({ ...p, id: p.id + 100, uri: `https://picsum.photos/300/${p.height}?random=${p.id + 20}` }));
  }, [samplePhotos]);

  const inspoColumns = useMemo(() => {
    const left: Photo[] = [];
    const right: Photo[] = [];
    let lh = 0;
    let rh = 0;
    inspoPhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, [inspoPhotos]);

  const communityColumns = useMemo(() => {
    const left: Photo[] = [];
    const right: Photo[] = [];
    let lh = 0;
    let rh = 0;
    communityPhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, [communityPhotos]);

  // Select columns based on active tab - memoized to prevent unnecessary re-renders
  const columns = useMemo(() => {
    return activeTab === 'Community' ? communityColumns : inspoColumns;
  }, [activeTab, communityColumns, inspoColumns]);
  
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
          {/* Analysis Results Display */}
          {isAnalyzing && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisText}>Analyzing furniture...</Text>
            </View>
          )}
          {furnitureAnalysis && !isAnalyzing && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisLabel}>Identified:</Text>
              <Text style={styles.analysisText}>
                {furnitureAnalysis.item || 'Unknown furniture'}
              </Text>
              {furnitureAnalysis.style && (
                <Text style={styles.analysisSubtext}>
                  {furnitureAnalysis.style}
                  {furnitureAnalysis.material && ` • ${furnitureAnalysis.material}`}
                </Text>
              )}
            </View>
          )}
          
          {/* Tabs */}
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

        {/* Content based on active tab - keep both mounted to prevent image reload */}
        {/* Revive Tab Content */}
        <ScrollView
          style={[styles.photoGridContainer, activeTab !== 'Revive' && styles.hidden]}
          showsVerticalScrollIndicator={false}
          pointerEvents={activeTab === 'Revive' ? 'auto' : 'none'}
        >
          <View style={styles.reviveContent}>
            {/* Detailed Analysis Section */}
            {!furnitureAnalysis?.style && !furnitureAnalysis?.condition && onRequestDetailedAnalysis && (
              <View style={styles.revivePromptContainer}>
                <Text style={styles.reviveTitle}>Get Repair Analysis</Text>
                <Text style={styles.reviveDescription}>
                  Get detailed analysis including condition, repair needs, and tutorial search queries for this furniture item.
                </Text>
                <TouchableOpacity 
                  style={styles.detailedAnalysisButton}
                  onPress={onRequestDetailedAnalysis}
                  disabled={isAnalyzing}
                >
                  <Text style={styles.detailedAnalysisButtonText}>
                    {isAnalyzing ? 'Analyzing...' : 'Run Detailed Analysis'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Detailed Analysis Results */}
            {furnitureAnalysis?.style && (
              <View style={styles.detailedAnalysisContainer}>
                <Text style={styles.detailedSectionTitle}>Detailed Analysis</Text>
                
                {furnitureAnalysis.description && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Description</Text>
                    <Text style={styles.detailedText}>{furnitureAnalysis.description}</Text>
                  </View>
                )}
                
                {furnitureAnalysis.style && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Style</Text>
                    <Text style={styles.detailedText}>{furnitureAnalysis.style}</Text>
                  </View>
                )}
                
                {furnitureAnalysis.material && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Material</Text>
                    <Text style={styles.detailedText}>{furnitureAnalysis.material}</Text>
                  </View>
                )}
                
                {furnitureAnalysis.color && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Color</Text>
                    <Text style={styles.detailedText}>{furnitureAnalysis.color}</Text>
                  </View>
                )}
                
                {furnitureAnalysis.condition && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Condition</Text>
                    <Text style={styles.detailedText}>{furnitureAnalysis.condition}</Text>
                  </View>
                )}
                
                {furnitureAnalysis.repairNeeded && furnitureAnalysis.repairNeeded.length > 0 && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Repair Needed</Text>
                    {furnitureAnalysis.repairNeeded.map((repair: string, index: number) => (
                      <Text key={index} style={styles.repairItem}>• {repair}</Text>
                    ))}
                  </View>
                )}
                
                {furnitureAnalysis.searchQueries && furnitureAnalysis.searchQueries.length > 0 && (
                  <View style={styles.detailedSection}>
                    <Text style={styles.detailedLabel}>Repair Tutorial Search Queries</Text>
                    {furnitureAnalysis.searchQueries.map((query: string, index: number) => (
                      <Text key={index} style={styles.searchQueryItem}>• {query}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Pinterest-style masonry layout for Inspo and Community tabs */}
        <ScrollView
          style={[styles.photoGridContainer, activeTab === 'Revive' && styles.hidden]}
          showsVerticalScrollIndicator={false}
          pointerEvents={activeTab === 'Revive' ? 'none' : 'auto'}
        >
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columns.left.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={[styles.photo, { height: photo.height }]} 
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {columns.right.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={[styles.photo, { height: photo.height }]} 
                    resizeMode="cover"
                  />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  analysisContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  analysisSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  repairNeededContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  repairLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  repairItem: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reviveContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  revivePromptContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reviveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  reviveDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailedAnalysisButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  detailedAnalysisButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailedAnalysisContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailedSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  detailedSection: {
    marginBottom: 16,
  },
  detailedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailedText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  searchQueryItem: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
  hidden: {
    opacity: 0,
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});

