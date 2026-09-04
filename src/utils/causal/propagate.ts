// 因果传播算法 - 从 worldeco/propagate.js 移植（纯函数，无副作用）
// 不硬编码任何节点 ID，纯图算法：拓扑排序后沿边累加带符号贡献。
import { CausalEdge, CausalGraph, CausalNode, PropagateResult } from '../../types/causal';

function buildGraphIndex(nodes: CausalNode[], edges: CausalEdge[]) {
  const ids = nodes.map(n => n.id);
  const inDegree = new Map(ids.map(id => [id, 0]));
  const outAdj = new Map<string, { target: string; polarity: number }[]>(ids.map(id => [id, []]));
  const inAdj = new Map<string, { source: string; polarity: number }[]>(ids.map(id => [id, []]));
  for (const e of edges) {
    outAdj.get(e.source)!.push({ target: e.target, polarity: e.polarity });
    inAdj.get(e.target)!.push({ source: e.source, polarity: e.polarity });
    inDegree.set(e.target, inDegree.get(e.target)! + 1);
  }
  return { ids, inDegree, outAdj, inAdj };
}

export function topologicalSort(nodes: CausalNode[], edges: CausalEdge[]): string[] {
  const { ids, inDegree, outAdj } = buildGraphIndex(nodes, edges);
  const inDeg = new Map(inDegree);
  const queue = ids.filter(id => inDeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    order.push(n);
    for (const { target } of outAdj.get(n)!) {
      inDeg.set(target, inDeg.get(target)! - 1);
      if (inDeg.get(target) === 0) queue.push(target);
    }
  }
  if (order.length !== ids.length) throw new Error('图存在环，不是 DAG');
  return order;
}

export function propagate(graph: CausalGraph, activeDrivers: Set<string> | string[]): PropagateResult {
  const active = activeDrivers instanceof Set ? activeDrivers : new Set(activeDrivers);
  const isDriver = new Set(graph.nodes.filter(n => n.group === 'driver').map(n => n.id));
  const order = topologicalSort(graph.nodes, graph.edges);
  const { inAdj } = buildGraphIndex(graph.nodes, graph.edges);

  const net = new Map<string, number>();
  const contrib = new Map<string, Map<string, number>>();
  for (const id of order) {
    net.set(id, 0);
    contrib.set(id, new Map());
  }

  for (const id of order) {
    if (isDriver.has(id)) {
      if (active.has(id)) {
        net.set(id, 1);
        contrib.get(id)!.set(id, 1);
      }
      continue;
    }
    for (const { source, polarity } of inAdj.get(id)!) {
      const srcContrib = contrib.get(source);
      if (!srcContrib || srcContrib.size === 0) continue;
      for (const [driver, val] of srcContrib) {
        const delta = val * polarity;
        net.set(id, net.get(id)! + delta);
        const m = contrib.get(id)!;
        m.set(driver, (m.get(driver) || 0) + delta);
      }
    }
  }
  return { net, contrib };
}
