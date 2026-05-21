import { describe, it, expect, beforeEach } from 'vitest';
import { createSidebarView, groupByPosition, createSidebarRow } from '../../src/views/sidebar-view';
import { EMPTY_STATE } from '../../src/constants';
import { Player } from '../../src/types';

const players: Player[] = [
  { id: 'a1', name: 'Alice', position: 'GK', photo: '' },
  { id: 'a2', name: 'Bob', position: 'DEF', photo: '' },
  { id: 'a3', name: 'Carol', position: 'DEF', photo: '' },
  { id: 'a4', name: 'Diana', position: 'STR', photo: '' }
];

describe('groupByPosition', () => {
  it('groups by position and sorts by name', () => {
    const g = groupByPosition([
      { id: 'b', name: 'Bob', position: 'DEF', photo: '' },
      { id: 'a', name: 'Alice', position: 'DEF', photo: '' }
    ]);
    expect(g.DEF.map(p => p.name)).toEqual(['Alice', 'Bob']);
    expect(g.GK).toEqual([]);
  });
});

describe('createSidebarRow', () => {
  it('uppercases name and sets data-player-id', () => {
    const el = createSidebarRow(players[0]!);
    expect(el.classList.contains('sidebar__row')).toBe(true);
    expect(el.dataset.playerId).toBe('a1');
    expect(el.textContent).toBe('ALICE');
  });
});

describe('createSidebarView', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders 4 groups in fixed order', () => {
    createSidebarView(container, players, null).render(EMPTY_STATE);
    const labels = Array.from(container.querySelectorAll('.sidebar__head-label')).map(e => e.textContent);
    expect(labels).toEqual(['TORHÜTER', 'VERTEIDIGER', 'MITTELFELD', 'ANGRIFF']);
  });

  it('omits players already placed on the field', () => {
    const view = createSidebarView(container, players, null);
    view.render({
      current: { placed: [{ playerId: 'a2', x: 50, y: 50 }] },
      slots: [null, null, null]
    });
    const rows = Array.from(container.querySelectorAll('.sidebar__row')).map(e => e.textContent);
    expect(rows).not.toContain('BOB');
    expect(rows).toContain('CAROL');
  });

  it('toggles group on header tap and hides player list', () => {
    const view = createSidebarView(container, players, null);
    view.render(EMPTY_STATE);

    function tap(el: Element): void {
      const down = new Event('pointerdown', { bubbles: true }) as PointerEvent;
      Object.defineProperty(down, 'pointerId', { value: 1 });
      Object.defineProperty(down, 'clientX', { value: 0 });
      Object.defineProperty(down, 'clientY', { value: 0 });
      el.dispatchEvent(down);
      const up = new Event('pointerup', { bubbles: true }) as PointerEvent;
      Object.defineProperty(up, 'pointerId', { value: 1 });
      Object.defineProperty(up, 'clientX', { value: 0 });
      Object.defineProperty(up, 'clientY', { value: 0 });
      el.dispatchEvent(up);
    }

    const defHead = Array.from(container.querySelectorAll<HTMLElement>('.sidebar__head'))
      .find(h => h.querySelector('.sidebar__head-label')?.textContent === 'VERTEIDIGER')!;
    expect(defHead.classList.contains('sidebar__head--collapsed')).toBe(false);
    tap(defHead);
    const collapsedHead = Array.from(container.querySelectorAll<HTMLElement>('.sidebar__head'))
      .find(h => h.querySelector('.sidebar__head-label')?.textContent === 'VERTEIDIGER')!;
    expect(collapsedHead.classList.contains('sidebar__head--collapsed')).toBe(true);
    const defGroup = collapsedHead.parentElement!;
    expect(defGroup.querySelector<HTMLElement>('.sidebar__list')!.hidden).toBe(true);
  });
});
