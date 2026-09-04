// 世界经济因果链路板块 - 整宽板块（与 OverlayPanel 同级）
// 合并自 J:\worldeco（因果链路 + 战略物资产业链）并新增美债抛售因果链。
import { useState } from 'react';
import { CausalGraphView, CausalViewConfig } from './CausalGraphView';
import { WORLD_GRAPH } from '../../data/causal/worldGraph';
import { RARE_EARTH_GRAPH } from '../../data/causal/rareEarthGraph';
import { TREASURY_SELLOFF_GRAPH } from '../../data/causal/treasurySelloffGraph';

const VIEWS: CausalViewConfig[] = [
  {
    key: 'world',
    title: '世界经济因果链路',
    graph: WORLD_GRAPH,
    colorMode: 'polarity',
    driverGroups: 'controlGroup',
    resultTitle: '资产结论',
    posLabel: '正向',
    negLabel: '负向',
    zeroLabel: '未触发',
    contribution: 'signed',
    helpText: '+/- 表示事件方向，不代表资产涨跌；资产影响看右侧结论。',
  },
  {
    key: 'treasury',
    title: '美债抛售因果链',
    graph: TREASURY_SELLOFF_GRAPH,
    colorMode: 'polarity',
    driverGroups: 'controlGroup',
    resultTitle: '矛盾结论',
    posLabel: '成立',
    negLabel: '反向',
    zeroLabel: '未触发',
    contribution: 'signed',
    narrative: true,
    defaultActive: ['fiscal_hole', 'geo_conflict', 'ai_money_grab', 'policy_fog', 'global_exit'],
    helpText: '五大结构性压力 -> 美债抛售 -> 贝森特回购干预的全链路叙事；默认全亮，可关闭任一诱因看传导路径。',
  },
  {
    key: 'rareearth',
    title: '战略物资产业链',
    graph: RARE_EARTH_GRAPH,
    colorMode: 'impact',
    driverGroups: 'subgroup',
    resultTitle: '断供冲击',
    posLabel: '受冲击',
    negLabel: '受冲击',
    zeroLabel: '正常',
    contribution: 'sources',
    helpText: '勾选矿产=断供；橙色=断供源，红色=受冲击产业，灰色=正常。悬停节点看产业链明细。',
  },
];

export function CausalGraphSection() {
  const [viewKey, setViewKey] = useState(VIEWS[0].key);
  const view = VIEWS.find(v => v.key === viewKey) ?? VIEWS[0];

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <h2 className="text-black text-lg">世界经济因果链路图</h2>
        <nav className="flex gap-2">
          {VIEWS.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => setViewKey(v.key)}
              className={`px-3 py-1 text-sm font-bold border border-black cursor-pointer transition-colors ${
                v.key === viewKey ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/10'
              }`}
            >
              {v.title}
            </button>
          ))}
        </nav>
      </div>
      <CausalGraphView key={view.key} config={view} />
    </div>
  );
}
