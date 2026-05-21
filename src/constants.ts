import { AppState, Lineup, Position } from './types';

export const POSITION_ORDER: readonly Position[] = ['GK', 'DEF', 'MID', 'STR'];

export const POSITION_LABEL: Record<Position, string> = {
  GK: 'TORHÜTER',
  DEF: 'VERTEIDIGER',
  MID: 'MITTELFELD',
  STR: 'ANGRIFF'
};

export const EMPTY_LINEUP: Lineup = { placed: [] };

export const EMPTY_STATE: AppState = {
  current: EMPTY_LINEUP,
  slots: [null, null, null]
};

export const STORAGE_KEY = 'touch-formacao:state';
