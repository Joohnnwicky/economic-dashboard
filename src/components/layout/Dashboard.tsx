import { useState } from 'react';
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
import { PANEL_TITLES, PanelKey } from '../../constants/layoutConfig';
import { DashboardItem } from './DashboardItem';
import { FilterBar } from './FilterBar';
import { OverlayPanel } from './OverlayPanel';
import { DARK_THEME } from '../../constants/colors';

// Import all panel content components
import { FedRatePanel } from '../indicators/FedRatePanel';
import { TreasuryPanel } from '../indicators/TreasuryPanel';
import { EmploymentPanel } from '../indicators/EmploymentPanel';
import { InflationPanel } from '../indicators/InflationPanel';
import { InflationSubMetricsPanel } from './InflationSubMetricsPanel';
import { DollarIndexPanel } from '../indicators/DollarIndexPanel';
import { GoldPricePanel } from '../indicators/GoldPricePanel';
import { OilPricePanel } from '../indicators/OilPricePanel';
import { CryptoPanel } from '../indicators/CryptoPanel';
import { ExchangeRatesPanel } from '../indicators/ExchangeRatesPanel';
import { USIndicesPanel } from '../indicators/USIndicesPanel';
import { ChineseIndicesPanel } from '../indicators/ChineseIndicesPanel';
import { ChinaMacroPanel } from '../indicators/ChinaMacroPanel';
import { ChinaPMIPanel } from '../indicators/ChinaPMIPanel';
import { ChinaTradePanel } from '../indicators/ChinaTradePanel';
import { ChinaCreditPanel } from '../indicators/ChinaCreditPanel';
import { HousingPricePanel } from '../indicators/HousingPricePanel';
import { CustomStocksPanel } from '../stocks/CustomStocksPanel';
import { PBOCRatePanel } from '../indicators/PBOCRatePanel';
import { PolymarketPanel } from '../indicators/PolymarketPanel';

const COMPONENT_MAP: Record<PanelKey, React.ComponentType> = {
  'fed-rate': FedRatePanel,
  'treasury': TreasuryPanel,
  'employment': EmploymentPanel,
  'inflation': InflationPanel,
  'inflation-sub': InflationSubMetricsPanel,
  'dollar-index': DollarIndexPanel,
  'gold-price': GoldPricePanel,
  'oil-price': OilPricePanel,
  'crypto': CryptoPanel,
  'exchange-rates': ExchangeRatesPanel,
  'us-indices': USIndicesPanel,
  'chinese-indices': ChineseIndicesPanel,
  'china-macro': ChinaMacroPanel,
  'china-pmi': ChinaPMIPanel,
  'china-trade': ChinaTradePanel,
  'china-credit': ChinaCreditPanel,
  'housing-price': HousingPricePanel,
  'custom-stocks': CustomStocksPanel,
  'pboc-rate': PBOCRatePanel,
  'polymarket': PolymarketPanel,
};

export function Dashboard() {
  const { order, movePanel, resetOrder } = usePanelOrder();

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
          className="px-3 py-1 rounded text-sm hover:bg-[#21262d] transition-colors"
          style={{ color: DARK_THEME.textMuted }}
        >
          重置布局
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {order.map((key) => {
              const Component = COMPONENT_MAP[key];
              if (!Component) return null;
              return (
                <DashboardItem key={key} panelKey={key} title={PANEL_TITLES[key]}>
                  <Component />
                </DashboardItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <OverlayPanel />
      </div>

      <footer
        className="mt-8 text-center py-4 border-t"
        style={{ borderColor: DARK_THEME.gridLine, color: DARK_THEME.textMuted }}
      >
        <p className="text-sm">
          全球经济指标看板 v1.0 · 数据来源: FRED, BLS, CoinGecko, Alpha Vantage, AkShare, 东方财富
        </p>
        <p className="text-xs mt-2">
          本工具仅供个人使用，数据可能存在延迟或误差
        </p>
      </footer>
    </main>
  );
}
