import { FedRatePanel } from '../indicators/FedRatePanel';
import { CryptoPanel } from '../indicators/CryptoPanel';
import { EmploymentPanel } from '../indicators/EmploymentPanel';
import { InflationPanel } from '../indicators/InflationPanel';
import { USIndicesPanel } from '../indicators/USIndicesPanel';
import { ChineseIndicesPanel } from '../indicators/ChineseIndicesPanel';
import { PBOCRatePanel } from '../indicators/PBOCRatePanel';
import { GoldPricePanel } from '../indicators/GoldPricePanel';
import { OilPricePanel } from '../indicators/OilPricePanel';
import { DollarIndexPanel } from '../indicators/DollarIndexPanel';
import { ExchangeRatesPanel } from '../indicators/ExchangeRatesPanel';
import { PolymarketPanel } from '../indicators/PolymarketPanel';
import { TreasuryPanel } from '../indicators/TreasuryPanel';
import { ChinaMacroPanel } from '../indicators/ChinaMacroPanel';
import { HousingPricePanel } from '../indicators/HousingPricePanel';
import { FilterBar } from './FilterBar';
import { OverlayPanel } from './OverlayPanel';
import { InflationSubMetricsPanel } from './InflationSubMetricsPanel';
import { CustomStocksPanel } from '../stocks/CustomStocksPanel';
import { DARK_THEME } from '../../constants/colors';

export function Dashboard() {
  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Global Filter Bar */}
        <FilterBar />

        {/* Responsive Grid Layout - 2 columns at lg breakpoint */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Economic Indicators */}
          <div className="space-y-4">
            <FedRatePanel />
            <TreasuryPanel />
            <EmploymentPanel />
            <InflationPanel />
            <InflationSubMetricsPanel />
            <DollarIndexPanel />
            <GoldPricePanel />
            <OilPricePanel />
          </div>

          {/* Right Column: Market Data */}
          <div className="space-y-4">
            <CryptoPanel />
            <ExchangeRatesPanel />
            <USIndicesPanel />
            <ChineseIndicesPanel />
            <ChinaMacroPanel />
            <HousingPricePanel />
            <CustomStocksPanel />
            <PBOCRatePanel />
            <PolymarketPanel />
          </div>
        </div>

        {/* Cross-Market Comparison Section - Full width */}
        <div className="mt-4">
          <OverlayPanel />
        </div>

        {/* Footer */}
        <footer
          className="mt-8 text-center py-4 border-t"
          style={{ borderColor: DARK_THEME.gridLine, color: DARK_THEME.textMuted }}
        >
          <p className="text-sm">
            全球经济指标看板 v1.0 · 数据来源: FRED, BLS, CoinGecko, Alpha Vantage, 东方财富
          </p>
          <p className="text-xs mt-2">
            本工具仅供个人使用，数据可能存在延迟或误差
          </p>
        </footer>
      </div>
    </main>
  );
}