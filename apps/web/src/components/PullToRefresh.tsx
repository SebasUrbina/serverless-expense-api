'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
};

const MAX_PULL = 120;
const REFRESH_THRESHOLD = 80;

function findScrollContainer(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return window;
}

function getScrollTop(container: HTMLElement | Window) {
  return container === window
    ? window.scrollY
    : (container as HTMLElement).scrollTop;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const childrenRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({ startY: 0, currentY: 0, active: false });
  const refreshingRef = useRef(false);

  useEffect(() => {
    const target = childrenRef.current;
    if (!target) return;
    const scrollContainer = findScrollContainer(target);

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current || getScrollTop(scrollContainer) > 0) return;
      gestureRef.current = {
        startY: event.touches[0].clientY,
        currentY: 0,
        active: true,
      };
      setIsPulling(true);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture.active) return;

      const delta = event.touches[0].clientY - gesture.startY;
      const distance = delta > 0 ? Math.min(delta * 0.5, MAX_PULL) : 0;
      if (distance > 0 && event.cancelable) event.preventDefault();

      gesture.currentY = distance;
      setCurrentY(distance);
    };

    const handleTouchEnd = () => {
      const gesture = gestureRef.current;
      if (!gesture.active) return;
      gesture.active = false;
      setIsPulling(false);

      if (gesture.currentY < REFRESH_THRESHOLD) {
        gesture.currentY = 0;
        setCurrentY(0);
        return;
      }

      refreshingRef.current = true;
      setIsRefreshing(true);
      setCurrentY(REFRESH_THRESHOLD);
      void onRefresh().finally(() => {
        refreshingRef.current = false;
        gesture.currentY = 0;
        setIsRefreshing(false);
        setCurrentY(0);
      });
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd);
    target.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onRefresh]);

  return (
    <div className="relative w-full">
      <div
        aria-live="polite"
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
            <Loader2 aria-label="Actualizando" className="text-primary h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown
              aria-hidden="true"
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
        style={{ transform: `translateY(${currentY}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
