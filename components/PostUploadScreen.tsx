import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostUploadScreenProps {
  imageUri: string;
  description: string;
  onDescriptionChange: (description: string) => void;
  onCancel: () => void;
  onUpload: () => void;
  isUploading: boolean;
  isValidatingFurniture: boolean;
  isFurnitureItem: boolean | null;
}

export function PostUploadScreen({
  imageUri,
  description,
  onDescriptionChange,
  onCancel,
  onUpload,
  isUploading,
  isValidatingFurniture,
  isFurnitureItem,
}: PostUploadScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll to end (where description input is) when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleDescriptionFocus = () => {
    // Scroll to end when input is focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {isValidatingFurniture && (
              <View style={styles.validatingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.validatingText}>Analyzing image...</Text>
              </View>
            )}
          </View>

          {/* Description Section */}
          {!isValidatingFurniture && (
            <>
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <TextInput
                  ref={descriptionInputRef}
                  style={styles.descriptionInput}
                  placeholder="Add a description (optional)"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={onDescriptionChange}
                  multiline
                  maxLength={500}
                  editable={!isUploading}
                  textAlignVertical="top"
                  onFocus={handleDescriptionFocus}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Upload Button */}
        {!isValidatingFurniture && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                (isUploading || isFurnitureItem === false) && styles.uploadButtonDisabled,
              ]}
              onPress={onUpload}
              disabled={isUploading || isFurnitureItem === false}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color={isFurnitureItem === false ? '#666' : '#000'}
                  />
                  <Text
                    style={[
                      styles.uploadButtonText,
                      isFurnitureItem === false && styles.uploadButtonTextDisabled,
                    ]}
                  >
                    Upload
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    aspectRatio: 1,
    maxHeight: SCREEN_HEIGHT * 0.35,
    backgroundColor: '#1A1A1A',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  validatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  validatingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  charCount: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#000',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonTextDisabled: {
    color: '#666',
  },
});

