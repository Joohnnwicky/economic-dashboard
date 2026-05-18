import { DARK_THEME } from '../../constants/colors';

export function Header() {
  return (
    <header
      className="p-4 border-b"
      style={{ borderColor: DARK_THEME.gridLine }}
    >
      <h1
        className="text-xl font-bold"
        style={{ color: DARK_THEME.text }}
      >
        全球经济指标看板
      </h1>
      <p
        className="text-sm"
        style={{ color: DARK_THEME.textMuted }}
      >
        实时监控美联储利率、就业数据、通胀指标、加密货币、美股指数
      </p>
    </header>
  );
}