import { onHistoryAnchorChange } from '@/utils/history';
import { scrollIntoView } from '@/utils/scroll';
import { useLocation } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

export default () => {
  const selected = useLocation({ select: (location) => location.hash });
  const selectedEntry = useRef<HTMLElement | null>(null);

  const entryRef = useCallback((element: HTMLElement | null) => {
    selectedEntry.current = element;
    scrollIntoView(element, 'start');
  }, []);

  const onScrollChange = (anchor: string) => {
    if (anchor === selected) scrollIntoView(selectedEntry.current, 'start');
    else onHistoryAnchorChange(anchor);
  };

  return { selected, entryRef, onScrollChange };
};
