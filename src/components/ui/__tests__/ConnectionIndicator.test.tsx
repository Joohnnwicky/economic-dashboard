import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionIndicator } from '../ConnectionIndicator';

describe('ConnectionIndicator', () => {
  describe('Color mapping (D-03)', () => {
    it('shows green dot for connected state', () => {
      render(<ConnectionIndicator status="connected" />);

      const dot = screen.getByTestId('connection-dot');
      expect(dot).toBeDefined();

      // Check style has green background (React converts hex to RGB)
      const style = dot.getAttribute('style');
      expect(style).toContain('rgb(63, 185, 80)'); // #3fb950 converted to RGB
    });

    it('shows yellow dot for connecting state', () => {
      render(<ConnectionIndicator status="connecting" />);

      const dot = screen.getByTestId('connection-dot');
      const style = dot.getAttribute('style');
      expect(style).toContain('rgb(210, 153, 34)'); // #d29922 converted to RGB
    });

    it('shows yellow dot for disconnected state', () => {
      render(<ConnectionIndicator status="disconnected" />);

      const dot = screen.getByTestId('connection-dot');
      const style = dot.getAttribute('style');
      expect(style).toContain('rgb(210, 153, 34)'); // #d29922 converted to RGB
    });

    it('shows red dot for failed state', () => {
      render(<ConnectionIndicator status="failed" />);

      const dot = screen.getByTestId('connection-dot');
      const style = dot.getAttribute('style');
      expect(style).toContain('rgb(248, 81, 73)'); // #f85149 converted to RGB
    });
  });

  describe('Label mapping', () => {
    it('shows "连接中..." for connecting state', () => {
      render(<ConnectionIndicator status="connecting" />);

      expect(screen.getByText('连接中...')).toBeInTheDocument();
    });

    it('shows "实时" for connected state', () => {
      render(<ConnectionIndicator status="connected" />);

      expect(screen.getByText('实时')).toBeInTheDocument();
    });

    it('shows "断开" for disconnected state', () => {
      render(<ConnectionIndicator status="disconnected" />);

      expect(screen.getByText('断开')).toBeInTheDocument();
    });

    it('shows "连接失败" for failed state', () => {
      render(<ConnectionIndicator status="failed" />);

      expect(screen.getByText('连接失败')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders flex container with dot and label', () => {
      render(<ConnectionIndicator status="connected" />);

      // Check container exists
      const container = screen.getByTestId('connection-indicator');
      expect(container).toBeDefined();

      // Check it has flex layout
      expect(container.className).toContain('flex');
      expect(container.className).toContain('items-center');
    });

    it('dot has w-2 h-2 rounded-full classes', () => {
      render(<ConnectionIndicator status="connected" />);

      const dot = screen.getByTestId('connection-dot');
      expect(dot.className).toContain('w-2');
      expect(dot.className).toContain('h-2');
      expect(dot.className).toContain('rounded-full');
    });

    it('label has text-sm class', () => {
      render(<ConnectionIndicator status="connected" />);

      const label = screen.getByText('实时');
      expect(label.className).toContain('text-sm');
    });

    it('label uses DARK_THEME.textMuted color', () => {
      render(<ConnectionIndicator status="connected" />);

      const label = screen.getByText('实时');
      const style = label.getAttribute('style');
      expect(style).toContain('rgb(139, 148, 158)'); // #8b949e converted to RGB
    });
  });

  describe('Props validation', () => {
    it('accepts status prop', () => {
      const statuses = ['connecting', 'connected', 'disconnected', 'failed'];

      for (const status of statuses) {
        const { unmount } = render(<ConnectionIndicator status={status as any} />);
        expect(screen.getByTestId('connection-indicator')).toBeDefined();
        unmount();
      }
    });
  });
});