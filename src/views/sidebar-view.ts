import { h, clearChildren } from '../dom';
import { AppState, Player, Position } from '../types';
import { POSITION_LABEL, POSITION_ORDER } from '../constants';

export type SidebarView = { render(state: AppState): void };

const COLLAPSE_KEY = 'touch-formacao:collapsed';

export function groupByPosition(players: readonly Player[]): Record<Position, Player[]> {
  const out: Record<Position, Player[]> = { GK: [], DEF: [], MID: [], STR: [] };
  for (const p of players) out[p.position].push(p);
  for (const k of POSITION_ORDER) out[k].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export function createSidebarRow(player: Player): HTMLElement {
  return h(
    'div',
    {
      class: 'sidebar__row',
      'data-player-id': player.id,
      role: 'button',
      'aria-label': player.name,
      text: player.name.toUpperCase()
    }
  );
}

function loadCollapsed(storage: Storage | null): Set<Position> {
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(COLLAPSE_KEY);
    if (!raw) return new Set();
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is Position => POSITION_ORDER.includes(v as Position)));
  } catch {
    return new Set();
  }
}

function saveCollapsed(storage: Storage | null, set: Set<Position>): void {
  if (!storage) return;
  try { storage.setItem(COLLAPSE_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

const TAP_THRESHOLD_PX = 8;

function attachTap(el: HTMLElement, fn: () => void): void {
  let startX = 0;
  let startY = 0;
  let pointerId: number | null = null;

  el.addEventListener('pointerdown', (e) => {
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
  });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    pointerId = null;
    if (Math.hypot(dx, dy) > TAP_THRESHOLD_PX) return;
    e.stopPropagation();
    fn();
  });
  el.addEventListener('pointercancel', () => { pointerId = null; });
}

export function createSidebarView(
  container: HTMLElement,
  players: readonly Player[],
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null
): SidebarView {
  const collapsed = loadCollapsed(storage);
  let lastState: AppState | null = null;

  function toggle(pos: Position): void {
    if (collapsed.has(pos)) collapsed.delete(pos);
    else collapsed.add(pos);
    saveCollapsed(storage, collapsed);
    if (lastState) render(lastState);
  }

  function render(state: AppState): void {
    lastState = state;
    const placedIds = new Set(state.current.placed.map(p => p.playerId));
    const available = players.filter(p => !placedIds.has(p.id));
    const grouped = groupByPosition(available);

    clearChildren(container);
    for (const pos of POSITION_ORDER) {
      const isCollapsed = collapsed.has(pos);
      const count = grouped[pos].length;
      const head = h(
        'h2',
        {
          class: `sidebar__head${isCollapsed ? ' sidebar__head--collapsed' : ''}`,
          role: 'button',
          'aria-label': `${POSITION_LABEL[pos]} (${count})`,
          'aria-expanded': String(!isCollapsed)
        },
        h('span', { class: 'sidebar__chevron', text: isCollapsed ? '▸' : '▾' }),
        h('span', { class: 'sidebar__head-label', text: POSITION_LABEL[pos] }),
        h('span', { class: 'sidebar__head-count', text: String(count) })
      );
      attachTap(head, () => toggle(pos));

      const list = h('div', { class: 'sidebar__list' }, ...grouped[pos].map(createSidebarRow));
      if (isCollapsed) list.hidden = true;

      container.appendChild(h('section', { class: 'sidebar__group' }, head, list));
    }
  }

  return { render };
}
