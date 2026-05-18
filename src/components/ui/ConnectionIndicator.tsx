import { DARK_THEME } from '../../constants/colors';

/**
 * Connection state indicator (D-03)
 *
 * Visual display for WebSocket connection health:
 * - Connecting: Yellow dot with "连接中..."
 * - Connected: Green dot with "实时"
 * - Disconnected: Yellow dot with "断开"
 * - Failed: Red dot with "连接失败"
 */
export interface ConnectionIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  // Color mapping (D-03)
  const colorMap = {
    connecting: DARK_THEME.warning,    // Yellow (#d29922)
    connected: DARK_THEME.success,     // Green (#3fb950)
    disconnected: DARK_THEME.warning,  // Yellow (#d29922)
    failed: DARK_THEME.error,          // Red (#f85149)
  };

  // Label mapping
  const labelMap = {
    connecting: '连接中...',
    connected: '实时',
    disconnected: '断开',
    failed: '连接失败',
  };

  return (
    <div
      className="flex items-center gap-2"
      data-testid="connection-indicator"
    >
      {/* Status dot */}
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colorMap[status] }}
        data-testid="connection-dot"
      />

      {/* Status label */}
      <span
        className="text-sm"
        style={{ color: DARK_THEME.textMuted }}
      >
        {labelMap[status]}
      </span>
    </div>
  );
}