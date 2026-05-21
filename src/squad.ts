import { Player, Position } from './types';
import { POSITION_ORDER } from './constants';

function isPosition(v: unknown): v is Position {
  return typeof v === 'string' && (POSITION_ORDER as readonly string[]).includes(v);
}

export function parseSquad(raw: unknown): Player[] {
  if (!Array.isArray(raw)) throw new Error('squad.json must be an array');
  const seen = new Set<string>();
  return raw.map((entry, idx) => {
    if (!entry || typeof entry !== 'object') throw new Error(`squad[${idx}] is not an object`);
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id) throw new Error(`squad[${idx}].id missing`);
    if (seen.has(e.id)) throw new Error(`duplicate id ${e.id}`);
    seen.add(e.id);
    if (typeof e.name !== 'string' || !e.name) throw new Error(`squad[${idx}].name missing`);
    if (!isPosition(e.position)) throw new Error(`squad[${idx}].position invalid`);
    const photo = typeof e.photo === 'string' ? e.photo : '';
    return { id: e.id, name: e.name, position: e.position, photo };
  });
}

export async function loadSquad(url = './squad.json'): Promise<Player[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load squad (${res.status})`);
  return parseSquad(await res.json());
}
