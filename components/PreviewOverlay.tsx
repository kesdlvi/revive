import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const colorProgress = useRef(new Animated.Value(0)).current;
  const borderWidth = 5;

  // Animated gradient border with cycling colors
  useEffect(() => {
    if (isAnalyzing) {
      // Cycle through gradient colors (must use JS driver for color interpolation)
      const colorAnimation = Animated.loop(
        Animated.timing(colorProgress, {
          toValue: 1,
          duration: 3000, // Same duration as PhotoBottomSheet
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

  // Interpolate colors for gradient effect (#583C21 -> #A8C686 -> #583C21)
  const gradientColor1 = colorProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#583C21', '#A8C686', '#583C21'],
  });

  const gradientColor2 = colorProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#A8C686', '#583C21', '#A8C686'],
  });

  const imageHeight = height * 0.65; // Match previewOverlay bottom calculation

  return (
    <View style={styles.previewOverlay}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

      {/* Gradient border around entire screen */}
      {isAnalyzing && (
        <>
          {/* Top border */}
          <Animated.View 
            style={[
              styles.screenBorder,
              styles.borderTop,
              { 
                backgroundColor: gradientColor1,
              }
            ]} 
          />
          {/* Right border */}
          <Animated.View 
            style={[
              styles.screenBorder,
              styles.borderRight,
              { 
                backgroundColor: gradientColor2,
              }
            ]} 
          />
          {/* Bottom border */}
          <Animated.View 
            style={[
              styles.screenBorder,
              styles.borderBottom,
              { 
                backgroundColor: gradientColor1,
              }
            ]} 
          />
          {/* Left border */}
          <Animated.View 
            style={[
              styles.screenBorder,
              styles.borderLeft,
              { 
                backgroundColor: gradientColor2,
              }
            ]} 
          />
        </>
      )}

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
  screenBorder: {
    position: 'absolute',
    zIndex: 25,
  },
  borderTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 40, // iPhone-like rounded corner
    borderTopRightRadius: 40, // iPhone-like rounded corner
  },
  borderRight: {
    top: 0,
    right: 0,
    bottom: 0,
    width: 5,
    borderTopRightRadius: 40, // iPhone-like rounded corner
    borderBottomRightRadius: 40, // iPhone-like rounded corner
  },
  borderBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    borderBottomLeftRadius: 40, // iPhone-like rounded corner
    borderBottomRightRadius: 40, // iPhone-like rounded corner
  },
  borderLeft: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 40, // iPhone-like rounded corner
    borderBottomLeftRadius: 40, // iPhone-like rounded corner
  },
});

