import { useEmploymentSubMetrics } from '../../hooks/useEmploymentSubMetrics';
import { calculateYoY, calculateMoM } from '../../utils/yoy-mom';
import { formatPercentage } from '../../utils/formatters';
import { DARK_THEME } from '../../constants/colors';

export function EmploymentSubMetricsPanel() {
  const { data, isLoading, error } = useEmploymentSubMetrics();

  if (isLoading) {
    return (
      <div
        data-testid="employment-sub-metrics-panel"
        className="grid grid-cols-2 gap-4 p-4 bg-[#161b22] rounded-lg"
        style={{ color: DARK_THEME.textMuted }}
      >
        Loading...
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div
        data-testid="employment-sub-metrics-panel"
        className="p-4 bg-[#161b22] rounded-lg"
        style={{ color: DARK_THEME.textMuted }}
      >
        就业分项数据暂时不可用
      </div>
    );
  }

  return (
    <div
      data-testid="employment-sub-metrics-panel"
      className="grid grid-cols-2 gap-4 p-4 bg-[#161b22] rounded-lg"
    >
      {data.map((indicator) => {
        const yoy = calculateYoY(indicator.historical);
        const mom = calculateMoM(indicator.historical);
        const latestYoy = yoy[yoy.length - 1];
        const latestMom = mom[mom.length - 1];

        return (
          <div
            key={indicator.id}
            className="p-3 bg-[#0d1117] rounded"
            style={{ backgroundColor: DARK_THEME.background }}
          >
            <h3 className="text-[#c9d1d9]" style={{ color: DARK_THEME.text }}>
              {indicator.name}
            </h3>
            <div
              className="text-2xl"
              style={{ color: DARK_THEME.accent[0] }}
            >
              {formatPercentage(indicator.value)}
            </div>
            <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>
              同比: {latestYoy !== null ? formatPercentage(latestYoy) : '-'}
            </div>
            <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>
              环比: {latestMom !== null ? formatPercentage(latestMom) : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}