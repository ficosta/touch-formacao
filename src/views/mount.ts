import { Store, ActionType } from '../state';
import { Player } from '../types';
import { createSidebarView } from './sidebar-view';
import { createFieldView } from './field-view';
import { createSlotsView } from './slots-view';

const SIDEBAR_TRIGGERS: ReadonlySet<ActionType> = new Set(['add', 'remove', 'load-slot', 'clear-current']);
const FIELD_TRIGGERS:   ReadonlySet<ActionType> = new Set(['add', 'move', 'remove', 'load-slot', 'clear-current']);
const SLOTS_TRIGGERS:   ReadonlySet<ActionType> = new Set(['save-slot', 'load-slot']);

export type ViewRefs = {
  sidebar: HTMLElement;
  field: HTMLElement;
  slots: HTMLElement;
};

export function mountViews(refs: ViewRefs, players: readonly Player[], store: Store): void {
  const sidebar = createSidebarView(refs.sidebar, players);
  const field = createFieldView(refs.field, players);
  const slots = createSlotsView(refs.slots);

  const initial = store.getState();
  sidebar.render(initial);
  field.render(initial);
  slots.render(initial);

  store.subscribe((state, action) => {
    if (SIDEBAR_TRIGGERS.has(action.type)) sidebar.render(state);
    if (FIELD_TRIGGERS.has(action.type)) field.render(state);
    if (SLOTS_TRIGGERS.has(action.type)) slots.render(state);
  });
}
