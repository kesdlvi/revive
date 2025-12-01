import { TutorialPlan } from '@/services/openai';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialsPageProps {
  tutorialPlan: TutorialPlan;
  onClose?: () => void;
}

export function TutorialsPage({ tutorialPlan, onClose }: TutorialsPageProps) {
  const [expandedTutorial, setExpandedTutorial] = useState<number | null>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FF9800';
      case 'Hard':
        return '#F44336';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Repair Plan</Text>
          <Text style={styles.headerSubtitle}>{tutorialPlan.furnitureItem}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tutorials List */}
        <View style={styles.tutorialsContainer}>
          <Text style={styles.tutorialsTitle}>Tutorials</Text>
          {tutorialPlan.tutorials.map((tutorial, index) => {
            const isExpanded = expandedTutorial === index;
            return (
              <View key={index} style={styles.tutorialCard}>
                {/* Tutorial Header */}
                <TouchableOpacity
                  style={styles.tutorialHeader}
                  onPress={() => setExpandedTutorial(isExpanded ? null : index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tutorialHeaderContent}>
                    <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                    <Text style={styles.tutorialIssue}>{tutorial.issue}</Text>
                    <View style={styles.tutorialMeta}>
                      {tutorial.difficulty && (
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(tutorial.difficulty) + '20', borderColor: getDifficultyColor(tutorial.difficulty) }]}>
                          <Text style={[styles.difficultyText, { color: getDifficultyColor(tutorial.difficulty) }]}>
                            {tutorial.difficulty}
                          </Text>
                        </View>
                      )}
                      {tutorial.estimatedTime && (
                        <View style={styles.timeBadge}>
                          <Ionicons name="time-outline" size={14} color="#999" />
                          <Text style={styles.timeText}>{tutorial.estimatedTime}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>

                {/* Tutorial Content - Expanded */}
                {isExpanded && (
                  <View style={styles.tutorialContent}>
                    {/* Materials */}
                    {tutorial.materials && tutorial.materials.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionTitle}>
                          <Ionicons name="construct-outline" size={18} color="#007AFF" />
                          <Text style={styles.sectionTitleText}>Materials Needed</Text>
                        </View>
                        <View style={styles.materialsList}>
                          {tutorial.materials.map((material, matIndex) => (
                            <View key={matIndex} style={styles.materialItem}>
                              <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" />
                              <Text style={styles.materialText}>{material}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Steps */}
                    {tutorial.steps && tutorial.steps.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionTitle}>
                          <Ionicons name="list-outline" size={18} color="#007AFF" />
                          <Text style={styles.sectionTitleText}>Steps</Text>
                        </View>
                        <View style={styles.stepsList}>
                          {tutorial.steps.map((step, stepIndex) => (
                            <View key={stepIndex} style={styles.stepItem}>
                              <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                              </View>
                              <Text style={styles.stepText}>{step}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Tips */}
                    {tutorial.tips && tutorial.tips.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionTitle}>
                          <Ionicons name="bulb-outline" size={18} color="#FFD700" />
                          <Text style={styles.sectionTitleText}>Tips</Text>
                        </View>
                        <View style={styles.tipsList}>
                          {tutorial.tips.map((tip, tipIndex) => (
                            <View key={tipIndex} style={styles.tipItem}>
                              <Ionicons name="star-outline" size={16} color="#FFD700" />
                              <Text style={styles.tipText}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  tutorialsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  tutorialsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
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
  },
  tutorialHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  tutorialIssue: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  tutorialContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  materialsList: {
    gap: 8,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  materialText: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  stepText: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
    lineHeight: 20,
    paddingTop: 4,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
    lineHeight: 20,
  },
});

