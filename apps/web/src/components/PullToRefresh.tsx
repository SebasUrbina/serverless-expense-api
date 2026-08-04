'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 120;
  const REFRESH_THRESHOLD = 80;

  useEffect(() => {
    // The scrollable container is the parent element (main in LayoutWrapper)
    // We attach touch events to the childrenRef so we can measure scroll position of its offsetParent/scrollParent
    const targetElement = childrenRef.current;
    if (!targetElement) return;

    // Find the nearest scrollable ancestor
    let scrollParent: HTMLElement | null = targetElement;
    while (scrollParent && scrollParent !== document.body) {
      const overflowY = window.getComputedStyle(scrollParent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    if (!scrollParent || scrollParent === document.body) {
      scrollParent = window as unknown as HTMLElement; // Fallback
    }

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop =
        scrollParent === (window as unknown as HTMLElement)
          ? window.scrollY
          : (scrollParent as HTMLElement).scrollTop;

      // Only allow pull-to-refresh if we are at the very top
      if (scrollTop <= 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      const y = e.touches[0].clientY;
      const dy = y - startY;

      if (dy > 0) {
        // Prevent default scrolling when pulling down
        if (e.cancelable) {
          e.preventDefault();
        }
        // Add resistance factor
        const pullDistance = Math.min(dy * 0.5, MAX_PULL);
        setCurrentY(pullDistance);
      } else {
        setCurrentY(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (currentY >= REFRESH_THRESHOLD) {
        setIsRefreshing(true);
        setCurrentY(REFRESH_THRESHOLD); // Keep it open while refreshing

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setCurrentY(0);
          setIsPulling(false);
        }
      } else {
        setCurrentY(0);
        setIsPulling(false);
      }
    };

    targetElement.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    targetElement.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    targetElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, isPulling, currentY, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`absolute top-0 left-0 z-10 flex w-full items-end justify-center overflow-hidden pb-6 ${
          !isPulling ? 'transition-all duration-300 ease-out' : ''
        }`}
        style={{
          height: `${currentY}px`,
          opacity: Math.min(currentY / (REFRESH_THRESHOLD * 0.8), 1),
        }}
      >
        <div
          className={`bg-card border-border/50 flex items-center justify-center rounded-full border p-2 shadow-sm ${
            !isPulling ? 'transition-transform duration-300' : ''
          }`}
          style={{
            transform: `scale(${Math.min(currentY / REFRESH_THRESHOLD, 1)})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown
              className={`text-muted-foreground h-5 w-5 transition-transform duration-200 ${
                currentY >= REFRESH_THRESHOLD ? 'text-primary rotate-180' : ''
              }`}
            />
          )}
        </div>
      </div>
      <div
        ref={childrenRef}
        className={`h-full w-full touch-pan-y ${
          !isPulling ? 'transition-transform duration-300 ease-out' : ''
        }`}
        style={{
          transform: `translateY(${currentY}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
