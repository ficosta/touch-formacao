import { describe, it, expect } from 'vitest';
import { parseSquad, groupByPosition } from '../src/squad';

describe('parseSquad', () => {
  it('parses valid squad', () => {
    const out = parseSquad([
      { id: 'a', name: 'Alice', position: 'GK', photo: './a.jpg' },
      { id: 'b', name: 'Bob', position: 'STR' }
    ]);
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ id: 'b', name: 'Bob', position: 'STR', photo: '' });
  });

  it('rejects non-array', () => {
    expect(() => parseSquad({})).toThrow();
  });

  it('rejects duplicate ids', () => {
    expect(() => parseSquad([
      { id: 'a', name: 'A', position: 'GK' },
      { id: 'a', name: 'B', position: 'DEF' }
    ])).toThrow(/duplicate/);
  });

  it('rejects invalid position', () => {
    expect(() => parseSquad([{ id: 'a', name: 'A', position: 'XX' }])).toThrow(/position/);
  });

  it('rejects missing name', () => {
    expect(() => parseSquad([{ id: 'a', position: 'GK' }])).toThrow(/name/);
  });
});

describe('groupByPosition', () => {
  it('groups and sorts by name', () => {
    const out = groupByPosition([
      { id: 'b', name: 'Bob', position: 'DEF', photo: '' },
      { id: 'a', name: 'Alice', position: 'DEF', photo: '' },
      { id: 'c', name: 'Carol', position: 'STR', photo: '' }
    ]);
    expect(out.DEF.map(p => p.name)).toEqual(['Alice', 'Bob']);
    expect(out.STR.map(p => p.name)).toEqual(['Carol']);
    expect(out.GK).toEqual([]);
    expect(out.MID).toEqual([]);
  });
});
