import { TutorialPlan } from '@/services/openai';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialsPageProps {
  tutorialPlan: TutorialPlan;
  onClose?: () => void;
  onGoToFeed?: () => void;
}

export function TutorialsPage({ tutorialPlan, onClose, onGoToFeed }: TutorialsPageProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  // Store completion state per issue
  const [completedStepsByIssue, setCompletedStepsByIssue] = useState<Map<string, Set<number>>>(new Map());
  const [materialsExpanded, setMaterialsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const tutorialContentRef = useRef<View>(null);
  const completionAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Get unique issues from tutorials
  const issues = useMemo(() => {
    return tutorialPlan.tutorials.map(t => t.issue);
  }, [tutorialPlan.tutorials]);

  // Get the selected tutorial
  const selectedTutorial = useMemo(() => {
    if (!selectedIssue) {
      return tutorialPlan.tutorials[0] || null;
    }
    return tutorialPlan.tutorials.find(t => t.issue === selectedIssue) || null;
  }, [selectedIssue, tutorialPlan.tutorials]);

  // Get completed steps for current issue
  const completedSteps = useMemo(() => {
    if (!selectedIssue) return new Set<number>();
    return completedStepsByIssue.get(selectedIssue) || new Set<number>();
  }, [selectedIssue, completedStepsByIssue]);


  // Set first issue as selected by default
  React.useEffect(() => {
    if (issues.length > 0 && !selectedIssue) {
      setSelectedIssue(issues[0]);
    }
  }, [issues, selectedIssue]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!selectedTutorial || !selectedTutorial.steps || selectedTutorial.steps.length === 0) {
      return 0;
    }
    return completedSteps.size / selectedTutorial.steps.length;
  }, [selectedTutorial, completedSteps]);

  // Check if all steps are completed
  const allStepsCompleted = selectedTutorial && selectedTutorial.steps && completedSteps.size === selectedTutorial.steps.length;

  // Animate completion message when all steps are completed
  useEffect(() => {
    if (allStepsCompleted) {
      // Reset and animate in
      completionAnimation.setValue(0);
      Animated.sequence([
        Animated.spring(completionAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset when not completed
      completionAnimation.setValue(0);
    }
  }, [allStepsCompleted, completionAnimation]);

  // Toggle step completion
  const toggleStepCompletion = (stepIndex: number) => {
    if (!selectedIssue) return;
    
    setCompletedStepsByIssue(prev => {
      const newMap = new Map(prev);
      const currentSteps = newMap.get(selectedIssue) || new Set<number>();
      const newSet = new Set(currentSteps);
      
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      
      newMap.set(selectedIssue, newSet);
      return newMap;
    });
  };

  // Toggle all steps completion
  const toggleAllStepsCompletion = () => {
    if (!selectedTutorial || !selectedTutorial.steps || !selectedIssue) return;
    const allStepIndices = selectedTutorial.steps.map((_, index) => index);
    const allCompleted = allStepIndices.every(index => completedSteps.has(index));
    
    setCompletedStepsByIssue(prev => {
      const newMap = new Map(prev);
      if (allCompleted) {
        // Uncomplete all steps
        newMap.set(selectedIssue, new Set<number>());
      } else {
        // Mark all steps as done
        newMap.set(selectedIssue, new Set(allStepIndices));
      }
      return newMap;
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleSaveTutorial = async () => {
    if (!selectedTutorial) {
      Alert.alert('Error', 'No tutorial selected.');
      return;
    }

    if (!tutorialContentRef.current) {
      Alert.alert('Error', 'Unable to capture tutorial. Please try again.');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Starting save process...');

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your photo library.');
        setIsSaving(false);
        return;
      }

      console.log('Capturing tutorial view...');
      // Capture the tutorial content as an image
      const uri = await captureRef(tutorialContentRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      console.log('Image captured, saving to library...', uri);
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('Asset created, creating album...');
      
      // Try to create album, but don't fail if it already exists
      try {
        await MediaLibrary.createAlbumAsync('reVive', asset, false);
      } catch (albumError: any) {
        // Album might already exist, that's okay
        console.log('Album creation note:', albumError);
      }

      Alert.alert('Success', 'Tutorial saved to your photo library!');
    } catch (error: any) {
      console.error('Error saving tutorial:', error);
      Alert.alert('Error', `Failed to save tutorial: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Repair Plan</Text>
        </View>
        {selectedTutorial && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveTutorial}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#A8C686" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#A8C686" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed Progress Bar */}
      {selectedTutorial && selectedTutorial.steps && selectedTutorial.steps.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressStepsContainer}>
            {selectedTutorial.steps.map((_, stepIndex) => {
              const isCompleted = completedSteps.has(stepIndex);
              const isLast = stepIndex === selectedTutorial.steps.length - 1;
              // Line should be green if current step is completed (we've progressed past it)
              const lineCompleted = isCompleted;
              return (
                <React.Fragment key={stepIndex}>
                  <View style={styles.progressStepWrapper}>
                    <View style={[
                      styles.progressCheckbox,
                      isCompleted && styles.progressCheckboxCompleted
                    ]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#000" />
                      ) : (
                        <View style={styles.progressCheckboxEmpty} />
                      )}
                    </View>
                  </View>
                  {!isLast && (
                    <View style={styles.progressLineContainer}>
                      <View style={[
                        styles.progressLine,
                        lineCompleted && styles.progressLineCompleted
                      ]} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
          {allStepsCompleted ? (
            <Animated.View 
              style={{
                opacity: completionAnimation,
                transform: [
                  {
                    scale: completionAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.progressTextCompleted}>Great work!</Text>
            </Animated.View>
          ) : (
            <Text style={styles.progressText}>
              {completedSteps.size} / {selectedTutorial.steps.length} steps completed
            </Text>
          )}
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Issue Buttons */}
        <View style={styles.issuesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.issuesScrollContent}
          >
            {issues.map((issue, index) => {
              const isSelected = selectedIssue === issue;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.issueButton,
                    isSelected && styles.issueButtonSelected
                  ]}
                  onPress={() => setSelectedIssue(issue)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.issueButtonText,
                    isSelected && styles.issueButtonTextSelected
                  ]}>
                    {issue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Tutorial Content */}
        {selectedTutorial && (
          <View ref={tutorialContentRef} collapsable={false} style={styles.tutorialsContainer}>
            <View style={styles.tutorialHeader}>
              <View style={styles.tutorialHeaderContent}>
                <Text style={styles.tutorialTitle}>{selectedTutorial.title}</Text>
              </View>
            </View>

            <View style={styles.tutorialContent}>
                {/* Materials - Always expanded when saving */}
                {selectedTutorial.materials && selectedTutorial.materials.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.materialsBox}>
                      <View style={styles.materialsHeader}>
                        <View style={styles.sectionTitle}>
                          <Ionicons name="construct-outline" size={18} color="#A8C686" />
                          <Text style={styles.sectionTitleText}>Materials Needed</Text>
                        </View>
                      </View>
                      <View style={styles.materialsList}>
                        {selectedTutorial.materials.map((material, matIndex) => (
                          <View key={matIndex} style={styles.materialItem}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#A8C686" />
                            <Text style={styles.materialText}>{material}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Steps */}
                {selectedTutorial.steps && selectedTutorial.steps.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionTitle}>
                        <Ionicons name="list-outline" size={18} color="#A8C686" />
                        <Text style={styles.sectionTitleText}>Steps</Text>
                      </View>
                      <TouchableOpacity
                        style={completedSteps.size === selectedTutorial.steps.length ? styles.completedBadge : styles.markDoneButton}
                        onPress={toggleAllStepsCompletion}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={completedSteps.size === selectedTutorial.steps.length ? "checkmark-circle" : "checkmark-circle-outline"} 
                          size={18} 
                          color="#A8C686" 
                        />
                        <Text style={completedSteps.size === selectedTutorial.steps.length ? styles.completedBadgeText : styles.markDoneButtonText}>
                          {completedSteps.size === selectedTutorial.steps.length ? "Completed" : "Mark as Done"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.stepsList}>
                      {selectedTutorial.steps.map((step, stepIndex) => {
                        const isCompleted = completedSteps.has(stepIndex);
                        // Only allow clicking:
                        // 1. The current step (first incomplete step)
                        // 2. The last completed step (to uncomplete it)
                        const firstIncompleteIndex = selectedTutorial.steps.findIndex((_, idx) => !completedSteps.has(idx));
                        const completedIndices = Array.from(completedSteps).sort((a, b) => b - a);
                        const lastCompletedIndex = completedIndices.length > 0 ? completedIndices[0] : -1;
                        
                        // Allow clicking if it's the current step (first incomplete) or the last completed step
                        const isClickable = stepIndex === firstIncompleteIndex || stepIndex === lastCompletedIndex;
                        const isLocked = !isClickable;
                        // Current step is the first incomplete step
                        const isCurrentStep = !isCompleted && stepIndex === firstIncompleteIndex;
                        
                        return (
                          <TouchableOpacity
                            key={stepIndex}
                            style={[
                              styles.stepBox,
                              isCurrentStep && styles.stepBoxCurrent,
                              isLocked && styles.stepBoxLocked
                            ]}
                            onPress={() => !isLocked && toggleStepCompletion(stepIndex)}
                            activeOpacity={isLocked ? 1 : 0.7}
                            disabled={isLocked}
                          >
                            <View style={[
                              styles.stepNumber,
                              isCompleted && styles.stepNumberCompleted,
                              isCurrentStep && styles.stepNumberCurrent,
                              isLocked && styles.stepNumberLocked
                            ]}>
                              {isLocked ? (
                                <Ionicons name="lock-closed" size={16} color="#666" />
                              ) : isCompleted ? (
                                <Ionicons name="checkmark" size={18} color="#A8C686" />
                              ) : (
                                <Text style={[
                                  styles.stepNumberText,
                                  isCurrentStep && styles.stepNumberTextCurrent
                                ]}>{stepIndex + 1}</Text>
                              )}
                            </View>
                            <Text style={[
                              styles.stepText,
                              isCompleted && styles.stepTextCompleted,
                              isLocked && styles.stepTextLocked
                            ]}>{step}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Go to Feed Button - Show when all steps are completed */}
                    {allStepsCompleted && (
                      <View style={styles.goToFeedContainer}>
                        <TouchableOpacity
                          style={styles.goToFeedButton}
                          onPress={() => {
                            if (onGoToFeed) {
                              onGoToFeed();
                            } else if (onClose) {
                              onClose();
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.goToFeedButtonText}>Exit tutorial</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#000',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  saveButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  issuesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  issuesScrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  issueButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  issueButtonSelected: {
    backgroundColor: 'rgba(168, 198, 134, 0.3)',
    borderColor: '#A8C686',
  },
  issueButtonText: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '500',
  },
  issueButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#000',
    zIndex: 10,
    borderTopWidth: 0,
  },
  progressStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  progressStepWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCheckboxCompleted: {
    backgroundColor: '#A8C686',
    borderColor: '#A8C686',
  },
  progressCheckboxEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
  },
  progressLineContainer: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#666',
  },
  progressLineCompleted: {
    backgroundColor: '#A8C686',
  },
  progressText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  progressTextCompleted: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A8C686',
    textAlign: 'center',
  },
  goToFeedContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  goToFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A8C686',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  goToFeedButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tutorialsContainer: {
    padding: 20,
  },
  tutorialCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  tutorialHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  tutorialContent: {
    padding: 16,
    paddingTop: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 198, 134, 0.2)',
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#A8C686',
    fontWeight: '600',
  },
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#A8C686',
  },
  markDoneButtonText: {
    fontSize: 12,
    color: '#A8C686',
    fontWeight: '600',
  },
  materialsBox: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#A8C686',
  },
  materialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  materialsList: {
    gap: 8,
    marginTop: 12,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  materialText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
  },
  stepsList: {
    gap: 12,
  },
  stepBox: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#A8C686',
    alignItems: 'flex-start',
  },
  stepBoxCurrent: {
    backgroundColor: 'rgba(168, 198, 134, 0.3)',
    borderColor: '#A8C686',
  },
  stepBoxLocked: {
    opacity: 0.5,
    borderColor: '#666',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberCurrent: {
    backgroundColor: '#A8C686',
    borderColor: '#A8C686',
  },
  stepNumberCompleted: {
    backgroundColor: 'transparent',
    borderColor: '#A8C686',
  },
  stepNumberLocked: {
    backgroundColor: '#333',
    borderColor: '#666',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CCC',
  },
  stepNumberTextCurrent: {
    color: '#000',
  },
  stepText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    lineHeight: 22,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  stepTextLocked: {
    color: '#666',
  },
  completionMessage: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  completionMessageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A8C686',
    marginTop: 12,
  },
});

