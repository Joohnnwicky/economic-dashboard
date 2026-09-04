import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { usePanelOrder } from '../../hooks/useGridLayout';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { PANEL_TITLES, PanelKey, DEFAULT_ORDER } from '../../constants/layoutConfig';
import { RIBBON_TINTS } from '../../constants/colors';
import { DashboardItem } from './DashboardItem';
import { FilterBar } from './FilterBar';
import { OverlayPanel } from './OverlayPanel';
import { CausalGraphSection } from '../causal/CausalGraphSection';

// Import all panel content components
import { FedRatePanel } from '../indicators/FedRatePanel';
import { FedWatchPanel } from '../indicators/FedWatchPanel';
import { MarketRegimePanel } from '../indicators/MarketRegimePanel';
import { TreasuryPanel } from '../indicators/TreasuryPanel';
import { TreasurySelloffPanel } from '../indicators/TreasurySelloffPanel';
import { InflationPanel } from '../indicators/InflationPanel';
import { InflationSubMetricsPanel } from './InflationSubMetricsPanel';
import { InitialClaimsPanel } from '../indicators/InitialClaimsPanel';
import { USLeadingIndicatorsPanel } from '../indicators/USLeadingIndicatorsPanel';
import { DollarIndexPanel } from '../indicators/DollarIndexPanel';
import { VixPanel } from '../indicators/VixPanel';
import { GoldPricePanel } from '../indicators/GoldPricePanel';
import { OilPricePanel } from '../indicators/OilPricePanel';
import { CryptoPanel } from '../indicators/CryptoPanel';
import { CoinbasePremiumPanel } from '../indicators/CoinbasePremiumPanel';
import { MarketDominancePanel } from '../indicators/MarketDominancePanel';
import { OnchainPanel } from '../indicators/OnchainPanel';
import { ExchangeRatesPanel } from '../indicators/ExchangeRatesPanel';
import { USIndicesPanel } from '../indicators/USIndicesPanel';
import { USStocksPanel } from '../indicators/USStocksPanel';
import { EconomicCalendarPanel } from '../indicators/EconomicCalendarPanel';
import { ChineseIndicesPanel } from '../indicators/ChineseIndicesPanel';
import { ChinaMacroPanel } from '../indicators/ChinaMacroPanel';
import { ChinaPMIPanel } from '../indicators/ChinaPMIPanel';
import { ChinaTradePanel } from '../indicators/ChinaTradePanel';
import { ChinaCreditPanel } from '../indicators/ChinaCreditPanel';
import { HousingPricePanel } from '../indicators/HousingPricePanel';
import { CustomStocksPanel } from '../stocks/CustomStocksPanel';
import { AShareRadarPanel } from '../stocks/AShareRadarPanel';
import { AShareMarginPanel } from '../stocks/AShareMarginPanel';
import { DefenseSectorPanel } from '../stocks/DefenseSectorPanel';
import { ChinaRatesPanel } from '../indicators/ChinaRatesPanel';
import { PBOCRatePanel } from '../indicators/PBOCRatePanel';
import { PolymarketPanel } from '../indicators/PolymarketPanel';

const COMPONENT_MAP: Record<PanelKey, React.ComponentType> = {
  'fed-rate': FedRatePanel,
  'fedwatch': FedWatchPanel,
  'market-regime': MarketRegimePanel,
  'treasury': TreasuryPanel,
  'treasury-selloff': TreasurySelloffPanel,
  'inflation': InflationPanel,
  'inflation-sub': InflationSubMetricsPanel,
  'initial-claims': InitialClaimsPanel,
  'us-leading': USLeadingIndicatorsPanel,
  'dollar-index': DollarIndexPanel,
  'vix': VixPanel,
  'gold-price': GoldPricePanel,
  'oil-price': OilPricePanel,
  'crypto': CryptoPanel,
  'coinbase-premium': CoinbasePremiumPanel,
  'market-dominance': MarketDominancePanel,
  'onchain': OnchainPanel,
  'exchange-rates': ExchangeRatesPanel,
  'us-indices': USIndicesPanel,
  'us-stocks': USStocksPanel,
  'economic-calendar': EconomicCalendarPanel,
  'chinese-indices': ChineseIndicesPanel,
  'china-macro': ChinaMacroPanel,
  'china-pmi': ChinaPMIPanel,
  'china-trade': ChinaTradePanel,
  'china-credit': ChinaCreditPanel,
  'housing-price': HousingPricePanel,
  'custom-stocks': CustomStocksPanel,
  'a-share-radar': AShareRadarPanel,
  'a-share-margin': AShareMarginPanel,
  'defense-sector': DefenseSectorPanel,
  'china-rates': ChinaRatesPanel,
  'pboc-rate': PBOCRatePanel,
  'polymarket': PolymarketPanel,
};

// Panels flagged with a yellow "NEW!" burst sticker (recent additions).
const NEW_PANELS: Set<PanelKey> = new Set<PanelKey>([
  'a-share-radar',
  'a-share-margin',
  'defense-sector',
  'china-rates',
  'us-stocks',
  'housing-price',
  'polymarket',
  'coinbase-premium',
  'vix',
  'initial-claims',
  'us-leading',
  'market-dominance',
  'onchain',
  'economic-calendar',
  'fedwatch',
  'market-regime',
]);

// Stable tint per panel keyed by its default position, so dragging doesn't reshuffle colors.
const tintFor = (key: PanelKey): string =>
  RIBBON_TINTS[DEFAULT_ORDER.indexOf(key) % RIBBON_TINTS.length];

export function Dashboard() {
  const { order, movePanel, resetOrder } = usePanelOrder();
  useKeyboardNav();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id as PanelKey);
    const newIndex = order.indexOf(over.id as PanelKey);
    if (oldIndex !== -1 && newIndex !== -1) {
      movePanel(oldIndex, newIndex);
    }
  }

  return (
    <main className="p-4">
      <FilterBar />

      <div className="mb-4 flex justify-end">
        <button
          onClick={resetOrder}
          className="px-3 py-1 text-sm font-sans font-bold transition-colors hover:bg-[#000] hover:text-white"
          style={{ color: '#000', border: '1px solid #000', backgroundColor: '#fff' }}
        >
          重置布局
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div
            id="dashboard-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start"
            style={{ gridAutoRows: '8px', gridAutoFlow: 'dense', rowGap: '8px', columnGap: '16px' }}
          >
            {order.map((key) => {
              const Component = COMPONENT_MAP[key];
              if (!Component) return null;
              return (
                <DashboardItem
                  key={key}
                  panelKey={key}
                  title={PANEL_TITLES[key]}
                  tint={tintFor(key)}
                  isNew={NEW_PANELS.has(key)}
                >
                  <Component />
                </DashboardItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <CausalGraphSection />
      </div>

      <div className="mt-4">
        <OverlayPanel />
      </div>

      <footer
        className="mt-8 text-center py-4 border-t font-serif"
        style={{ borderColor: '#000', backgroundColor: '#fff', color: '#000' }}
      >
        <p className="text-xs">
          全球经济指标看板 v1.0 · 数据来源: FRED, BLS, Alpha Vantage, AkShare, Tushare, 通达信, Binance, Coinbase, 东方财富
        </p>
        <p className="text-xs mt-2">
          快捷键: Alt+1..9 跳转对应面板 ·
          {' '}<a href="#" className="underline" style={{ color: '#0000ee' }}>Copyright</a>
          {' · '}
          本工具仅供个人使用，数据可能存在延迟或误差
        </p>
      </footer>
    </main>
  );
}
