// CausalGraphSection 组件测试 - mock cytoscape，验证标签切换与驱动开关的 React 接线
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CausalGraphSection } from '../CausalGraphSection';

// cytoscape mock：记录元素、返回可遍历的假节点/边
vi.mock('cytoscape', () => {
  const makeNode = (id: string, group: string) => ({
    id: () => id,
    data: (k: string) => (k === 'group' ? group : undefined),
    style: vi.fn(),
    removeClass: vi.fn(),
    addClass: vi.fn(),
  });
  const makeEdge = (srcId: string) => ({
    source: () => ({ id: () => srcId }),
    removeClass: vi.fn(),
    addClass: vi.fn(),
  });
  const cytoscape = vi.fn((opts: { elements: Array<{ data: { id: string; group: string; source?: string } }> }) => {
    const elems = opts.elements;
    const nodes = elems.filter(e => !e.data.source).map(e => makeNode(e.data.id, e.data.group));
    const edges = elems.filter(e => e.data.source).map(e => makeEdge(e.data.source));
    return {
      nodes: () => nodes,
      edges: () => edges,
      elements: () => [...nodes, ...edges],
      on: vi.fn(),
      ready: (cb: () => void) => cb(),
      destroy: vi.fn(),
      fit: vi.fn(),
      minZoom: vi.fn(),
      zoom: () => 1,
    };
  });
  (cytoscape as unknown as { use: ReturnType<typeof vi.fn> }).use = vi.fn();
  return { default: cytoscape };
});

describe('CausalGraphSection', () => {
  it('渲染三个子视图标签，默认展示世界经济因果链路', () => {
    render(<CausalGraphSection />);
    expect(screen.getByText('世界经济因果链路图')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '世界经济因果链路' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '美债抛售因果链' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '战略物资产业链' })).toBeInTheDocument();
    // 默认视图：驱动开关 + 资产结论（未触发基线）
    expect(screen.getByText('资产结论')).toBeInTheDocument();
    // 方向互斥组渲染为按钮（美联储利率: +加息 / -降息）
    expect(screen.getByRole('button', { name: '+ 加息' })).toBeInTheDocument();
    expect(screen.getAllByText('未触发').length).toBeGreaterThan(0);
  });

  it('切换到美债抛售因果链：默认五诱因全亮，结论面板成立', () => {
    render(<CausalGraphSection />);
    fireEvent.click(screen.getByRole('button', { name: '美债抛售因果链' }));
    expect(screen.getByText('矛盾结论')).toBeInTheDocument();
    // 五大诱因复选框默认勾选
    const fiscal = screen.getByLabelText('财政黑洞') as HTMLInputElement;
    expect(fiscal.checked).toBe(true);
    // 三大矛盾结论均"成立"
    expect(screen.getAllByText('成立').length).toBe(3);
  });

  it('关闭"财政黑洞"后，抛售链仍由其余四诱因传导（结论仍成立）', () => {
    render(<CausalGraphSection />);
    fireEvent.click(screen.getByRole('button', { name: '美债抛售因果链' }));
    fireEvent.click(screen.getByLabelText('财政黑洞'));
    expect(screen.getAllByText('成立').length).toBe(3);
  });

  it('切换到战略物资产业链：按矿产分组渲染断供开关', () => {
    render(<CausalGraphSection />);
    fireEvent.click(screen.getByRole('button', { name: '战略物资产业链' }));
    expect(screen.getByText('轻稀土（铈族）')).toBeInTheDocument();
    expect(screen.getByText('重稀土（钇族）')).toBeInTheDocument();
    expect(screen.getByText('断供冲击')).toBeInTheDocument();
    // 勾选"钨" -> HBM链与导弹部件链传导，多个终端产业受冲击
    fireEvent.click(screen.getByLabelText('钨'));
    expect(screen.getByText('AI硬件/GPU')).toBeInTheDocument();
    expect(screen.getAllByText('受冲击').length).toBeGreaterThan(0);
  });
});
