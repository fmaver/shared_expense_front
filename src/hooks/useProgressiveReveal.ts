import { useState } from 'react';

/**
 * Progressive "show more" for a client-side list. Starts by showing `limit`
 * rows and reveals `limit` more on each `showMore()` — instant, since the data
 * is already loaded. When `limit` is undefined (the full-page view), everything
 * is shown and there is nothing more to reveal.
 */
export function useProgressiveReveal(limit: number | undefined, total: number) {
  const [visible, setVisible] = useState(limit ?? total);

  if (limit === undefined) {
    return { visibleCount: total, hasMore: false, remaining: 0, showMore: () => {} };
  }

  const visibleCount = Math.min(visible, total);
  return {
    visibleCount,
    hasMore: visibleCount < total,
    remaining: total - visibleCount,
    showMore: () => setVisible(v => v + limit),
  };
}
