// 因果链路图类型定义（从 worldeco 移植）
// group: driver=可开关事件, macro=中间传导层, asset=终点结论

export interface CausalNode {
  id: string;
  label: string;
  group: 'driver' | 'macro' | 'asset';
  /** 节点说明（tooltip 展示） */
  note?: string;
  /** 方向互斥组：同组驱动渲染为 +/- 按钮组（如 美联储利率: 加息/降息） */
  controlGroup?: string;
  controlLabel?: string;
  direction?: 'up' | 'down';
  directionMark?: string;
  directionLabel?: string;
  controlHint?: string;
  /** 矿产分类（战略物资产业链图）：light/heavy/metal/gas */
  subgroup?: string;
}

export interface CausalEdge {
  source: string;
  target: string;
  /** 1 = 推动上升, -1 = 推动下降 */
  polarity: 1 | -1;
  note?: string;
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

/** propagate() 的返回结构 */
export interface PropagateResult {
  /** 节点 -> 净值（各驱动贡献的带符号和） */
  net: Map<string, number>;
  /** 节点 -> (驱动 -> 带符号贡献) 明细 */
  contrib: Map<string, Map<string, number>>;
}
