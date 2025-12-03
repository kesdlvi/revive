import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PencilIconProps {
  size?: number;
  color?: string;
}

export function PencilIcon({ size = 18, color = '#999' }: PencilIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M15.8332 2.08802C16.8841 3.13893 16.9793 4.04397 16.9001 4.6354C16.8572 4.95557 16.7566 5.22202 16.6667 5.40742C16.6235 5.49664 16.5843 5.56401 16.5583 5.6056L6.85629 15.3076L1.00126 16.92L2.61365 11.065L12.3157 1.36296C12.3573 1.33697 12.4246 1.29779 12.5138 1.25455C12.6992 1.1647 12.9657 1.06403 13.2859 1.02115C13.8773 0.941946 14.7823 1.03712 15.8332 2.08802Z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

