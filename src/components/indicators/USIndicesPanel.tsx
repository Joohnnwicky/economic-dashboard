import { useIndices } from '../../hooks/useIndices';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

/**
 * US Stock Indices Panel
 *
 * Displays Dow Jones, Nasdaq, and S&P 500 indices.
 *
 * CRITICAL: Alpha Vantage free tier = 25 calls/day
 * - Data updates hourly (not minute-level) due to API quota
 * - Clear disclaimer informs user of update frequency
 */
export function USIndicesPanel() {
  const {
    dowJones,
    nasdaq,
    sp500,
    isLoading,
    isError,
    errors,
  } = useIndices();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        美股大盘指数
      </h3>

      {/* Disclaimer about hourly updates due to API quota */}
      <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
        数据每小时更新一次 (API配额限制: 25次/天)
      </p>

      {isError && (
        <div className="p-2 bg-red-900/20 rounded" style={{ color: DARK_THEME.accent[2] }}>
          部分指数数据加载失败
          {errors.map((e, i) => e && (
            <span key={i} className="ml-2">
              {i === 0 ? '道琼斯' : i === 1 ? '纳斯达克' : '标普500'}: {e.message}
            </span>
          ))}
        </div>
      )}

      {isLoading && !dowJones && !nasdaq && !sp500 && (
        <div className="p-4 rounded" style={{ backgroundColor: DARK_THEME.panel, color: DARK_THEME.textMuted }}>
          正在加载美股指数数据...
        </div>
      )}

      {/* Index cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Dow Jones */}
        <IndicatorCard
          title={dowJones?.name || '道琼斯'}
          value={dowJones?.value || 0}
          unit={dowJones?.unit || 'index'}
          lastUpdated={dowJones?.timestamp}
        />

        {/* Nasdaq */}
        <IndicatorCard
          title={nasdaq?.name || '纳斯达克'}
          value={nasdaq?.value || 0}
          unit={nasdaq?.unit || 'index'}
          lastUpdated={nasdaq?.timestamp}
        />

        {/* S&P 500 */}
        <IndicatorCard
          title={sp500?.name || '标普500'}
          value={sp500?.value || 0}
          unit={sp500?.unit || 'index'}
          lastUpdated={sp500?.timestamp}
        />
      </div>

      {/* Mini charts */}
      <div className="grid grid-cols-3 gap-4">
        {dowJones && dowJones.historical.length > 0 && (
          <MiniChart data={dowJones} height={60} />
        )}
        {nasdaq && nasdaq.historical.length > 0 && (
          <MiniChart data={nasdaq} height={60} />
        )}
        {sp500 && sp500.historical.length > 0 && (
          <MiniChart data={sp500} height={60} />
        )}
      </div>
    </div>
  );
}