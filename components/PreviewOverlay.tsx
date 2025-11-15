import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

interface PreviewOverlayProps {
  uri: string;
  onClose: () => void;
}

/**
 * Full-screen photo preview overlay that displays the taken photo.
 * Shows a back button to dismiss the preview and close the bottom sheet.
 */
export function PreviewOverlay({ uri, onClose }: PreviewOverlayProps) {
  return (
    <View style={styles.previewOverlay}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      <View style={styles.previewTopBar}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.35, // Leave space for bottom sheet
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewTopBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

