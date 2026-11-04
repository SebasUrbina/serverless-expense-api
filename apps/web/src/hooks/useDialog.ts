'use client';

import { useEffect, useRef, type RefObject } from 'react';

// Nested dialogs: only the topmost one reacts to Escape.
const openDialogs: object[] = [];

/**
 * Escape closes the dialog, focus moves into it on open and returns to the
 * previously focused element on close.
 */
export function useDialog(
  isOpen: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const token = {};
    openDialogs.push(token);
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || openDialogs.at(-1) !== token) return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      previous?.focus?.({ preventScroll: true });
    };
  }, [isOpen, ref]);
}
