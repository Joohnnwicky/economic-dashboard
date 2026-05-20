import { useChineseIndices } from '../../hooks/useChineseIndices';
import { IndicatorCard } from '../ui/IndicatorCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';

/**
 * UI panel displaying Chinese A-share indices with loading/error states
 *
 * Displays:
 * - Shanghai Composite Index (上证指数)
 * - Shenzhen Component Index (深证成指)
 * - ChiNext Index (创业板指)
 *
 * Per PITFALLS.md Pitfall 15, ensures Chinese names display correctly (UTF-8 encoding).
 * Per Phase 1 ErrorBoundary pattern, single data source failure should not crash dashboard.
 */
export function ChineseIndicesPanel() {
  const { data, isLoading, error, dataUpdatedAt } = useChineseIndices();

  // Loading state
  if (isLoading) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <h3
          className="text-lg font-medium mb-4"
          style={{ color: DARK_THEME.text }}
        >
          A股指数
        </h3>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state - fallback UI prevents dashboard crash
  if (error) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <h3
          className="text-lg font-medium mb-4"
          style={{ color: DARK_THEME.text }}
        >
          A股指数
        </h3>
        <div
          className="p-2 rounded"
          style={{
            backgroundColor: 'rgba(248, 81, 73, 0.2)',
            color: DARK_THEME.error,
          }}
        >
          A股数据暂时不可用
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      <h3
        className="text-lg font-medium mb-4"
        style={{ color: DARK_THEME.text }}
      >
        A股指数
      </h3>

      {/* Grid of 3 index cards */}
      <div className="grid grid-cols-3 gap-4">
        {data.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            title={indicator.name}
            value={indicator.value}
            unit={indicator.unit}
            change={indicator.change ? {
              value: indicator.change.value,
              percentage: indicator.change.percentage,
            } : undefined}
          />
        ))}
      </div>

      {/* Last updated timestamp */}
      {dataUpdatedAt && (
        <div className="mt-4">
          <LastUpdated timestamp={new Date(dataUpdatedAt)} />
        </div>
      )}
    </div>
  );
}