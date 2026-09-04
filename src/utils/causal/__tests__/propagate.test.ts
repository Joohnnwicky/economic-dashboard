// 因果传播算法测试 - 从 worldeco/propagate.test.js 移植（vitest）
import { describe, it, expect } from 'vitest';
import { propagate } from '../propagate';
import { WORLD_GRAPH } from '../../../data/causal/worldGraph';

describe('propagate - 世界经济因果链路图', () => {
  it('单驱动直连：cb_buy_gold -> gold = +1', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['cb_buy_gold']));
    expect(net.get('gold')).toBe(1);
  });

  it('央行持续印钱通过通胀和法币信用推升黄金和BTC', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['fed_print']));
    // fed_print->fiat_trust(-1)->hedge_demand(-1)->gold(+1)=+1
    // fed_print->inflation(+1)->hedge_demand(+1)->gold(+1)=+1
    // fed_print->inflation(+1)->fiat_trust(-1)->hedge_demand(-1)->gold(+1)=+1；合计 +3
    expect(net.get('gold')).toBe(3);
    expect(net.get('btc')).toBe(3);
    expect(net.get('gold')!).toBeGreaterThan(0);
  });

  it('加息路径：fed_hike 压制 BTC 和美国股市，黄金多路径相抵', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['fed_hike']));
    expect(net.get('btc')).toBe(-2);
    expect(net.get('us_stock')).toBe(-1);
    expect(net.get('gold')).toBe(0);
  });

  it('互斥相消：clarity_pass + clarity_fail -> eth = 0', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['clarity_pass', 'clarity_fail']));
    expect(net.get('eth')).toBe(0);
  });

  it('单 Clarity 通过 -> eth = +1', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['clarity_pass']));
    expect(net.get('eth')).toBe(1);
  });

  it('无激活 -> 所有节点 net = 0', () => {
    const { net } = propagate(WORLD_GRAPH, new Set());
    for (const n of WORLD_GRAPH.nodes) expect(net.get(n.id)).toBe(0);
  });

  it('多源累加：fed_print + ai_drain -> gold = +2', () => {
    const { net, contrib } = propagate(WORLD_GRAPH, new Set(['fed_print', 'ai_drain']));
    // fed_print 贡献 +3，ai_drain 贡献 -1，合计 +2
    expect(net.get('gold')).toBe(2);
    const c = contrib.get('gold')!;
    expect(c.get('fed_print')).toBe(3);
    expect(c.get('ai_drain')).toBe(-1);
  });

  it('量子冲击三资产同受打击', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['quantum']));
    expect(net.get('btc')).toBe(-1);
    expect(net.get('eth')).toBe(-1);
    expect(net.get('gold')).toBe(-1);
  });

  it('AI产业吸金对 BTC 和 ETH 为负向', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['ai_drain']));
    expect(net.get('btc')).toBe(-1);
    expect(net.get('eth')).toBe(-1);
  });

  it('地缘局势缓和对 BTC 和 ETH 为正向', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['geo_ease']));
    expect(net.get('btc')).toBe(1);
    expect(net.get('eth')).toBe(1);
  });

  it('韩国股票税制收紧压制韩国股市', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['kr_tax_reform']));
    expect(net.get('kr_stock')).toBe(-1);
  });

  it('韩国股市急跌通过风险偏好压制 BTC 和 ETH 并利好黄金', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['kr_stock_drop']));
    expect(net.get('kr_stock')).toBe(-1);
    expect(net.get('btc')).toBe(-2);
    expect(net.get('eth')).toBe(-2);
    expect(net.get('gold')).toBe(2);
  });

  it('AI芯片财报超预期提振美国股市和 BTC/ETH 并压制黄金', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['ai_earnings_beat']));
    expect(net.get('us_stock')).toBe(1);
    expect(net.get('btc')).toBe(1);
    expect(net.get('eth')).toBe(1);
    expect(net.get('gold')).toBe(-1);
  });

  it('美联储降息通过流动性利好 BTC、黄金和美国股市', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['fed_cut']));
    expect(net.get('btc')).toBe(2);
    expect(net.get('gold')).toBe(0);
    expect(net.get('us_stock')).toBe(1);
  });

  it('韩国股票税制放松支撑韩国股市', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['kr_tax_ease']));
    expect(net.get('kr_stock')).toBe(1);
  });

  it('地缘局势紧张利好黄金并压制 BTC、ETH 和美国股市', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['geo_tension']));
    expect(net.get('gold')).toBe(2);
    expect(net.get('btc')).toBe(-2);
    expect(net.get('eth')).toBe(-2);
    expect(net.get('us_stock')).toBe(-1);
  });

  it('美元走弱通过对冲需求利好黄金和BTC', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['usd_weak']));
    expect(net.get('gold')).toBe(1);
    expect(net.get('btc')).toBe(1);
    expect(net.get('eth')).toBe(0);
  });

  it('对冲需求使黄金与BTC同向，区别于风险偏好使二者反向', () => {
    const hedge = propagate(WORLD_GRAPH, new Set(['usd_weak'])).net;
    const risk = propagate(WORLD_GRAPH, new Set(['ai_earnings_beat'])).net;
    expect(hedge.get('gold')!).toBeGreaterThan(0);
    expect(hedge.get('btc')!).toBeGreaterThan(0);
    expect(risk.get('btc')!).toBeGreaterThan(0);
    expect(risk.get('gold')!).toBeLessThan(0);
  });

  it('央行持续印钱通过通胀和法币信用推升对冲需求', () => {
    const { net } = propagate(WORLD_GRAPH, new Set(['fed_print']));
    expect(net.get('hedge_demand')).toBe(3);
  });

  it('contrib 跟踪来源明细', () => {
    const { contrib } = propagate(WORLD_GRAPH, new Set(['clarity_pass']));
    expect(contrib.get('eth')!.has('clarity_pass')).toBe(true);
    expect(contrib.get('eth')!.get('clarity_pass')).toBe(1);
  });
});
