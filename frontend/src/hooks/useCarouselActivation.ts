import { useCallback, useRef, useState, type RefObject } from "react";

const HOVER_DELAY_MS = 320;

export function useCarouselActivation(
  rowRef: RefObject<HTMLDivElement | null>,
  delayMs = HOVER_DELAY_MS
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hoverTimer = useRef<number | null>(null);
  const pendingIndex = useRef<number | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    pendingIndex.current = null;
  }, []);

  const scrollActiveIntoView = useCallback(
    (index: number) => {
      const row = rowRef.current;
      if (!row) return;
      const card = row.children[index] as HTMLElement | undefined;
      if (!card) return;

      const rowRect = row.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const margin = 48;
      const rowCenter = rowRect.left + rowRect.width / 2;
      const cardCenter = cardRect.left + cardRect.width / 2;
      const offCenter = Math.abs(cardCenter - rowCenter) > rowRect.width * 0.18;
      const clipped =
        cardRect.left < rowRect.left + margin ||
        cardRect.right > rowRect.right - margin;

      if (!offCenter && !clipped) return;

      const target =
        card.offsetLeft - row.clientWidth / 2 + card.clientWidth / 2;
      row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    },
    [rowRef]
  );

  const activateIndex = useCallback(
    (index: number) => {
      clearHoverTimer();
      setActiveIndex(index);
      window.requestAnimationFrame(() => scrollActiveIntoView(index));
    },
    [clearHoverTimer, scrollActiveIntoView]
  );

  const scheduleActivate = useCallback(
    (index: number) => {
      if (index === activeIndex) return;

      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      pendingIndex.current = index;

      hoverTimer.current = window.setTimeout(() => {
        if (pendingIndex.current === index) {
          setActiveIndex(index);
          scrollActiveIntoView(index);
        }
      }, delayMs);
    },
    [activeIndex, delayMs, scrollActiveIntoView]
  );

  return {
    activeIndex,
    activateIndex,
    scheduleActivate,
    clearHoverTimer,
  };
}
