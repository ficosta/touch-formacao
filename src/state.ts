import {
  AppState,
  EMPTY_STATE,
  Lineup,
  Placed,
  SlotIndex
} from './types';

const STORAGE_KEY = 'touch-formacao:state';
const DEBOUNCE_MS = 200;

type Listener = (state: AppState) => void;

export type Action =
  | { type: 'add'; playerId: string; x: number; y: number }
  | { type: 'move'; playerId: string; x: number; y: number }
  | { type: 'remove'; playerId: string }
  | { type: 'save-slot'; slot: SlotIndex }
  | { type: 'load-slot'; slot: SlotIndex }
  | { type: 'reset' };

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add': {
      if (state.current.placed.some(p => p.playerId === action.playerId)) return state;
      const next: Placed = { playerId: action.playerId, x: action.x, y: action.y };
      return { ...state, current: { placed: [...state.current.placed, next] } };
    }
    case 'move': {
      const placed = state.current.placed.map(p =>
        p.playerId === action.playerId ? { ...p, x: action.x, y: action.y } : p
      );
      return { ...state, current: { placed } };
    }
    case 'remove': {
      const placed = state.current.placed.filter(p => p.playerId !== action.playerId);
      return { ...state, current: { placed } };
    }
    case 'save-slot': {
      const slots = [...state.slots] as [Lineup | null, Lineup | null, Lineup | null];
      slots[action.slot] = { placed: [...state.current.placed] };
      return { ...state, slots };
    }
    case 'load-slot': {
      const slot = state.slots[action.slot];
      if (!slot) return state;
      return { ...state, current: { placed: [...slot.placed] } };
    }
    case 'reset':
      return EMPTY_STATE;
  }
}

export function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!v.current || typeof v.current !== 'object') return false;
  const cur = v.current as { placed?: unknown };
  if (!Array.isArray(cur.placed)) return false;
  if (!Array.isArray(v.slots) || v.slots.length !== 3) return false;
  for (const s of v.slots) {
    if (s === null) continue;
    if (!s || typeof s !== 'object') return false;
    if (!Array.isArray((s as { placed?: unknown }).placed)) return false;
  }
  return true;
}

export function loadFromStorage(storage: Storage = localStorage): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function saveToStorage(state: AppState, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or disabled; in-memory only */
  }
}

export class Store {
  private state: AppState;
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly storage: Storage | null;

  constructor(initial: AppState, storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null) {
    this.state = initial;
    this.storage = storage;
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    const next = reduce(this.state, action);
    if (next === this.state) return;
    this.state = next;
    this.listeners.forEach(l => l(next));
    this.scheduleSave();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private scheduleSave(): void {
    if (!this.storage) return;
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    const storage = this.storage;
    this.saveTimer = setTimeout(() => {
      saveToStorage(this.state, storage);
      this.saveTimer = null;
    }, DEBOUNCE_MS);
  }

  flush(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.storage) saveToStorage(this.state, this.storage);
  }
}
