import { useAShareMargin } from '../../hooks/useAShareMargin';
import { LineChart } from '../charts/LineChart';
import { toNormalizedIndicator } from '../../api/tushare-backend';
import { DARK_THEME } from '../../constants/colors';

export function AShareMarginPanel() {
  const { series: raw, errors, isLoading, error } = useAShareMargin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91d2a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 rounded text-sm" style={{ color: DARK_THEME.negative }}>
        两融数据加载失败，请检查后端服务是否启动
      </div>
    );
  }

  if (!raw) {
    return (
      <div className="p-2 rounded text-xs leading-5" style={{ color: DARK_THEME.textMuted }}>
        {errors['tushare'] ?? Object.values(errors)[0] ?? '两融余额数据获取失败'}。
        <br />
        两融接口需要较高的 Tushare 积分权限（2000分）。
      </div>
    );
  }

  const data = toNormalizedIndicator(raw)!;
  // 两融余额为日度数据（时间正序），取最后两点计算日环比
  const hist = raw.historical;
  const delta = hist.length >= 2 ? hist[hist.length - 1].value - hist[hist.length - 2].value : null;

  return (
    <div>
      {/* 最新余额卡片 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded text-center" style={{ backgroundColor: DARK_THEME.cardBg }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>最新两融余额</div>
          <div className="text-xl font-semibold" style={{ color: DARK_THEME.text }}>
            {raw.value.toFixed(0)}
            <span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>亿元</span>
          </div>
          <div className="text-[10px]" style={{ color: DARK_THEME.textMuted }}>
            {raw.timestamp.slice(0, 10)}
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ backgroundColor: DARK_THEME.cardBg }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>较前一交易日</div>
          <div
            className="text-xl font-semibold"
            style={{ color: delta === null ? DARK_THEME.textMuted : delta >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}
          >
            {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}`}
            <span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>亿元</span>
          </div>
          <div className="text-[10px]" style={{ color: DARK_THEME.textMuted }}>
            融资+融券（沪深合计）
          </div>
        </div>
      </div>

      <LineChart data={data} timeRange="6M" height={220} />

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: Tushare（SSE+SZSE 按日加总）· 每日收盘后更新 · 杠杆资金情绪参考
        {Object.keys(errors).length > 0 && (
          <>
            {' · '}
            <span style={{ color: DARK_THEME.negative }}>部分交易所数据缺失</span>
          </>
        )}
      </p>
    </div>
  );
}
