import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PanelKey } from '../../constants/layoutConfig';

// Masonry packing: the grid container uses 8px implicit rows + grid-auto-flow: dense.
// Each item measures its own content height and reserves a span of 8px tracks so the
// grid can backfill shorter items into gaps left by taller neighbours (no row concept).
const ROW_UNIT = 8; // px — must match grid-auto-rows on the Dashboard grid
const ROW_GAP = 8;  // px — must match row-gap on the Dashboard grid

interface DashboardItemProps {
  panelKey: PanelKey;
  title: string;
  tint: string;
  isNew?: boolean;
  children: ReactNode;
}

export function DashboardItem({ panelKey, title, tint, isNew, children }: DashboardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panelKey });
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [span, setSpan] = useState(30);

  // Point both dnd-kit's ref and our measurement ref at the same DOM node.
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    measureRef.current = node;
  }, [setNodeRef]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const recompute = () => {
      const h = el.getBoundingClientRect().height;
      setSpan(Math.max(1, Math.ceil((h + ROW_GAP) / (ROW_UNIT + ROW_GAP))));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: tint,
    border: '1px solid #000000',
    gridRow: `span ${span}`,
    alignSelf: 'start',
  };

  return (
    <div ref={setRefs} style={style} className="relative">
      {isNew && (
        <div className="dell-new-burst absolute -top-2 -right-2 z-10 px-2 py-0.5 text-xs">
          NEW!
        </div>
      )}
      {/* Drag handle = ribbon-card title bar (white fill, black Helvetica Bold) */}
      <div
        className="dell-ribbon-title drag-handle px-4 py-2 cursor-grab active:cursor-grabbing select-none flex items-center justify-between"
        {...attributes}
        {...listeners}
      >
        <h3 className="text-sm uppercase tracking-wide">{title}</h3>
        <span className="text-xs">⋮⋮</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
