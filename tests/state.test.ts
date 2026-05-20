import { describe, it, expect } from 'vitest';
import { Store, reduce, isValidState, loadFromStorage, saveToStorage } from '../src/state';
import { EMPTY_STATE, AppState } from '../src/types';

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear()
  } as Storage;
}

describe('reduce', () => {
  it('add creates a placed entry', () => {
    const next = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 50, y: 50 });
    expect(next.current.placed).toEqual([{ playerId: 'p1', x: 50, y: 50 }]);
  });

  it('add is idempotent for same playerId', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 10, y: 10 });
    s = reduce(s, { type: 'add', playerId: 'p1', x: 90, y: 90 });
    expect(s.current.placed).toHaveLength(1);
    expect(s.current.placed[0]).toEqual({ playerId: 'p1', x: 10, y: 10 });
  });

  it('move updates x/y of an existing placed', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 10, y: 10 });
    s = reduce(s, { type: 'move', playerId: 'p1', x: 70, y: 30 });
    expect(s.current.placed[0]).toEqual({ playerId: 'p1', x: 70, y: 30 });
  });

  it('remove drops the placed entry', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 10, y: 10 });
    s = reduce(s, { type: 'add', playerId: 'p2', x: 20, y: 20 });
    s = reduce(s, { type: 'remove', playerId: 'p1' });
    expect(s.current.placed.map(p => p.playerId)).toEqual(['p2']);
  });

  it('save-slot snapshots current', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 50, y: 50 });
    s = reduce(s, { type: 'save-slot', slot: 1 });
    expect(s.slots[1]).toEqual({ placed: [{ playerId: 'p1', x: 50, y: 50 }] });
  });

  it('load-slot replaces current', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 50, y: 50 });
    s = reduce(s, { type: 'save-slot', slot: 0 });
    s = reduce(s, { type: 'remove', playerId: 'p1' });
    expect(s.current.placed).toHaveLength(0);
    s = reduce(s, { type: 'load-slot', slot: 0 });
    expect(s.current.placed).toEqual([{ playerId: 'p1', x: 50, y: 50 }]);
  });

  it('load-slot on empty slot is a noop', () => {
    const s = reduce(EMPTY_STATE, { type: 'load-slot', slot: 2 });
    expect(s).toBe(EMPTY_STATE);
  });

  it('reset returns empty state', () => {
    let s = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 10, y: 10 });
    s = reduce(s, { type: 'reset' });
    expect(s).toEqual(EMPTY_STATE);
  });

  it('is immutable (does not mutate input)', () => {
    const before = JSON.parse(JSON.stringify(EMPTY_STATE));
    reduce(EMPTY_STATE, { type: 'add', playerId: 'x', x: 1, y: 1 });
    expect(EMPTY_STATE).toEqual(before);
  });
});

describe('isValidState', () => {
  it('accepts empty state', () => expect(isValidState(EMPTY_STATE)).toBe(true));
  it('rejects null/undefined/primitives', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState('x')).toBe(false);
    expect(isValidState(42)).toBe(false);
  });
  it('rejects bad slot length', () => {
    expect(isValidState({ current: { placed: [] }, slots: [null, null] })).toBe(false);
  });
  it('rejects slot with no placed array', () => {
    expect(isValidState({ current: { placed: [] }, slots: [{}, null, null] })).toBe(false);
  });
});

describe('storage round-trip', () => {
  it('save then load returns equivalent state', () => {
    const storage = makeStorage();
    const state: AppState = reduce(EMPTY_STATE, { type: 'add', playerId: 'p1', x: 33, y: 44 });
    saveToStorage(state, storage);
    expect(loadFromStorage(storage)).toEqual(state);
  });

  it('load returns empty when storage is empty', () => {
    expect(loadFromStorage(makeStorage())).toEqual(EMPTY_STATE);
  });

  it('load returns empty when storage has invalid JSON', () => {
    const storage = makeStorage();
    storage.setItem('touch-formacao:state', '{not json');
    expect(loadFromStorage(storage)).toEqual(EMPTY_STATE);
  });

  it('load returns empty when stored value has wrong shape', () => {
    const storage = makeStorage();
    storage.setItem('touch-formacao:state', JSON.stringify({ foo: 1 }));
    expect(loadFromStorage(storage)).toEqual(EMPTY_STATE);
  });
});

describe('Store', () => {
  it('notifies subscribers on dispatch', () => {
    const store = new Store(EMPTY_STATE, null);
    let calls = 0;
    store.subscribe(() => calls++);
    store.dispatch({ type: 'add', playerId: 'p1', x: 1, y: 1 });
    expect(calls).toBe(1);
  });

  it('skips notification when reduce returns same state', () => {
    const store = new Store(EMPTY_STATE, null);
    let calls = 0;
    store.subscribe(() => calls++);
    store.dispatch({ type: 'load-slot', slot: 0 });
    expect(calls).toBe(0);
  });

  it('flush persists current state immediately', () => {
    const storage = makeStorage();
    const store = new Store(EMPTY_STATE, storage);
    store.dispatch({ type: 'add', playerId: 'p1', x: 9, y: 9 });
    store.flush();
    expect(loadFromStorage(storage).current.placed).toHaveLength(1);
  });
});
