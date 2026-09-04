// 因果链路图通用视图 - 从 worldeco/app.js 与 rareearth-app.js 移植合并
// 渲染 Cytoscape+dagre 图 + 驱动开关面板 + 结论面板 + 悬停 tooltip。
// 视图差异（配色/分组/文案）由 CausalViewConfig 驱动，不写死节点 ID。
import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import cytoscapeDagre from 'cytoscape-dagre';
import { CausalGraph } from '../../types/causal';
import { propagate } from '../../utils/causal/propagate';

cytoscape.use(cytoscapeDagre);

export interface CausalViewConfig {
  key: string;
  title: string;
  graph: CausalGraph;
  /** polarity: 净值红绿（因果链路）；impact: 断供橙源/红冲击（产业链） */
  colorMode: 'polarity' | 'impact';
  /** 驱动面板分组方式：controlGroup=方向互斥按钮组；subgroup=矿产分类复选框 */
  driverGroups: 'controlGroup' | 'subgroup';
  resultTitle: string;
  posLabel: string;
  negLabel: string;
  zeroLabel: string;
  /** 贡献明细样式：signed=带符号净值；sources=断供源列表 */
  contribution: 'signed' | 'sources';
  /** 叙事图：节点用宽矩形承载多行长文案 */
  narrative?: boolean;
  /** 默认激活的驱动 id 列表 */
  defaultActive?: string[];
  helpText: string;
}

const POS = '#4caf50';     // 正向绿
const NEG = '#f44336';     // 负向红 / 受冲击红
const ZERO = '#8a8a8a';    // 未触发灰（白底加深一档）
const DRIVER_BG = '#2a4a7f'; // 驱动默认蓝
const SOURCE = '#ff9800';  // 断供源橙

// 战略物资产业链的矿产分组（与 rareEarthGraph.ts 的 subgroup 对应）
const SUBGROUPS = [
  { key: 'light', title: '轻稀土（铈族）' },
  { key: 'heavy', title: '重稀土（钇族）' },
  { key: 'metal', title: '关键金属（同管制）' },
  { key: 'gas',   title: '战略气体（同管制）' },
];

function buildStyles(config: CausalViewConfig): cytoscape.StylesheetStyle[] {
  const narrative = !!config.narrative;
  const base: cytoscape.StylesheetStyle[] = [
    {
      selector: 'node',
      style: {
        label: 'data(label)', 'text-valign': 'center', 'text-halign': 'center',
        color: '#fff', 'font-size': '11px',
        width: narrative ? '120px' : '76px', height: narrative ? '48px' : '36px',
        shape: 'round-rectangle', 'background-color': ZERO,
        'text-wrap': 'wrap', 'text-max-width': narrative ? '112px' : '70px',
      },
    },
    { selector: 'node[group="driver"]', style: { 'background-color': DRIVER_BG } },
    {
      selector: 'node[group="macro"]',
      style: narrative
        ? { shape: 'round-rectangle', width: '120px', height: '48px' }
        : { shape: 'ellipse', width: '60px', height: '60px' },
    },
    {
      selector: 'node[group="asset"]',
      style: narrative
        ? { shape: 'round-rectangle', width: '120px', height: '48px' }
        : { shape: 'diamond', width: '84px', height: '64px', 'font-size': '13px', 'font-weight': 'bold' },
    },
    {
      selector: 'edge',
      style: {
        width: 2, 'line-color': '#444', 'target-arrow-color': '#444',
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier', opacity: 0.6,
      },
    },
    { selector: '.active-edge', style: { width: 4, opacity: 1 } },
    { selector: '.dim', style: { opacity: 0.2 } },
  ];
  if (config.colorMode === 'polarity') {
    base.push(
      { selector: 'edge[polarity=1]',  style: { 'line-color': '#3a7d3a', 'target-arrow-color': '#3a7d3a' } },
      { selector: 'edge[polarity=-1]', style: { 'line-color': '#7d3a3a', 'target-arrow-color': '#7d3a3a' } },
    );
  } else {
    base.push({ selector: '.active-edge', style: { 'line-color': NEG, 'target-arrow-color': NEG } });
  }
  return base;
}

export function CausalGraphView({ config }: { config: CausalViewConfig }) {
  const graph = config.graph;
  const [active, setActive] = useState<Set<string>>(() => new Set(config.defaultActive ?? []));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const nodeById = useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph]);

  // 初始化 Cytoscape 实例（图切换时销毁重建）
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        graph.nodes.map(n => ({ data: { id: n.id, label: n.label, group: n.group } })),
        graph.edges.map((e, i) => ({ data: { id: 'e' + i, source: e.source, target: e.target, polarity: e.polarity } })),
      ].flat(),
      style: buildStyles(config),
      layout: {
        name: 'dagre', rankDir: 'LR', nodeSep: 30, rankSep: 80, directed: true,
      } as unknown as cytoscape.LayoutOptions,
    });
    cyRef.current = cy;

    const fitView = () => {
      cy.fit(cy.elements(), 30);
      cy.minZoom(cy.zoom());
    };
    cy.ready(fitView);

    // tooltip：悬停节点显示说明、状态与来源明细
    cy.on('mouseover', 'node', (evt) => {
      const id = evt.target.id();
      const node = nodeById.get(id);
      const r = propagate(graph, activeRef.current);
      const v = r.net.get(id) || 0;
      const c = r.contrib.get(id);
      const lines = [`<b>${node?.label ?? id}</b>`];
      if (node?.note) lines.push(node.note);
      if (config.colorMode === 'impact') {
        const status = node?.group === 'driver'
          ? (activeRef.current.has(id) ? '断供中' : '正常')
          : (v > 0 ? '受冲击' : '正常');
        lines.push(`状态: ${status}`);
      } else {
        lines.push(`净值: ${v}`);
      }
      if (c && c.size) {
        if (config.contribution === 'sources') {
          const srcs: string[] = [];
          c.forEach((_val, d) => { const drv = nodeById.get(d); srcs.push(drv?.label ?? d); });
          lines.push('断供源: ' + srcs.join('、'));
        } else {
          c.forEach((val, d) => {
            const drv = nodeById.get(d);
            lines.push(`${val > 0 ? '+' : ''}${val} ${drv?.label ?? d}`);
          });
        }
      }
      if (tooltipRef.current) {
        tooltipRef.current.innerHTML = lines.join('<br>');
        tooltipRef.current.style.display = 'block';
      }
    });
    cy.on('mouseout', 'node', () => { if (tooltipRef.current) tooltipRef.current.style.display = 'none'; });
    cy.on('mousemove', (evt) => {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.left = (evt.originalEvent.clientX + 12) + 'px';
      tooltipRef.current.style.top = (evt.originalEvent.clientY + 12) + 'px';
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // 按当前激活驱动重算并应用节点/边样式
  const result = useMemo(() => propagate(graph, active), [graph, active]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const net = result.net;

    cy.nodes().forEach(n => {
      const v = net.get(n.id()) || 0;
      let bg: string;
      if (config.colorMode === 'impact') {
        bg = n.data('group') === 'driver'
          ? (active.has(n.id()) ? SOURCE : ZERO)
          : (v > 0 ? NEG : ZERO);
      } else {
        bg = v > 0 ? POS : v < 0 ? NEG : (n.data('group') === 'driver' ? DRIVER_BG : ZERO);
      }
      n.style('background-color', bg);
      n.removeClass('dim');
    });

    cy.edges().forEach(e => {
      const src = e.source().id();
      e.removeClass('active-edge dim');
      const srcActive = active.has(src) || (net.get(src) || 0) !== 0;
      if (srcActive) e.addClass('active-edge');
      else if (active.size > 0) e.addClass('dim');
    });
  }, [result, active, config.colorMode]);

  // ===== 驱动开关交互 =====
  const toggleDriver = (id: string) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const setDirectional = (id: string, group: string) => {
    setActive(prev => {
      const next = new Set(prev);
      const siblings = graph.nodes.filter(n => n.controlGroup === group);
      siblings.forEach(n => next.delete(n.id));
      if (!prev.has(id)) next.add(id);
      return next;
    });
  };
  const resetAll = () => setActive(new Set());
  const resetView = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(cy.elements(), 30);
  };

  // ===== 驱动面板渲染数据 =====
  const drivers = graph.nodes.filter(n => n.group === 'driver');
  const grouped = new Map<string, typeof drivers>();
  const singles: typeof drivers = [];
  if (config.driverGroups === 'controlGroup') {
    drivers.forEach(n => {
      if (n.controlGroup) {
        if (!grouped.has(n.controlGroup)) grouped.set(n.controlGroup, []);
        grouped.get(n.controlGroup)!.push(n);
      } else {
        singles.push(n);
      }
    });
    grouped.forEach(nodes => nodes.sort((a, b) => (a.direction === 'up' ? -1 : 1) - (b.direction === 'up' ? -1 : 1)));
  }

  const checkboxLabel = 'flex items-center gap-2 py-1 px-1 text-sm cursor-pointer hover:bg-black/5';
  const groupBtn = 'flex-1 px-2 py-1 text-sm border border-black bg-white cursor-pointer';
  const activeGroupBtn = 'flex-1 px-2 py-1 text-sm border border-black bg-[#2a4a7f] text-white cursor-pointer';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        {/* 左：驱动开关 */}
        <aside className="w-56 shrink-0 border border-black bg-white p-2 overflow-y-auto" style={{ maxHeight: 560 }}>
          <h3 className="text-xs font-bold mb-2 uppercase tracking-wide">驱动开关</h3>
          <div className="mb-2 py-1.5 px-2 text-xs leading-relaxed bg-[#f2f2f2] border-l-4 border-[#2a4a7f]">
            {config.helpText}
          </div>

          {config.driverGroups === 'controlGroup' ? (
            <>
              {Array.from(grouped.entries()).map(([group, nodes]) => (
                <div key={group} className="mb-3 pb-2 border-b border-black/20">
                  <div className="text-sm font-bold mb-1">{nodes[0].controlLabel}</div>
                  <div className="flex gap-1">
                    {nodes.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        title={n.label}
                        className={active.has(n.id) ? activeGroupBtn : groupBtn}
                        onClick={() => setDirectional(n.id, group)}
                      >
                        {n.directionMark} {n.directionLabel}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-[#4d4d4d] leading-snug">{nodes[0].controlHint}</div>
                </div>
              ))}
              {singles.map(n => (
                <label key={n.id} className={checkboxLabel} title={n.note || n.label}>
                  <input type="checkbox" checked={active.has(n.id)} onChange={() => toggleDriver(n.id)} />
                  {n.label}
                </label>
              ))}
            </>
          ) : (
            <>
              {SUBGROUPS.map(sg => {
                const nodes = drivers.filter(n => n.subgroup === sg.key);
                if (!nodes.length) return null;
                return (
                  <div key={sg.key} className="mb-3 pb-2 border-b border-black/20">
                    <div className="text-sm font-bold mb-1">{sg.title}</div>
                    {nodes.map(n => (
                      <label key={n.id} className={checkboxLabel} title={n.note || n.label}>
                        <input type="checkbox" checked={active.has(n.id)} onChange={() => toggleDriver(n.id)} />
                        {n.label}
                      </label>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          <button type="button" onClick={resetAll} className="mt-3 w-full py-1.5 text-sm font-bold border border-black bg-white cursor-pointer hover:bg-black hover:text-white">
            全部重置
          </button>
          <button type="button" onClick={resetView} className="mt-1 w-full py-1.5 text-sm font-bold border border-black bg-white cursor-pointer hover:bg-black hover:text-white">
            重置画面
          </button>
        </aside>

        {/* 中：因果图 */}
        <div
          ref={containerRef}
          className="flex-1 min-w-0 border border-black bg-white"
          style={{ height: 560 }}
        />

        {/* 右：结论面板 */}
        <aside className="w-60 shrink-0 border border-black bg-white p-2 overflow-y-auto" style={{ maxHeight: 560 }}>
          <h3 className="text-xs font-bold mb-2 uppercase tracking-wide">{config.resultTitle}</h3>
          {graph.nodes.filter(n => n.group === 'asset').map(n => {
            const v = result.net.get(n.id) || 0;
            const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero';
            const verdict = v > 0 ? config.posLabel : v < 0 ? config.negLabel : config.zeroLabel;
            const c = result.contrib.get(n.id);
            const lines: string[] = [];
            c?.forEach((val, d) => {
              const drv = nodeById.get(d);
              if (config.contribution === 'sources') {
                lines.push(drv?.label ?? d);
              } else {
                lines.push(`${val > 0 ? '+' : ''}${val} ${drv?.label ?? d}`);
              }
            });
            return (
              <div
                key={n.id}
                className={`asset-row mb-1.5 p-2 bg-[#f2f2f2] ${cls}`}
                style={{ borderLeft: `4px solid ${v > 0 ? POS : v < 0 ? NEG : '#8a8a8a'}` }}
              >
                <div className="flex justify-between text-sm font-bold">
                  <span>{n.label}</span>
                  <span>{verdict}</span>
                </div>
                {lines.length > 0 && (
                  <div className="mt-1 text-xs text-[#4d4d4d] leading-snug">
                    {config.contribution === 'sources' ? `断供源: ${lines.join('、')}` : lines.join(' · ')}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
      </div>

      {/* 悬停 tooltip */}
      <div
        ref={tooltipRef}
        className="fixed hidden z-50 max-w-[260px] px-2 py-1.5 text-xs text-white bg-black rounded pointer-events-none"
      />
    </div>
  );
}
