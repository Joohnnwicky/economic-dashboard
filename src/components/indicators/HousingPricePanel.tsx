import { useHousingPrices } from '../../hooks/useHousingPrices';
import { DARK_THEME } from '../../constants/colors';

export function HousingPricePanel() {
  const { data, isLoading, error, isFetching } = useHousingPrices();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  // 获取石家庄详情
  const shijiazhuang = data.cities?.sj;
  // 获取前10城市排行
  const topCities = data.national?.slice(0, 10) || [];
  // 石家庄排名
  const sjRank = data.national?.find(c => c.city === '石家庄');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isFetching && (
          <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
            更新中...
          </span>
        )}
        <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          {data.updateTime ? new Date(data.updateTime).toLocaleDateString('zh-CN') : ''}
        </span>
      </div>

      {/* 全国排行前10 */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: DARK_THEME.cardBg }}>
        <div className="text-sm mb-2 font-medium" style={{ color: DARK_THEME.textMuted }}>
          全国房价排行 TOP10
        </div>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th className="text-left font-sans font-bold py-1 pr-2" style={{ color: DARK_THEME.textMuted }}>#</th>
              <th className="text-left font-sans font-bold py-1 px-2" style={{ color: DARK_THEME.textMuted }}>城市</th>
              <th className="text-right font-sans font-bold py-1 px-2" style={{ color: DARK_THEME.textMuted }}>元/㎡</th>
              <th className="text-right font-sans font-bold py-1 pl-2" style={{ color: DARK_THEME.textMuted }}>涨跌</th>
            </tr>
          </thead>
          <tbody>
            {topCities.map((city, idx) => (
              <tr key={city.city} style={{ borderBottom: '1px solid #000' }}>
                <td className="py-1 pr-2" style={{ color: DARK_THEME.accent[idx % 4] }}>#{city.rank}</td>
                <td className="py-1 px-2" style={{ color: DARK_THEME.text }}>{city.city}</td>
                <td className="py-1 px-2 text-right" style={{ color: DARK_THEME.text }}>{city.price.toLocaleString()}</td>
                <td
                  className="py-1 pl-2 text-right"
                  style={{ color: city.change !== null ? (city.change > 0 ? DARK_THEME.up : DARK_THEME.down) : DARK_THEME.textMuted }}
                >
                  {city.change !== null ? `${city.change > 0 ? '+' : ''}${city.change.toFixed(2)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 石家庄详情 */}
      {shijiazhuang && !shijiazhuang.error && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: DARK_THEME.cardBg }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: DARK_THEME.text }}>
              石家庄 {sjRank && `(#${sjRank.rank})`}
            </span>
            {shijiazhuang.dataMonth && (
              <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>
                {shijiazhuang.dataMonth}
              </span>
            )}
          </div>

          {/* 二手房均价 */}
          {shijiazhuang.secondHandPrice && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: DARK_THEME.textMuted }}>
                二手房均价
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
                  {shijiazhuang.secondHandPrice.toLocaleString()}元/㎡
                </span>
                {shijiazhuang.secondHandChange !== null && (
                  <span style={{ color: shijiazhuang.secondHandChange > 0 ? DARK_THEME.up : DARK_THEME.down }}>
                    {shijiazhuang.secondHandChange > 0 ? '↑' : '↓'}
                    {Math.abs(shijiazhuang.secondHandChange).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 各区房价 */}
          {shijiazhuang.districts && shijiazhuang.districts.length > 0 && (
            <div className="mt-3">
              <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>
                各区均价
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {shijiazhuang.districts.map((district) => (
                  <div key={district.name} className="flex items-center justify-between text-xs">
                    <span style={{ color: DARK_THEME.textMuted }}>{district.name}</span>
                    <div className="flex items-center gap-1">
                      <span style={{ color: DARK_THEME.text }}>
                        {district.price.toLocaleString()}
                      </span>
                      {district.change !== null && (
                        <span style={{ color: district.change > 0 ? DARK_THEME.up : DARK_THEME.down }}>
                          {district.change > 0 ? '+' : ''}{district.change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据来源 */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: creprice.cn · 每日更新
      </p>
    </div>
  );
}
