/**
 * useInputTracking Hook
 * 
 * Automatically tracks keyboard and mouse input events in the renderer
 * and sends them to the main process for telemetry aggregation.
 * 
 * Privacy: Only sends event counts, not actual key content or mouse positions.
 */

import { useEffect, useRef } from 'react';

export const useInputTracking = (enabled: boolean = true) => {
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Keyboard handler (any key press)
    const handleKeyPress = () => {
      if (window.inputTracking) {
        window.inputTracking.recordKeystroke();
      }
    };

    // Mouse movement handler (throttled)
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle to max 10 events per second
      if (throttleTimer.current) return;

      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;
      }, 100);

      const deltaX = e.clientX - lastMouseX.current;
      const deltaY = e.clientY - lastMouseY.current;

      if (window.inputTracking && (deltaX !== 0 || deltaY !== 0)) {
        window.inputTracking.recordMouseMove(deltaX, deltaY);
      }

      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    // Attach listeners
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('mousemove', handleMouseMove);

    console.log('[InputTracking] Enabled');

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }

      console.log('[InputTracking] Disabled');
    };
  }, [enabled]);
};

