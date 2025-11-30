import { EditIcon } from '@/components/EditIcon';
import { NailIcon } from '@/components/NailIcon';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

type TabType = 'Inspo' | 'Revive';

/**
 * Bottom sheet that slides up from the bottom showing photos in tabs.
 * Features two tabs (Inspo, Revive) with Pinterest-style masonry layout.
 * Can be dragged up to expand, but cannot be dismissed by dragging down.
 */
export function PhotoBottomSheet({ onClose, samplePhotos, furnitureAnalysis, isAnalyzing, onRequestDetailedAnalysis }: PhotoBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Inspo');
  const [selectedRepairs, setSelectedRepairs] = useState<Set<string>>(new Set());
  const [customIssue, setCustomIssue] = useState('');
  const [customIssues, setCustomIssues] = useState<string[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<Set<number>>(new Set());

  const toggleSave = (photoId: number) => {
    setSavedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // Calculate columns for Inspo tab
  const inspoColumns = useMemo(() => {
    const left: Photo[] = [];
    const right: Photo[] = [];
    let lh = 0;
    let rh = 0;
    samplePhotos.forEach(p => {
      if (lh <= rh) { left.push(p); lh += p.height; } else { right.push(p); rh += p.height; }
    });
    return { left, right };
  }, [samplePhotos]);
  
  const INITIAL_HEIGHT = height * 0.5; // 50% from bottom (increased to show more content)
  const MAX_HEIGHT = height * 0.95; // Can slide up to 98% of screen

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
        {/* Drag handle - make it more visible and easier to grab */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

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
              <View style={styles.analysisContent}>
                <View style={styles.analysisTextContainer}>
                  <Text style={styles.analysisLabel}>Here&apos;s what we identified:</Text>
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
                <TouchableOpacity style={styles.editButton}>
                  <EditIcon size={26} color="#FFF" />
                </TouchableOpacity>
              </View>
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
            {!furnitureAnalysis?.repairNeeded && onRequestDetailedAnalysis && (
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
            
            {/* Repair Issues Section - Show after detailed analysis */}
            {furnitureAnalysis?.repairNeeded !== undefined && (
              <View style={styles.repairIssuesContainer}>
                <Text style={styles.repairIssuesTitle}>Repair issues found:</Text>
                
                {/* Show message if no issues found */}
                {(!furnitureAnalysis.repairNeeded || furnitureAnalysis.repairNeeded.length === 0) && customIssues.length === 0 && (
                  <Text style={styles.noIssuesText}>No repair issues detected. Add any issues you found below.</Text>
                )}
                
                {/* Show subtitle only if there are issues to select */}
                {((furnitureAnalysis.repairNeeded && furnitureAnalysis.repairNeeded.length > 0) || customIssues.length > 0) && (
                  <Text style={styles.repairIssuesSubtitle}>Select areas you want to repair</Text>
                )}
                
                {/* Suggested Repair Issues */}
                {furnitureAnalysis.repairNeeded && furnitureAnalysis.repairNeeded.length > 0 && (
                  <View style={styles.repairIssuesList}>
                    {furnitureAnalysis.repairNeeded.map((repair: string, index: number) => {
                      const isSelected = selectedRepairs.has(repair);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.repairIssueBox,
                            isSelected && styles.repairIssueBoxSelected
                          ]}
                          onPress={() => {
                            const newSelected = new Set(selectedRepairs);
                            if (isSelected) {
                              newSelected.delete(repair);
                            } else {
                              newSelected.add(repair);
                            }
                            setSelectedRepairs(newSelected);
                          }}
                        >
                          <Text style={[
                            styles.repairIssueText,
                            isSelected && styles.repairIssueTextSelected
                          ]}>
                            {repair}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                {/* Custom Issues */}
                {customIssues.length > 0 && (
                  <View style={styles.repairIssuesList}>
                    {customIssues.map((issue: string, index: number) => {
                      const isSelected = selectedRepairs.has(issue);
                      return (
                        <TouchableOpacity
                          key={`custom-${index}`}
                          style={[
                            styles.repairIssueBox,
                            isSelected && styles.repairIssueBoxSelected
                          ]}
                          onPress={() => {
                            const newSelected = new Set(selectedRepairs);
                            if (isSelected) {
                              newSelected.delete(issue);
                            } else {
                              newSelected.add(issue);
                            }
                            setSelectedRepairs(newSelected);
                          }}
                        >
                          <Text style={[
                            styles.repairIssueText,
                            isSelected && styles.repairIssueTextSelected
                          ]}>
                            {issue}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                {/* Add Custom Issue Input - Always show */}
                <View style={styles.addIssueContainer}>
                  <TextInput
                    style={styles.addIssueInput}
                    placeholder="Add an issue found"
                    placeholderTextColor="#666"
                    value={customIssue}
                    onChangeText={setCustomIssue}
                    onSubmitEditing={() => {
                      if (customIssue.trim()) {
                        setCustomIssues([...customIssues, customIssue.trim()]);
                        setCustomIssue('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[styles.addIssueButton, !customIssue.trim() && styles.addIssueButtonDisabled]}
                    onPress={() => {
                      if (customIssue.trim()) {
                        setCustomIssues([...customIssues, customIssue.trim()]);
                        setCustomIssue('');
                      }
                    }}
                    disabled={!customIssue.trim()}
                  >
                    <Ionicons name="add" size={24} color={customIssue.trim() ? "#007AFF" : "#666"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Pinterest-style masonry layout for Inspo tab */}
        <ScrollView
          style={[styles.photoGridContainer, activeTab === 'Revive' && styles.hidden]}
          showsVerticalScrollIndicator={false}
          pointerEvents={activeTab === 'Revive' ? 'none' : 'auto'}
        >
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {inspoColumns.left.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={[styles.photo, { height: photo.height }]} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.savedButton}
                    onPress={() => toggleSave(photo.id)}
                  >
                    <NailIcon size={24} color="white" filled={savedPhotos.has(photo.id)} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {inspoColumns.right.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={[styles.photo, { height: photo.height }]} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.savedButton}
                    onPress={() => toggleSave(photo.id)}
                  >
                    <NailIcon size={24} color="white" filled={savedPhotos.has(photo.id)} />
                  </TouchableOpacity>
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
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  dragHandleContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  analysisContainer: {
    borderRadius: 20,
    borderColor: '#FFFFFF25',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor:  '#FFFFFF1F',
  },
  analysisContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analysisTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  analysisSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  editButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  repairIssuesContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  repairIssuesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  repairIssuesSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  noIssuesText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  repairIssuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  repairIssueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  repairIssueBoxSelected: {
    backgroundColor: '#001F3F',
    borderColor: '#007AFF',
  },
  repairIssueText: {
    fontSize: 14,
    color: '#CCC',
  },
  repairIssueTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  addIssueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addIssueInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFF',
  },
  addIssueButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIssueButtonDisabled: {
    opacity: 0.5,
  },
  reviveContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  revivePromptContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reviveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  reviveDescription: {
    fontSize: 14,
    color: '#999',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailedSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  detailedSection: {
    marginBottom: 16,
  },
  detailedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailedText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
  },
  searchQueryItem: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#FFF',
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
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: '100%',
    borderRadius: 12,
  },
  savedButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});

