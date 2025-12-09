import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HammerIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export function HammerIcon({ size = 20, color = '#FFF', filled = false }: HammerIconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M15.5 2.5L21.5 8.5L19.5 10.5L13.5 4.5L15.5 2.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9.5 8.5L15.5 14.5L13.5 16.5L7.5 10.5L9.5 8.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3.5 12.5L9.5 18.5L7.5 20.5L1.5 14.5L3.5 12.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M18.5 11.5L20.5 13.5L18.5 15.5L16.5 13.5L18.5 11.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  } else {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M15.5 2.5L21.5 8.5L19.5 10.5L13.5 4.5L15.5 2.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9.5 8.5L15.5 14.5L13.5 16.5L7.5 10.5L9.5 8.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3.5 12.5L9.5 18.5L7.5 20.5L1.5 14.5L3.5 12.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M18.5 11.5L20.5 13.5L18.5 15.5L16.5 13.5L18.5 11.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }
}



