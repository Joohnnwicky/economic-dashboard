import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DARK_THEME } from '../../constants/colors';
import { PanelKey } from '../../constants/layoutConfig';

interface DashboardItemProps {
  panelKey: PanelKey;
  title: string;
  children: ReactNode;
}

export function DashboardItem({ panelKey, title, children }: DashboardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panelKey });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: DARK_THEME.panel,
    borderColor: DARK_THEME.gridLine,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border">
      {/* Drag handle */}
      <div
        className="drag-handle px-4 py-2 cursor-grab active:cursor-grabbing border-b select-none flex items-center justify-between"
        style={{ borderColor: DARK_THEME.gridLine }}
        {...attributes}
        {...listeners}
      >
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          {title}
        </h3>
        <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>⋮⋮</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
