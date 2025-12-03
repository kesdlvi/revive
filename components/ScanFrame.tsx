import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ScanFrameProps {
  isAnalyzing?: boolean;
}

/**
 * Visual overlay component that displays corner brackets to suggest a scan area.
 * Used in the camera view to guide users on where to position items.
 * Shows animated gradient colors when analyzing.
 */
export function ScanFrame({ isAnalyzing = false }: ScanFrameProps) {
  const colorProgress = useRef(new Animated.Value(0)).current;
  const size = Math.min(width, height) * 0.65;
  const corner = 28;
  const stroke = 3;

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
  const topLeftColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)'],
  });

  const topRightColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)'],
  });

  const bottomRightColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)'],
  });

  const bottomLeftColor = colorProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(138, 43, 226, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 255, 200, 1)', 'rgba(138, 43, 226, 1)'],
  });

  const cornerColor = isAnalyzing ? undefined : 'white';

  return (
    <View
      style={[
        styles.scanFrame,
        {
          width: size,
          height: size,
          top: (height - size) / 2,
          left: (width - size) / 2,
        },
      ]}
    >
      {/* Top-Left */}
      <Animated.View 
        style={[
          styles.cornerH, 
          { 
            width: corner, 
            height: stroke, 
            top: 0, 
            left: 0,
            backgroundColor: isAnalyzing ? topLeftColor : cornerColor,
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.cornerV, 
          { 
            width: stroke, 
            height: corner, 
            top: 0, 
            left: 0,
            backgroundColor: isAnalyzing ? topLeftColor : cornerColor,
          }
        ]} 
      />
      {/* Top-Right */}
      <Animated.View 
        style={[
          styles.cornerH, 
          { 
            width: corner, 
            height: stroke, 
            top: 0, 
            right: 0,
            backgroundColor: isAnalyzing ? topRightColor : cornerColor,
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.cornerV, 
          { 
            width: stroke, 
            height: corner, 
            top: 0, 
            right: 0,
            backgroundColor: isAnalyzing ? topRightColor : cornerColor,
          }
        ]} 
      />
      {/* Bottom-Left */}
      <Animated.View 
        style={[
          styles.cornerH, 
          { 
            width: corner, 
            height: stroke, 
            bottom: 0, 
            left: 0,
            backgroundColor: isAnalyzing ? bottomLeftColor : cornerColor,
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.cornerV, 
          { 
            width: stroke, 
            height: corner, 
            bottom: 0, 
            left: 0,
            backgroundColor: isAnalyzing ? bottomLeftColor : cornerColor,
          }
        ]} 
      />
      {/* Bottom-Right */}
      <Animated.View 
        style={[
          styles.cornerH, 
          { 
            width: corner, 
            height: stroke, 
            bottom: 0, 
            right: 0,
            backgroundColor: isAnalyzing ? bottomRightColor : cornerColor,
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.cornerV, 
          { 
            width: stroke, 
            height: corner, 
            bottom: 0, 
            right: 0,
            backgroundColor: isAnalyzing ? bottomRightColor : cornerColor,
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scanFrame: {
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 5,
  },
  cornerH: {
    position: 'absolute',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    borderRadius: 2,
  },
});

