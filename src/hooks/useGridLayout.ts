import { useState, useCallback } from 'react';
import { PanelKey, DEFAULT_ORDER } from '../constants/layoutConfig';

const STORAGE_KEY = 'dashboard-panel-order';
const ORDER_VERSION = 2;

export function usePanelOrder() {
  const [order, setOrder] = useState<PanelKey[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._v === ORDER_VERSION && Array.isArray(parsed.order)) {
          return parsed.order;
        }
      }
    } catch { /* corrupted */ }
    return DEFAULT_ORDER;
  });

  const movePanel = useCallback((fromIndex: number, toIndex: number) => {
    setOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ _v: ORDER_VERSION, order: next }));
      } catch { /* full */ }
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(DEFAULT_ORDER);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ _v: ORDER_VERSION, order: DEFAULT_ORDER }));
    } catch { /* full */ }
  }, []);

  return { order, movePanel, resetOrder };
}
