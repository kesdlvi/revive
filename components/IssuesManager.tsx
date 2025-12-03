import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { RepairIssue } from '@/types/furniture';

interface IssuesManagerProps {
  issues: RepairIssue[];
  onIssuesChange: (issues: RepairIssue[]) => void;
  editable?: boolean;
}

export function IssuesManager({ issues, onIssuesChange, editable = true }: IssuesManagerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState<RepairIssue | null>(null);
  const [issueText, setIssueText] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const issueTextInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isModalVisible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to show the focused input
        setTimeout(() => {
          if (descriptionInputRef.current?.isFocused()) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          } else {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [isModalVisible]);

  const handleAddIssue = () => {
    setEditingIssue(null);
    setIssueText('');
    setIssueDescription('');
    setIsModalVisible(true);
    // Scroll to top and focus first input after modal opens
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      issueTextInputRef.current?.focus();
    }, 100);
  };

  const handleEditIssue = (issue: RepairIssue) => {
    setEditingIssue(issue);
    setIssueText(issue.issue);
    setIssueDescription(issue.description || '');
    setIsModalVisible(true);
    // Scroll to top and focus first input after modal opens
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      issueTextInputRef.current?.focus();
    }, 100);
  };

  const handleSaveIssue = () => {
    if (!issueText.trim()) return;

    const newIssue: RepairIssue = {
      id: editingIssue?.id || Date.now().toString(),
      issue: issueText.trim(),
      description: issueDescription.trim() || undefined,
    };

    if (editingIssue) {
      // Update existing issue
      const updated = issues.map(i => (i.id === editingIssue.id ? newIssue : i));
      onIssuesChange(updated);
    } else {
      // Add new issue
      onIssuesChange([...issues, newIssue]);
    }

    setIsModalVisible(false);
    setIssueText('');
    setIssueDescription('');
    setEditingIssue(null);
  };

  const handleDeleteIssue = (issueId: string) => {
    onIssuesChange(issues.filter(i => i.id !== issueId));
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIssueText('');
    setIssueDescription('');
    setEditingIssue(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Repair Issues</Text>
        {editable && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddIssue}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add Issue</Text>
          </TouchableOpacity>
        )}
      </View>

      {issues.length === 0 ? (
        <Text style={styles.emptyText}>No issues added</Text>
      ) : (
        <View style={styles.issuesList}>
          {issues.map((issue) => (
            <View key={issue.id} style={styles.issueItem}>
              <View style={styles.issueContent}>
                <Text style={styles.issueText}>{issue.issue}</Text>
                {issue.description && (
                  <Text style={styles.issueDescription} numberOfLines={1}>
                    {issue.description}
                  </Text>
                )}
              </View>
              {editable && (
                <View style={styles.issueActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditIssue(issue)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteIssue(issue.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContent,
              { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIssue ? 'Edit Issue' : 'Add Issue'}
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issue *</Text>
                <TextInput
                  ref={issueTextInputRef}
                  style={styles.input}
                  placeholder="e.g., Broken leg, Scratched surface"
                  placeholderTextColor="#999"
                  value={issueText}
                  onChangeText={setIssueText}
                  maxLength={100}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  ref={descriptionInputRef}
                  style={[styles.input, styles.textArea]}
                  placeholder="Add more details about this issue..."
                  placeholderTextColor="#999"
                  value={issueDescription}
                  onChangeText={setIssueDescription}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !issueText.trim() && styles.saveButtonDisabled]}
                onPress={handleSaveIssue}
                disabled={!issueText.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  issuesList: {
    gap: 8,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  issueContent: {
    flex: 1,
    marginRight: 12,
  },
  issueText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  issueDescription: {
    color: '#999',
    fontSize: 13,
  },
  issueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 120,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 200,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

