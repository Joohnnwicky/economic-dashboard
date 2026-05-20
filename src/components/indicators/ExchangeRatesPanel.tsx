import { useExchangeRates } from '../../hooks/useExchangeRates';
import { IndicatorCard } from '../ui/IndicatorCard';
import { DARK_THEME } from '../../constants/colors';

export function ExchangeRatesPanel() {
  const { latest, isLoading, error, isFetching } = useExchangeRates();

  if (isLoading && !latest) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          主要汇率（Major Exchange Rates）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && !latest) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          主要汇率（Major Exchange Rates）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败
        </div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          主要汇率（Major Exchange Rates）
        </h3>
        <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          主要汇率（Major Exchange Rates）
          {isFetching && (
            <span className="ml-2 text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
              更新中...
            </span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <p className="text-sm mb-1" style={{ color: DARK_THEME.textMuted }}>EUR 欧元</p>
          <p className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
            {latest.EUR.toFixed(4)}
          </p>
          <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>1 USD = {latest.EUR.toFixed(4)} EUR</p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <p className="text-sm mb-1" style={{ color: DARK_THEME.textMuted }}>GBP 英镑</p>
          <p className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
            {latest.GBP.toFixed(4)}
          </p>
          <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>1 USD = {latest.GBP.toFixed(4)} GBP</p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <p className="text-sm mb-1" style={{ color: DARK_THEME.textMuted }}>JPY 日元</p>
          <p className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
            {latest.JPY.toFixed(2)}
          </p>
          <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>1 USD = {latest.JPY.toFixed(2)} JPY</p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <p className="text-sm mb-1" style={{ color: DARK_THEME.textMuted }}>CNY 人民币</p>
          <p className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
            {latest.CNY.toFixed(4)}
          </p>
          <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>1 USD = {latest.CNY.toFixed(4)} CNY</p>
        </div>
      </div>

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每小时更新 (Frankfurter API · ECB欧洲央行数据)
      </p>
    </div>
  );
}