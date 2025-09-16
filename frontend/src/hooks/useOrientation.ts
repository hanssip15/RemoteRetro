import { useState, useEffect } from 'react';

export interface OrientationState {
  isLandscape: boolean;
  isPortrait: boolean;
  angle: number;
}

export function useOrientation(): OrientationState {
  const [orientation, setOrientation] = useState<OrientationState>({
    isLandscape: false,
    isPortrait: true,
    angle: 0
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      // Untuk device mobile asli, gunakan screen orientation
      if (window.screen?.orientation) {
        const angle = window.screen.orientation.angle;
        const isLandscape = Math.abs(angle) === 90 || Math.abs(angle) === 270;
        const isPortrait = !isLandscape;

        setOrientation({
          isLandscape,
          isPortrait,
          angle
        });
      } 
      // Untuk browser desktop/Developer Tools, gunakan dimensi window
      else {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;
        const isPortrait = height > width;
        const angle = isLandscape ? 90 : 0;

        setOrientation({
          isLandscape,
          isPortrait,
          angle
        });
      }
    };

    // Initial check
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Also listen for screen orientation changes (more modern approach)
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return orientation;
}
