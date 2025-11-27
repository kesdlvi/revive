import { useState, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { ViewType } from '@/types/furniture';

export function useNavigation(initialView: ViewType) {
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [lastView, setLastView] = useState<ViewType>('feed'); // Track last page before camera

  // Animation values for page entrance effects
  const feedTranslateY = useRef(new Animated.Value(0)).current;
  const cameraTranslateY = useRef(new Animated.Value(0)).current;
  const profileTranslateY = useRef(new Animated.Value(0)).current;

  const animatePageEntrance = (translateY: Animated.Value) => {
    // Reset to starting position
    translateY.setValue(5); // Start slightly down
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -.001, // Move up slightly
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, // Return to normal position
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goToFeed = () => {
    setActiveView('feed');
    // Animate page entrance
    animatePageEntrance(feedTranslateY);
  };

  const goToCamera = () => {
    // Remember the current view before going to camera
    if (activeView !== 'camera') {
      setLastView(activeView);
    }
    setActiveView('camera');
    // Animate page entrance
    animatePageEntrance(cameraTranslateY);
  };

  const goToProfile = () => {
    setActiveView('profile');
    // Animate page entrance
    animatePageEntrance(profileTranslateY);
  };

  const goBackFromCamera = () => {
    // Go back to the last page the user was on
    if (lastView === 'feed') {
      goToFeed();
    } else if (lastView === 'profile') {
      goToProfile();
    } else {
      goToFeed(); // Default to feed if no last view
    }
  };

  // Helper to get nav button color (avoids TypeScript narrowing issues)
  const getNavColor = (view: ViewType) => activeView === view ? '#FFF' : '#666';
  const isNavActive = (view: ViewType) => activeView === view;

  return {
    activeView,
    lastView,
    feedTranslateY,
    cameraTranslateY,
    profileTranslateY,
    goToFeed,
    goToCamera,
    goToProfile,
    goBackFromCamera,
    getNavColor,
    isNavActive,
  };
}

