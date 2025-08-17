'use client';

import { useCallback, useEffect, useRef } from 'react';

interface ExitIntentDetectorProps {
  onExitIntent: (type: 'mouse_movement' | 'tab_switch' | 'navigation_attempt') => void;
  isActive?: boolean;
  sensitivity?: 'low' | 'medium' | 'high';
  children?: React.ReactNode;
}

/**
 * Component that detects user exit intent through various behavioral patterns
 * Implements FB-020: Exit intent detection for upgrade flow feedback
 */
export function ExitIntentDetector({ 
  onExitIntent, 
  isActive = true,
  sensitivity = 'medium',
  children 
}: ExitIntentDetectorProps) {
  const exitIntentTriggeredRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const tabSwitchCountRef = useRef(0);
  const lastActiveTimeRef = useRef(Date.now());

  // Sensitivity settings
  const sensitivityConfig = {
    low: {
      mouseThreshold: 20, // pixels from top to trigger
      tabSwitchThreshold: 3, // number of tab switches
      inactivityThreshold: 60000, // 1 minute
    },
    medium: {
      mouseThreshold: 50,
      tabSwitchThreshold: 2,
      inactivityThreshold: 30000, // 30 seconds
    },
    high: {
      mouseThreshold: 80,
      tabSwitchThreshold: 1,
      inactivityThreshold: 20000, // 20 seconds
    },
  };

  const config = sensitivityConfig[sensitivity];

  const triggerExitIntent = useCallback((type: 'mouse_movement' | 'tab_switch' | 'navigation_attempt') => {
    if (!isActive || exitIntentTriggeredRef.current) return;
    
    exitIntentTriggeredRef.current = true;
    onExitIntent(type);
    
    // Reset after 10 seconds to allow for re-triggering
    setTimeout(() => {
      exitIntentTriggeredRef.current = false;
    }, 10000);
  }, [isActive, onExitIntent]);

  // Mouse movement detection for exit intent
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    const { clientY, clientX } = event;
    mousePositionRef.current = { x: clientX, y: clientY };
    lastActiveTimeRef.current = Date.now();

    // Detect upward mouse movement toward browser chrome
    if (clientY <= config.mouseThreshold && event.movementY < 0) {
      triggerExitIntent('mouse_movement');
    }
  }, [isActive, config.mouseThreshold, triggerExitIntent]);

  // Mouse leave detection
  const handleMouseLeave = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    // Only trigger if mouse leaves from the top of the page
    if (event.clientY <= 0) {
      triggerExitIntent('mouse_movement');
    }
  }, [isActive, triggerExitIntent]);

  // Tab visibility change detection
  const handleVisibilityChange = useCallback(() => {
    if (!isActive || typeof document === 'undefined') return;

    if (document.hidden) {
      tabSwitchCountRef.current += 1;
      
      if (tabSwitchCountRef.current >= config.tabSwitchThreshold) {
        triggerExitIntent('tab_switch');
      }
    } else {
      lastActiveTimeRef.current = Date.now();
    }
  }, [isActive, config.tabSwitchThreshold, triggerExitIntent]);

  // Beforeunload detection for navigation attempts
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!isActive) return;
    
    triggerExitIntent('navigation_attempt');
    
    // Don't actually prevent the navigation, just track the intent
    // event.preventDefault();
    // event.returnValue = '';
  }, [isActive, triggerExitIntent]);

  // Keyboard shortcuts that might indicate exit intent
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    // Detect common navigation shortcuts
    const exitKeyboardShortcuts = [
      { key: 'w', meta: true }, // Cmd+W (close tab)
      { key: 'w', ctrl: true }, // Ctrl+W (close tab)
      { key: 't', meta: true }, // Cmd+T (new tab)
      { key: 't', ctrl: true }, // Ctrl+T (new tab)
      { key: 'l', meta: true }, // Cmd+L (address bar)
      { key: 'l', ctrl: true }, // Ctrl+L (address bar)
      { key: 'r', meta: true }, // Cmd+R (refresh)
      { key: 'r', ctrl: true }, // Ctrl+R (refresh)
    ];

    const isExitShortcut = exitKeyboardShortcuts.some(shortcut => 
      event.key.toLowerCase() === shortcut.key && 
      ((shortcut.meta && event.metaKey) || (shortcut.ctrl && event.ctrlKey))
    );

    if (isExitShortcut) {
      triggerExitIntent('navigation_attempt');
    }

    // Update activity timestamp
    lastActiveTimeRef.current = Date.now();
  }, [isActive, triggerExitIntent]);

  // Scroll behavior analysis
  const handleScroll = useCallback(() => {
    if (!isActive) return;
    
    lastActiveTimeRef.current = Date.now();
    
    // If user scrolls to top quickly, might indicate exit intent
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      // Small delay to distinguish intentional top scrolling from exit intent
      setTimeout(() => {
        if (mousePositionRef.current.y <= config.mouseThreshold) {
          triggerExitIntent('mouse_movement');
        }
      }, 500);
    }
  }, [isActive, config.mouseThreshold, triggerExitIntent]);

  // Inactivity detection
  useEffect(() => {
    if (!isActive) return;

    const checkInactivity = () => {
      const timeSinceActive = Date.now() - lastActiveTimeRef.current;
      if (timeSinceActive >= config.inactivityThreshold) {
        triggerExitIntent('tab_switch');
      }
    };

    const interval = setInterval(checkInactivity, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [isActive, config.inactivityThreshold, triggerExitIntent]);

  // Set up event listeners
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Visibility and navigation events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    // Scroll events
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    isActive,
    handleMouseMove,
    handleMouseLeave,
    handleVisibilityChange,
    handleBeforeUnload,
    handleKeyDown,
    handleScroll,
  ]);

  // Reset exit intent when component becomes active
  useEffect(() => {
    if (isActive) {
      exitIntentTriggeredRef.current = false;
      tabSwitchCountRef.current = 0;
      lastActiveTimeRef.current = Date.now();
    }
  }, [isActive]);

  return <>{children}</>;
}