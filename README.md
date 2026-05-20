# Touch Formação

PWA touchscreen para iPad — montagem de escalações de futebol estilo broadcast BILD "Aufstellung".

## Funcionalidades

- **Sidebar do elenco** agrupada por posição (GK / DEF / MID / STR), carregada de `public/squad.json`
- **Posicionamento livre**: arraste jogadores da sidebar para qualquer ponto do campo
- **Reposicionamento**: arraste cards já no campo para mover
- **Remoção via lixeira**: arraste para a zona "🗑" — jogador volta à sidebar
- **3 slots de save**:
  - **Click curto** = carrega o slot
  - **Hold ≥600ms** = salva a escalação atual no slot
- **Auto-persistência** da escalação atual em `localStorage`
- **PWA**: instale "Adicionar à tela inicial" no iPad → roda fullscreen landscape

## Stack

TypeScript estrito · Vite · sem framework · Vitest · Pointer Events para touch+mouse

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173 (use o IP da rede no iPad)
npm run build        # produção em dist/
npm run preview      # servir dist
npm test             # unit tests
npm run typecheck
```

## Configurar o elenco

Edite `public/squad.json`:

```json
[
  { "id": "p1", "name": "Manuel Neuer", "position": "GK", "photo": "./photos/p1.jpg" }
]
```

Coloque as fotos em `public/photos/`. Se uma foto faltar, o card mostra as iniciais.

`position` ∈ `"GK" | "DEF" | "MID" | "STR"`.

## Estrutura

```
src/
  main.ts        bootstrap + service worker
  state.ts       store imutável + localStorage + debounce
  squad.ts       fetch/validar squad.json
  render.ts      DOM da sidebar, campo, cards, slots
  dragdrop.ts    Pointer Events: add / move / remove
  slots.ts      timer hold (600ms) vs click
  types.ts       tipos compartilhados
  style.css      tema broadcast BILD
public/
  bg.jpg, field.png   assets do design
  squad.json          elenco
  photos/             fotos dos jogadores
  sw.js               service worker (cache app shell)
```

## Verificação

1. `npm run dev` — acesse pelo Safari do iPad em landscape
2. Arraste jogadores para o campo, reposicione, remova via lixeira
3. Hold no Slot 1 (anel vermelho preenche) → salva; click no Slot 1 → restaura
4. Reload da página — escalação atual preservada
5. Compartilhar → "Adicionar à Tela de Início" → abre fullscreen landscape
