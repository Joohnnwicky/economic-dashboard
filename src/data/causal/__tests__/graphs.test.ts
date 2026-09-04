// 因果图数据结构校验 - 从 worldeco/graph.test.js 与 rareearth-graph.test.js 移植（vitest）
// 对三张图（世界经济 / 美债抛售 / 战略物资产业链）统一做结构检查，另含各图行为回归。
import { describe, it, expect } from 'vitest';
import { CausalGraph } from '../../../types/causal';
import { topologicalSort, propagate } from '../../../utils/causal/propagate';
import { WORLD_GRAPH } from '../worldGraph';
import { RARE_EARTH_GRAPH } from '../rareEarthGraph';
import { TREASURY_SELLOFF_GRAPH } from '../treasurySelloffGraph';

const ALL_GRAPHS: Array<[string, CausalGraph]> = [
  ['世界经济因果链路图', WORLD_GRAPH],
  ['美债抛售因果链图', TREASURY_SELLOFF_GRAPH],
  ['战略物资产业链图', RARE_EARTH_GRAPH],
];

describe.each(ALL_GRAPHS)('图结构完整性 - %s', (_name, graph) => {
  it('所有节点 id 唯一', () => {
    const ids = graph.nodes.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有边引用存在的节点', () => {
    const idSet = new Set(graph.nodes.map(n => n.id));
    for (const e of graph.edges) {
      expect(idSet.has(e.source), `边 source 不存在: ${e.source}`).toBe(true);
      expect(idSet.has(e.target), `边 target 不存在: ${e.target}`).toBe(true);
    }
  });

  it('极性只能是 1 或 -1', () => {
    for (const e of graph.edges) {
      expect(e.polarity === 1 || e.polarity === -1, `边极性非法: ${JSON.stringify(e)}`).toBe(true);
    }
  });

  it('图是无环 DAG', () => {
    expect(() => topologicalSort(graph.nodes, graph.edges)).not.toThrow();
  });

  it('分组完整：driver/macro/asset', () => {
    const groups = new Set(graph.nodes.map(n => n.group));
    expect([...groups].sort()).toEqual(['asset', 'driver', 'macro']);
  });

  it('无激活 -> 所有节点 net = 0', () => {
    const { net } = propagate(graph, new Set());
    for (const n of graph.nodes) expect(net.get(n.id)).toBe(0);
  });
});

describe('世界经济因果链路图 - 专属结构', () => {
  it('三资产节点存在', () => {
    const ids = new Set(WORLD_GRAPH.nodes.map(n => n.id));
    for (const a of ['gold', 'btc', 'eth']) expect(ids.has(a), `缺少资产节点: ${a}`).toBe(true);
  });

  it('方向选择器 driver 元数据完整且同组方向不重复', () => {
    const grouped = WORLD_GRAPH.nodes.filter(n => n.group === 'driver' && n.controlGroup);
    const required = ['controlLabel', 'direction', 'directionMark', 'directionLabel', 'controlHint'] as const;

    for (const n of grouped) {
      for (const key of required) expect(n[key], `${n.id} 缺少 ${key}`).toBeTruthy();
      expect(n.direction === 'up' || n.direction === 'down', `${n.id} direction 非法`).toBe(true);
      expect(n.directionMark === '+' || n.directionMark === '-', `${n.id} directionMark 非法`).toBe(true);
    }

    const seen = new Set<string>();
    for (const n of grouped) {
      const key = n.controlGroup + ':' + n.direction;
      expect(seen.has(key), `方向选择器同组方向重复: ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('对冲需求节点存在且非孤立', () => {
    const node = WORLD_GRAPH.nodes.find(n => n.id === 'hedge_demand');
    expect(node, '缺少对冲需求节点').toBeTruthy();
    expect(node!.group).toBe('macro');
    expect(WORLD_GRAPH.edges.some(e => e.target === 'hedge_demand'), '对冲需求缺少入边').toBe(true);
    expect(WORLD_GRAPH.edges.some(e => e.source === 'hedge_demand'), '对冲需求缺少出边').toBe(true);
  });
});

describe('美债抛售因果链图 - 行为回归', () => {
  it('五大诱因驱动节点与三大矛盾结论节点存在', () => {
    const drivers = TREASURY_SELLOFF_GRAPH.nodes.filter(n => n.group === 'driver').map(n => n.id);
    expect(drivers).toEqual(['fiscal_hole', 'geo_conflict', 'ai_money_grab', 'policy_fog', 'global_exit']);
    const assets = TREASURY_SELLOFF_GRAPH.nodes.filter(n => n.group === 'asset').map(n => n.id);
    expect(assets).toEqual(['symptom', 'unorthodox', 'chain_intervene']);
  });

  it('单一诱因（财政黑洞）点亮完整链路至三大矛盾', () => {
    const { net } = propagate(TREASURY_SELLOFF_GRAPH, new Set(['fiscal_hole']));
    for (const id of ['selloff', 'bessent', 'mkt_react', 'one_day', 'bessent_reply',
      'street_reads', 'stealth_ot', 'pandora', 'hf_sweep', 'root',
      'symptom', 'unorthodox', 'chain_intervene']) {
      expect(net.get(id), `${id} 应被触发`).toBeGreaterThan(0);
    }
  });

  it('五大诱因全开 -> 抛售节点净值为 5，矛盾结论为 3 路解读汇聚', () => {
    const all = new Set(TREASURY_SELLOFF_GRAPH.nodes.filter(n => n.group === 'driver').map(n => n.id));
    const { net } = propagate(TREASURY_SELLOFF_GRAPH, all);
    expect(net.get('selloff')).toBe(5);
    // root 汇聚 F1/F2/F3 三条解读，每条携带 5 个诱因的贡献：5 x 3 = 15
    expect(net.get('root')).toBe(15);
    expect(net.get('symptom')).toBe(15);
  });

  it('关闭 AI抢钱 -> 下游链路仍由其余四诱因传导', () => {
    const active = new Set(['fiscal_hole', 'geo_conflict', 'policy_fog', 'global_exit']);
    const { net } = propagate(TREASURY_SELLOFF_GRAPH, active);
    expect(net.get('selloff')).toBe(4);
    expect(net.get('symptom')).toBe(12);
  });
});

describe('战略物资产业链图 - 专属结构与断供回归（从 worldeco 移植）', () => {
  it('15 个矿产节点存在且带 subgroup', () => {
    const drivers = RARE_EARTH_GRAPH.nodes.filter(n => n.group === 'driver');
    expect(drivers.length).toBe(15);
    for (const d of drivers) {
      expect(['light', 'heavy', 'metal', 'gas'].includes(d.subgroup ?? ''), `${d.id} 缺 subgroup`).toBe(true);
    }
  });

  it('11 个终端产业节点存在', () => {
    const assets = RARE_EARTH_GRAPH.nodes.filter(n => n.group === 'asset');
    expect(assets.length).toBe(11);
  });

  it('断供钨 -> HBM内存与AI硬件受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['w']));
    expect(net.get('hpw')).toBe(1);
    expect(net.get('wf6')).toBe(1);
    expect(net.get('hbm')).toBe(1);
    expect(net.get('ai_gpu')).toBe(1);
  });

  it('断供钨 -> 军工经导弹部件受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['w']));
    expect(net.get('missile_part')).toBe(1);
    expect(net.get('defense')).toBe(1);
  });

  it('断供镝+铽 -> 汽车产业与光通信同时受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['dy', 'tb']));
    expect(net.get('magnet')!, '高性能磁铁应受冲击').toBeGreaterThan(0);
    expect(net.get('auto')!, '汽车产业应受冲击').toBeGreaterThan(0);
    expect(net.get('isolator')!, '光隔离器应受冲击（铽双链）').toBeGreaterThan(0);
    expect(net.get('opt_comms')!, '光通信应受冲击（铽双链）').toBeGreaterThan(0);
  });

  it('断供钇 -> AI服务器经氧化锆/MLCC受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['y']));
    expect(net.get('y2o3')).toBe(1);
    expect(net.get('zro2')).toBe(1);
    expect(net.get('mlcc')).toBe(1);
    expect(net.get('ai_server')).toBe(1);
  });

  it('断供钕 -> 风电、机器人、汽车均受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['nd']));
    expect(net.get('magnet')!).toBeGreaterThan(0);
    expect(net.get('wind_power')!, '风电应受冲击').toBeGreaterThan(0);
    expect(net.get('robotics')!, '工业机器人应受冲击').toBeGreaterThan(0);
    expect(net.get('auto')!, '汽车应受冲击').toBeGreaterThan(0);
  });

  it('断供铈 -> 半导体制造与汽车同时受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['ce']));
    expect(net.get('ceo2')).toBe(1);
    expect(net.get('wafer_polish')).toBe(1);
    expect(net.get('semiconductor_mfg')!, '半导体制造应受冲击').toBeGreaterThan(0);
    expect(net.get('auto')!, '汽车(尾气催化)应受冲击').toBeGreaterThan(0);
  });

  it('断供氦气 -> 5条产业链终端全受冲击', () => {
    const { net } = propagate(RARE_EARTH_GRAPH, new Set(['he']));
    for (const a of ['opt_comms', 'medical', 'aerospace', 'semiconductor_mfg', 'defense']) {
      expect(net.get(a)!, `${a} 应受氦气断供冲击`).toBeGreaterThan(0);
    }
  });

  it('全部矿产断供 -> 所有终端产业受冲击', () => {
    const all = new Set(RARE_EARTH_GRAPH.nodes.filter(n => n.group === 'driver').map(n => n.id));
    const { net } = propagate(RARE_EARTH_GRAPH, all);
    for (const a of RARE_EARTH_GRAPH.nodes.filter(n => n.group === 'asset')) {
      expect(net.get(a.id)!, `终端产业 ${a.label} 应受冲击`).toBeGreaterThan(0);
    }
  });

  it('contrib 多源：断供钕+铈 -> 汽车有两个断供源', () => {
    const { contrib } = propagate(RARE_EARTH_GRAPH, new Set(['nd', 'ce']));
    const c = contrib.get('auto')!;
    expect(c.has('nd'), '汽车应有钕(EV电机)来源').toBe(true);
    expect(c.has('ce'), '汽车应有铈(尾气催化)来源').toBe(true);
  });
});
