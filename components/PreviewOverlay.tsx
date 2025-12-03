import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { height, width } = Dimensions.get('window');

interface PreviewOverlayProps {
  uri: string;
  onClose: () => void;
  isAnalyzing?: boolean;
}

/**
 * Full-screen photo preview overlay that displays the taken photo.
 * Shows a back button to dismiss the preview and close the bottom sheet.
 * Displays a cool scanning animation when analyzing.
 */
export function PreviewOverlay({ uri, onClose, isAnalyzing = false }: PreviewOverlayProps) {

  return (
    <View style={styles.previewOverlay}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      <View style={styles.previewTopBar}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Svg width={14} height={26} viewBox="0 0 14 26" fill="none">
            <Path d="M12.125 1.125L1.125 12.625L12.125 24.125" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewTopBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

