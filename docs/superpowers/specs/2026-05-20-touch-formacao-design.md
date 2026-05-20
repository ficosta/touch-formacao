# Touch Formação — Design Spec

## Contexto

PWA touchscreen para iPad, estilo broadcast BILD "Aufstellung", híbrido entre exibição visual e ferramenta de analista. Permite montar escalações arrastando jogadores de uma sidebar (elenco pré-cadastrado, agrupado por posição) para um campo em perspectiva 3D. Sem formações fixas — posicionamento livre. Remoção via drag para zona "lixeira". Persistência automática + 3 slots manuais (hold=save, click=load).

Assets fornecidos: `bg.jpg` (fundo verde escuro com cantos angulares), `field.png` (campo em perspectiva), `ref.jpg` (referência visual BILD/Deutschland).

## Stack

- **TypeScript estrito** + **Vite** (build estático)
- **PWA**: `manifest.webmanifest` (landscape + fullscreen) + service worker (cache app shell)
- **Sem framework** — DOM direto, Pointer Events para touch+mouse
- **Testes**: Vitest (unit) + Playwright (e2e touch)
- **Deploy**: arquivos estáticos (qualquer host) + "Adicionar à tela inicial" no iPad

## Layout (landscape)

```
┌──────────────────────────────────────────────────────┐
│ [bg.jpg full bleed]                                  │
│ ┌──────────┐  ┌─────────────────┐  ┌──────────────┐ │
│ │ TÍTULO   │  │                 │  │ GOALKEEPER   │ │
│ │ + escudo │  │  field.png      │  │ - Player A   │ │
│ │          │  │  cards (drag)   │  │ DEFENDERS    │ │
│ │ [🗑 LIXO]│  │                 │  │ - Player B…  │ │
│ │ [slot 1] │  │                 │  │ MIDFIELDERS  │ │
│ │ [slot 2] │  │                 │  │ - …          │ │
│ │ [slot 3] │  │                 │  │ STRIKERS     │ │
│ └──────────┘  └─────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────┘
```

Coordenadas de cards no campo armazenadas em **% relativas ao container do field** (escala em qualquer resolução).

## Estrutura de arquivos

```
touch-formacao/
├── index.html
├── manifest.webmanifest
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.ts          # bootstrap, registra SW
│   ├── sw.ts            # service worker (cache app shell)
│   ├── state.ts         # estado + localStorage (current + 3 slots)
│   ├── squad.ts         # fetch/validate squad.json
│   ├── render.ts        # render field, sidebar, cards, slots
│   ├── dragdrop.ts      # Pointer Events: add/move/remove
│   ├── slots.ts         # hold=save, click=load
│   └── types.ts
├── public/
│   ├── bg.jpg
│   ├── field.png
│   ├── squad.json
│   └── photos/<id>.jpg
└── tests/
    ├── state.test.ts
    ├── slots.test.ts
    └── e2e/lineup.spec.ts
```

## Modelos

```ts
type Position = 'GK' | 'DEF' | 'MID' | 'STR';
type Player   = { id: string; name: string; position: Position; photo: string };
type Placed   = { playerId: string; x: number; y: number }; // % do field container
type Lineup   = { placed: Placed[] };
type AppState = {
  current: Lineup;
  slots: [Lineup | null, Lineup | null, Lineup | null];
};
```

## Fluxo de dados

1. `main.ts`: carrega `squad.json` + `AppState` do localStorage (ou inicial vazio) → instancia `render`.
2. `dragdrop.ts` emite ações `{type: 'add'|'move'|'remove', playerId, x?, y?}`.
3. `state.ts` aplica ação imutavelmente → notifica `render` (subscribe).
4. `state.ts` debounce 200ms grava `current` em `localStorage['touch-formacao:state']`.
5. `slots.ts`: pointerdown inicia timer 600ms; se up antes → `loadSlot(i)`; se atingir → feedback visual + `saveSlot(i, current)`.

## Interações

| Origem | Destino | Ação |
|---|---|---|
| Sidebar | Field | `add` — cria `Placed{x%, y%}`, some da sidebar |
| Field | Field | `move` — atualiza `x,y` |
| Field | Lixeira | `remove` — apaga do `placed`, reaparece na sidebar |

- "Ghost" do card segue o dedo durante drag (clone com `pointer-events: none`).
- Lixeira destaca-se (borda vermelha pulsante) quando card está sobre ela.
- Sidebar nunca mostra jogador já em campo (filter por `placed.playerId`).

## Slots

- 3 slots fixos representando snapshots completos de `Lineup`.
- **Click curto (<600ms)**: `current = slots[i]` (com confirm se current tiver jogadores).
- **Hold ≥600ms**: `slots[i] = current` (anel de progresso animado preenche em 600ms).
- Slots renderizam mini-preview (contagem de jogadores por posição).

## Persistência

- `localStorage['touch-formacao:state']` = JSON serializado de `AppState`.
- Salva via debounce 200ms a cada mudança.
- Boot lê e valida estrutura; se inválida, descarta e inicia limpo.

## Tratamento de erros

- `squad.json` inválido → mostra overlay de erro com retry.
- localStorage cheio/bloqueado → app funciona em memória, alerta discreto.
- Photo 404 → fallback para placeholder com iniciais do nome.

## Testes (cobertura ≥80%)

**Unit (Vitest)**:
- `state.ts`: add/move/remove são imutáveis, slots save/load, serialização localStorage
- `slots.ts`: timer 600ms, diferenciar click vs hold
- `squad.ts`: validação de schema

**E2E (Playwright touch emulation)**:
- Drag sidebar → field (card aparece na posição)
- Drag field → lixeira (jogador volta à sidebar)
- Hold em slot salva; click em slot carrega
- Reload preserva escalação atual

## Verificação

1. `npm run dev` → abre no Safari iPad (ou Chrome DevTools em modo iPad landscape)
2. Arrastar jogadores da sidebar para o campo — devem ficar onde soltou
3. Arrastar para lixeira — voltam à sidebar
4. Hold em slot 1 → confirma salvo (preview atualiza); modifica lineup; click em slot 1 → restaura
5. Reload da página → escalação atual preservada
6. "Adicionar à tela inicial" no iPad → app abre fullscreen landscape
7. `npm test` → todos os unit/e2e verdes, cobertura ≥80%
