export type Position = 'GK' | 'DEF' | 'MID' | 'STR';

export const POSITION_ORDER: readonly Position[] = ['GK', 'DEF', 'MID', 'STR'];

export const POSITION_LABEL: Record<Position, string> = {
  GK: 'GOALKEEPER',
  DEF: 'DEFENDERS',
  MID: 'MIDFIELDERS',
  STR: 'STRIKERS'
};

export type Player = {
  id: string;
  name: string;
  position: Position;
  photo: string;
};

export type Placed = {
  playerId: string;
  x: number;
  y: number;
};

export type Lineup = {
  placed: readonly Placed[];
};

export type SlotIndex = 0 | 1 | 2;

export type AppState = {
  current: Lineup;
  slots: readonly [Lineup | null, Lineup | null, Lineup | null];
};

export const EMPTY_LINEUP: Lineup = { placed: [] };

export const EMPTY_STATE: AppState = {
  current: EMPTY_LINEUP,
  slots: [null, null, null]
};
