export type Position = 'GK' | 'DEF' | 'MID' | 'STR';

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
