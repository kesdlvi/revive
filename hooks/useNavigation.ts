import { ViewType } from '@/types/furniture';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export function useNavigation(initialView: ViewType) {
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [lastView, setLastView] = useState<ViewType>('feed'); // Track last page before camera
  const hasAnimatedInitial = useRef(false);
  const isInitialMount = useRef(true);

  // Animation values for page entrance effects (scale animation)
  const feedScale = useRef(new Animated.Value(1)).current;
  const cameraScale = useRef(new Animated.Value(1)).current;
  const profileScale = useRef(new Animated.Value(1)).current;

  const animatePageEntrance = (scale: Animated.Value) => {
    // Scale animation: smaller then bigger
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.998, // Scale down to 99%
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1, // Scale back to 100%
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      hasAnimatedInitial.current = true;
    }
  }, []);

  const goToFeed = () => {
    setActiveView('feed');
    // Only animate if not the initial mount
    if (hasAnimatedInitial.current && !isInitialMount.current) {
      animatePageEntrance(feedScale);
    }
  };

  const goToCamera = () => {
    // Remember the current view before going to camera
    if (activeView !== 'camera') {
      setLastView(activeView);
    }
    setActiveView('camera');
    // Only animate if not the initial mount
    if (hasAnimatedInitial.current && !isInitialMount.current) {
      animatePageEntrance(cameraScale);
    }
  };

  const goToProfile = () => {
    setActiveView('profile');
    // Only animate if not the initial mount
    if (hasAnimatedInitial.current && !isInitialMount.current) {
      animatePageEntrance(profileScale);
    }
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
    feedScale,
    cameraScale,
    profileScale,
    goToFeed,
    goToCamera,
    goToProfile,
    goBackFromCamera,
    getNavColor,
    isNavActive,
  };
}

