import { useEffect } from 'react';

/**
 * 键盘导航: Alt+1..9 滚动到第 N 个面板。
 * 在 #dashboard-grid 容器内按顺序取子元素滚动入视。
 */
export function useKeyboardNav() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!e.altKey) return;
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > 9) return;

      const grid = document.getElementById('dashboard-grid');
      if (!grid) return;
      const children = grid.children;
      const target = children[n - 1];
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
