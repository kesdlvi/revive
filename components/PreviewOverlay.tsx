import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const colorProgress = useRef(new Animated.Value(0)).current;

  // Animated gradient border with cycling colors
  useEffect(() => {
    if (isAnalyzing) {
      // Cycle through gradient colors (must use JS driver for color interpolation)
      const colorAnimation = Animated.loop(
        Animated.timing(colorProgress, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false, // Color interpolation needs JS driver
        })
      );
      colorAnimation.start();

      return () => {
        colorAnimation.stop();
      };
    } else {
      // Reset value when not analyzing
      colorProgress.setValue(0);
    }
  }, [isAnalyzing, colorProgress]);

  // Interpolate colors for gradient effect (purple -> blue -> cyan -> purple)
  const topColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)'],
  });

  const rightColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)'],
  });

  const bottomColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)'],
  });

  const leftColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)'],
  });

  return (
    <View style={styles.previewOverlay}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      {/* Animated Gradient Border */}
      {isAnalyzing && (
        <>
          {/* Top border */}
          <Animated.View
            style={[
              styles.gradientBorder,
              styles.borderTop,
              {
                backgroundColor: topColor,
              },
            ]}
            pointerEvents="none"
          />

          {/* Right border */}
          <Animated.View
            style={[
              styles.gradientBorder,
              styles.borderRight,
              {
                backgroundColor: rightColor,
              },
            ]}
            pointerEvents="none"
          />

          {/* Bottom border */}
          <Animated.View
            style={[
              styles.gradientBorder,
              styles.borderBottom,
              {
                backgroundColor: bottomColor,
              },
            ]}
            pointerEvents="none"
          />

          {/* Left border */}
          <Animated.View
            style={[
              styles.gradientBorder,
              styles.borderLeft,
              {
                backgroundColor: leftColor,
              },
            ]}
            pointerEvents="none"
          />
        </>
      )}

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
    zIndex: 20,
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
  gradientBorder: {
    position: 'absolute',
  },
  borderTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  borderRight: {
    top: 0,
    right: 0,
    bottom: 0,
    width: 3,
  },
  borderBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  borderLeft: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
  },
});

