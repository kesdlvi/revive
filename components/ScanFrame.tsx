import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Visual overlay component that displays corner brackets to suggest a scan area.
 * Used in the camera view to guide users on where to position items.
 */
export function ScanFrame() {
  const size = Math.min(width, height) * 0.65;
  const corner = 28;
  const stroke = 3;

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
      <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, left: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, left: 0 }]} />
      {/* Top-Right */}
      <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, right: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, right: 0 }]} />
      {/* Bottom-Left */}
      <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, left: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, left: 0 }]} />
      {/* Bottom-Right */}
      <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, right: 0 }]} />
      <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, right: 0 }]} />
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
    backgroundColor: 'white',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2,
  },
});

