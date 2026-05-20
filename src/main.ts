import { loadSquad } from './squad';
import { Store, loadFromStorage } from './state';
import { Renderer } from './render';
import { initDragDrop } from './dragdrop';
import { initSlots } from './slots';

async function bootstrap(): Promise<void> {
  document.body.style.setProperty('--bg-image', `url("${new URL('./bg.jpg', document.baseURI).href}")`);
  const root = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const field = document.getElementById('field');
  const placedLayer = document.getElementById('placed-layer');
  const trash = document.getElementById('trash');
  const slotsEl = document.getElementById('slots');
  const ghost = document.getElementById('drag-ghost');

  if (!root || !sidebar || !field || !placedLayer || !trash || !slotsEl || !ghost) {
    throw new Error('Missing required DOM nodes');
  }

  let players;
  try {
    players = await loadSquad();
  } catch (err) {
    root.innerHTML = `<div class="error">Falha ao carregar squad.json: ${(err as Error).message}</div>`;
    return;
  }

  const store = new Store(loadFromStorage());
  const renderer = new Renderer({ sidebar, placedLayer, slots: slotsEl }, players, store);
  renderer.start();

  initDragDrop({ root, field, sidebar, trash, ghost, store, renderer });
  initSlots({ container: slotsEl, store });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

void bootstrap();
