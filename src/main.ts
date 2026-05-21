import { loadSquad } from './squad';
import { Store, loadFromStorage } from './state';
import { mountViews } from './views/mount';
import { initDragDrop } from './interactions/dragdrop';
import { initSlots } from './interactions/slots';
import { initHoldButton } from './interactions/hold-button';
import { Player } from './types';

async function bootstrap(): Promise<void> {
  document.body.style.setProperty(
    '--bg-image',
    `url("${new URL('./bg.jpg', document.baseURI).href}")`
  );

  const refs = getRefs();
  if (!refs) throw new Error('Missing required DOM nodes');

  let players: Player[];
  try {
    players = await loadSquad();
  } catch (err) {
    refs.root.innerHTML = `<div class="error">Falha ao carregar squad.json: ${(err as Error).message}</div>`;
    return;
  }

  const store = new Store(loadFromStorage());

  mountViews(
    { sidebar: refs.sidebar, field: refs.placedLayer, slots: refs.slots },
    players,
    store
  );

  initDragDrop({ root: refs.root, field: refs.field, trash: refs.trash, ghost: refs.ghost, store });
  initSlots({ container: refs.slots, store });

  initHoldButton(refs.clean, 600, () => {
    if (store.getState().current.placed.length > 0) store.dispatch({ type: 'clear-current' });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

type Refs = {
  root: HTMLElement;
  sidebar: HTMLElement;
  field: HTMLElement;
  placedLayer: HTMLElement;
  trash: HTMLElement;
  slots: HTMLElement;
  ghost: HTMLElement;
  clean: HTMLElement;
};

function getRefs(): Refs | null {
  const root = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const field = document.getElementById('field');
  const placedLayer = document.getElementById('placed-layer');
  const trash = document.getElementById('trash');
  const slots = document.getElementById('slots');
  const ghost = document.getElementById('drag-ghost');
  const clean = document.getElementById('clean');
  if (!root || !sidebar || !field || !placedLayer || !trash || !slots || !ghost || !clean) return null;
  return { root, sidebar, field, placedLayer, trash, slots, ghost, clean };
}

void bootstrap();
