import { useState, useRef } from 'react';

export default function DragSortComponent({ items = [], onChange, disabled }) {
  const [order, setOrder] = useState(items.slice());
  const dragIndex = useRef(null);

  function handleDragStart(e, idx) {
    if (disabled) return;
    dragIndex.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    if (disabled) return;
    const from = dragIndex.current;
    const to = idx;
    if (from === null || from === to) return;

    const next = order.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIndex.current = to;
    setOrder(next);
  }

  function handleDrop() {
    if (disabled) return;
    dragIndex.current = null;
    // Build seed-format: order: [id1,id2,...]
    const ids = order.map((it) => {
      if (typeof it === 'string' && it.includes(':')) return it.split(':')[0].trim();
      return String(it);
    });
    const formatted = `order: [${ids.join(',')}]`;
    if (onChange) onChange(formatted, order);
  }

  return (
    <div className="drag-sort">
      <p className="drag-sort__label">Drag to reorder the items and submit when ready</p>
      <div className="drag-sort__list">
        {order.map((it, idx) => (
          <div
            key={typeof it === 'string' ? it : `${idx}-${String(it)}`}
            className="drag-sort__item"
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop()}
          >
            <span className="drag-sort__handle">⋮⋮</span>
            <span className="drag-sort__text">{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
