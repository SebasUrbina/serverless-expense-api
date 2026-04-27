"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max width class for the sheet (default: 'max-w-lg') */
  maxWidth?: string;
  /** Enable drag-to-dismiss on mobile (default: false) */
  draggable?: boolean;
  /** z-index class (default: 'z-100') */
  zIndex?: string;
  /** Lock body scroll while open (default: false) */
  lockScroll?: boolean;
  /** Content rendered outside the sheet but inside the backdrop (e.g. nested modals) */
  outerContent?: ReactNode;
};

const DISMISS_THRESHOLD = 120;

export function BaseModal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
  draggable = false,
  zIndex = "z-100",
  lockScroll = false,
  outerContent,
}: BaseModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startY: 0, isDragging: false, offset: 0 });
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropPaddingTop = "max(0.75rem, env(safe-area-inset-top))";
  const backdropPaddingBottom = "max(0.75rem, env(safe-area-inset-bottom))";
  const sheetMaxHeight =
    "calc(100dvh - max(0.75rem, env(safe-area-inset-top)) - max(0.75rem, env(safe-area-inset-bottom)))";

  // Animate in with double rAF
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
    };
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen || !lockScroll) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, lockScroll]);

  const animateClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 400);
  }, [onClose]);

  // Drag-to-dismiss: touch start
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!draggable) return;
      const el = sheetRef.current;
      if (el && el.scrollTop > 0) return;
      dragState.current = {
        startY: e.touches[0].clientY,
        isDragging: true,
        offset: 0,
      };
      setIsDragging(true);
    },
    [draggable],
  );

  // Native touchmove with passive: false so preventDefault works
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isOpen || !draggable) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragState.current.isDragging) return;
      const delta = e.touches[0].clientY - dragState.current.startY;
      if (delta > 0) {
        e.preventDefault();
        dragState.current.offset = delta;
        setDragOffset(delta);
      } else {
        dragState.current.offset = 0;
        setDragOffset(0);
      }
    };

    sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => sheet.removeEventListener("touchmove", handleTouchMove);
  }, [isOpen, draggable]);

  // Drag-to-dismiss: touch end
  const onTouchEnd = useCallback(() => {
    if (!draggable || !dragState.current.isDragging) return;
    const offset = dragState.current.offset;
    dragState.current = { startY: 0, isDragging: false, offset: 0 };
    setIsDragging(false);

    if (offset > DISMISS_THRESHOLD) {
      setDragOffset(window.innerHeight);
      setTimeout(() => {
        setDragOffset(0);
        onClose();
      }, 250);
    } else {
      setDragOffset(0);
    }
  }, [draggable, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center bg-[var(--backdrop-bg)] backdrop-blur-2xl p-0 sm:p-4 modal-backdrop ${isVisible ? "modal-open" : ""}`}
      style={{
        backgroundColor: `rgba(var(--backdrop-rgb),${dragOffset > 0 ? Math.max(0.2, 0.8 - dragOffset / 600) : 0.8})`,
        paddingTop: backdropPaddingTop,
        paddingBottom: backdropPaddingBottom,
      }}
      onClick={animateClose}
    >
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        className={`bg-card border-t sm:border border-border rounded-t-[2.5rem] sm:rounded-3xl w-full ${maxWidth} overflow-y-auto max-h-[95vh] sm:max-h-[90vh] shadow-elevated modal-sheet pb-safe sm:pb-0 ${isVisible ? "modal-open" : ""}`}
        style={{
          maxHeight: sheetMaxHeight,
          ...(dragOffset > 0
            ? {
                transform: `translateY(${dragOffset}px)`,
                transition: isDragging
                  ? "none"
                  : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
              }
            : {}),
        }}
      >
        {/* Drag handle — mobile only */}
        {draggable && (
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-border" />
          </div>
        )}
        {children}
      </div>
      {outerContent}
    </div>
  );
}
