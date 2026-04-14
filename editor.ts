/**
 * Generates editor.html — a live Mermaid editor similar to mermaid.live.
 *
 * Usage: bun run editor.ts
 *
 * The generated HTML is fully self-contained:
 *   - Bundles the mermaid renderer client-side
 *   - Live rendering on every keystroke (debounced)
 *   - URL hash sharing (base64-encoded source)
 *   - Theme switcher with all built-in themes
 *   - Sample presets by diagram category
 *   - Download SVG / Copy link
 */

import { THEMES } from './src/theme.ts'

const THEME_LABELS: Record<string, string> = {
  'zinc-dark': 'Zinc Dark',
  'tokyo-night': 'Tokyo Night',
  'tokyo-night-storm': 'Tokyo Storm',
  'tokyo-night-light': 'Tokyo Light',
  'catppuccin-mocha': 'Catppuccin',
  'catppuccin-latte': 'Latte',
  'nord': 'Nord',
  'nord-light': 'Nord Light',
  'dracula': 'Dracula',
  'github-light': 'GitHub',
  'github-dark': 'GitHub Dark',
  'solarized-light': 'Solarized',
  'solarized-dark': 'Solar Dark',
  'one-dark': 'One Dark',
}

const SAMPLES: { category: string; title: string; source: string }[] = [
  {
    category: 'Flowchart',
    title: 'Simple Flow',
    source: `graph TD
  A[Start] --> B{Decision?}
  B -->|Yes| C[Do the thing]
  B -->|No| D[Skip it]
  C --> E[End]
  D --> E`,
  },
  {
    category: 'Flowchart',
    title: 'All Shapes',
    source: `graph LR
  A[Rectangle] --> B(Rounded)
  B --> C{Diamond}
  C --> D([Stadium])
  D --> E((Circle))
  E --> F[[Subroutine]]
  F --> G(((Double Circle)))
  G --> H{{Hexagon}}
  H --> I[(Database)]
  I --> J>Flag]
  J --> K[/Trapezoid\\]
  K --> L[\\Inverse Trap/]`,
  },
  {
    category: 'Flowchart',
    title: 'Subgraphs',
    source: `graph TB
  subgraph Frontend
    A[React App] --> B[API Client]
  end
  subgraph Backend
    C[API Server] --> D[(Database)]
    C --> E[Cache]
  end
  B --> C`,
  },
  {
    category: 'State',
    title: 'Simple State',
    source: `stateDiagram-v2
  [*] --> Idle
  Idle --> Loading: fetch()
  Loading --> Success: 200 OK
  Loading --> Error: 4xx/5xx
  Success --> Idle: reset
  Error --> Idle: retry
  Success --> [*]`,
  },
  {
    category: 'State',
    title: 'Nested States',
    source: `stateDiagram-v2
  [*] --> Active
  state Active {
    [*] --> Editing
    Editing --> Saving: save
    Saving --> Editing: done
  }
  Active --> Inactive: logout
  Inactive --> Active: login`,
  },
  {
    category: 'Sequence',
    title: 'API Call',
    source: `sequenceDiagram
  participant C as Client
  participant A as API
  participant D as Database

  C->>A: GET /users
  A->>D: SELECT * FROM users
  D-->>A: rows[]
  A-->>C: 200 OK { users }`,
  },
  {
    category: 'Sequence',
    title: 'Auth Flow',
    source: `sequenceDiagram
  actor U as User
  participant F as Frontend
  participant A as Auth Service
  participant D as DB

  U->>F: Login(email, password)
  F->>A: POST /auth/login
  A->>D: findUser(email)
  D-->>A: user record
  A->>A: verifyPassword()
  A-->>F: JWT token
  F-->>U: Logged in ✓`,
  },
  {
    category: 'Class',
    title: 'Basic Classes',
    source: `classDiagram
  class Animal {
    +String name
    +int age
    +makeSound() void
  }
  class Dog {
    +String breed
    +fetch() void
  }
  class Cat {
    +bool indoor
    +purr() void
  }
  Animal <|-- Dog
  Animal <|-- Cat`,
  },
  {
    category: 'Class',
    title: 'Repository Pattern',
    source: `classDiagram
  class IRepository~T~ {
    <<interface>>
    +findById(id) T
    +findAll() List~T~
    +save(entity T) T
    +delete(id) void
  }
  class UserRepository {
    -db Database
    +findById(id) User
    +findAll() List~User~
    +findByEmail(email) User
    +save(user User) User
    +delete(id) void
  }
  IRepository <|.. UserRepository`,
  },
  {
    category: 'ER',
    title: 'Blog Schema',
    source: `erDiagram
  USER {
    int id PK
    string email UK
    string name
    datetime created_at
  }
  POST {
    int id PK
    string title
    text content
    int author_id FK
    datetime published_at
  }
  COMMENT {
    int id PK
    text body
    int post_id FK
    int user_id FK
  }
  USER ||--o{ POST : writes
  POST ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes`,
  },
  {
    category: 'ER',
    title: 'E-Commerce',
    source: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_ITEM : contains
  PRODUCT ||--o{ ORDER_ITEM : "included in"
  CUSTOMER {
    int id PK
    string name
    string email UK
  }
  ORDER {
    int id PK
    int customer_id FK
    datetime placed_at
    string status
  }
  ORDER_ITEM {
    int order_id FK
    int product_id FK
    int quantity
    decimal price
  }
  PRODUCT {
    int id PK
    string name
    decimal price
    int stock
  }`,
  },
  {
    category: 'XY Chart',
    title: 'Monthly Revenue',
    source: `xychart-beta
  title "Monthly Revenue"
  x-axis [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
  y-axis "Revenue ($K)" 0 --> 120
  bar [45, 52, 61, 58, 74, 88, 95, 102, 91, 85, 78, 110]
  line [45, 52, 61, 58, 74, 88, 95, 102, 91, 85, 78, 110]`,
  },
  {
    category: 'XY Chart',
    title: 'Multi-Series',
    source: `xychart-beta
  title "Sales vs Target"
  x-axis [Q1, Q2, Q3, Q4]
  y-axis "Amount" 0 --> 200
  bar [120, 145, 135, 175]
  line [130, 140, 150, 160]`,
  },
]

async function generateEditorHtml(): Promise<string> {
  // Bundle the renderer for the browser
  const buildResult = await Bun.build({
    entrypoints: [new URL('./src/browser.ts', import.meta.url).pathname],
    target: 'browser',
    format: 'esm',
    minify: true,
  })
  if (!buildResult.success) {
    console.error('Bundle failed:', buildResult.logs)
    process.exit(1)
  }
  const bundleJs = await buildResult.outputs[0]!.text()
  console.log(`Browser bundle: ${(bundleJs.length / 1024).toFixed(1)} KB`)

  const samplesJson = JSON.stringify(SAMPLES)

  // Build theme options HTML
  const themeOptions = [
    `<option value="">Default</option>`,
    ...Object.keys(THEMES).map(
      key => `<option value="${key}">${THEME_LABELS[key] ?? key}</option>`
    ),
  ].join('\n    ')

  // Build sample category buttons
  const categories = [...new Set(SAMPLES.map(s => s.category))]
  const categoryButtons = categories
    .map(cat => `<button class="cat-btn" data-cat="${cat}">${cat}</button>`)
    .join('\n      ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Beautiful Mermaid — Live Editor</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --bg2: #161b22;
      --bg3: #1c2128;
      --border: rgba(255,255,255,0.08);
      --fg: #e6edf3;
      --fg2: #8b949e;
      --fg3: #484f58;
      --accent: #ff4d4d;
      --accent2: #ff7070;
      --blue: #58a6ff;
      --green: #3fb950;
      --red: #f85149;
      --radius: 6px;
    }

    :root.light {
      --bg: #f5f5f7;
      --bg2: #ffffff;
      --bg3: #ebebed;
      --border: rgba(0,0,0,0.09);
      --fg: #1a1a1a;
      --fg2: #6b7280;
      --fg3: #9ca3af;
      --blue: #2563eb;
      --green: #16a34a;
      --red: #dc2626;
    }

    html, body { height: 100%; overflow: hidden; }

    body {
      font-family: 'Geist', system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    /* ── Top bar ── */
    .topbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 48px;
      padding: 0 1rem;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--fg);
      text-decoration: none;
      margin-right: 0.5rem;
    }
    .logo svg { width: 20px; height: 20px; flex-shrink: 0; }
    .logo-sub { color: var(--fg2); font-weight: 400; font-size: 0.8rem; }

    .topbar-sep { width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem; }

    .tab-group { display: flex; gap: 0.125rem; }
    .tab {
      height: 30px;
      padding: 0 0.75rem;
      border: none;
      border-radius: var(--radius);
      background: transparent;
      color: var(--fg2);
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .tab:hover { color: var(--fg); background: rgba(255,255,255,0.05); }
    .tab.active { color: var(--fg); background: rgba(255,255,255,0.08); }

    .spacer { flex: 1; }

    .theme-select-wrap { display: flex; align-items: center; gap: 0.5rem; }
    .theme-select-label { font-size: 0.75rem; color: var(--fg2); }
    .theme-select {
      height: 30px;
      padding: 0 0.5rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--fg);
      font-size: 0.75rem;
      font-family: inherit;
      cursor: pointer;
      outline: none;
    }
    .theme-select:focus { border-color: var(--blue); }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      height: 30px;
      padding: 0 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg3);
      color: var(--fg);
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, opacity 0.15s;
      text-decoration: none;
      white-space: nowrap;
    }
    .btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
    .btn:active { opacity: 0.8; }
    .btn svg { width: 14px; height: 14px; flex-shrink: 0; }

    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: var(--accent2); border-color: var(--accent2); }

    /* ── Main layout ── */
    .main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Left panel ── */
    .panel-left {
      display: flex;
      flex-direction: column;
      width: 42%;
      min-width: 280px;
      border-right: 1px solid var(--border);
      background: var(--bg2);
      flex-shrink: 0;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: 36px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .panel-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--fg2);
    }
    .panel-actions { display: flex; gap: 0.25rem; }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--fg2);
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .icon-btn:hover { color: var(--fg); background: rgba(255,255,255,0.07); }
    .icon-btn svg { width: 14px; height: 14px; }

    /* ── Code editor ── */
    .editor-wrap {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
    }

    .line-numbers {
      padding: 1rem 0.5rem 1rem 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.6;
      color: var(--fg3);
      text-align: right;
      user-select: none;
      pointer-events: none;
      background: var(--bg2);
      min-width: 40px;
      overflow: hidden;
      white-space: pre;
    }

    .code-editor {
      flex: 1;
      padding: 1rem 1rem 1rem 0.5rem;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      color: var(--fg);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.6;
      tab-size: 2;
      overflow: auto;
      white-space: pre;
    }
    .code-editor::placeholder { color: var(--fg3); }

    /* ── Status bar ── */
    .status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: 24px;
      border-top: 1px solid var(--border);
      font-size: 0.7rem;
      color: var(--fg3);
      flex-shrink: 0;
    }
    .status-ok { color: var(--green); }
    .status-err { color: var(--red); }

    /* ── Samples drawer ── */
    .samples-drawer {
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .samples-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: 36px;
      cursor: pointer;
      user-select: none;
    }
    .samples-header:hover { background: rgba(255,255,255,0.03); }
    .samples-toggle-icon { transition: transform 0.2s; color: var(--fg2); }
    .samples-toggle-icon.open { transform: rotate(180deg); }

    .samples-body {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.25s ease;
    }
    .samples-body.open { max-height: 280px; }

    .samples-inner { padding: 0.5rem 0.75rem 0.75rem; }

    .cat-tabs {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .cat-btn {
      height: 24px;
      padding: 0 0.625rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg3);
      color: var(--fg2);
      font-size: 0.7rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cat-btn:hover { color: var(--fg); border-color: rgba(255,255,255,0.15); }
    .cat-btn.active { color: var(--fg); background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

    .sample-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-height: 180px;
      overflow-y: auto;
    }
    .sample-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      color: var(--fg2);
      font-size: 0.8rem;
      transition: background 0.15s, color 0.15s;
    }
    .sample-item:hover { background: rgba(255,255,255,0.06); color: var(--fg); }
    .sample-item-arrow { color: var(--fg3); font-size: 0.7rem; }

    /* ── Right panel (preview) ── */
    .panel-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      min-width: 0;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: 36px;
      border-bottom: 1px solid var(--border);
      background: var(--bg2);
      flex-shrink: 0;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .zoom-label {
      font-size: 0.7rem;
      color: var(--fg2);
      min-width: 40px;
      text-align: center;
    }

    .preview-body {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 2rem;
      position: relative;
    }

    .preview-inner {
      /* min-size ensures the inner div always takes at least the full viewport
         so small diagrams stay centred; large/zoomed ones scroll freely */
      min-width: 100%;
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-inner svg {
      display: block;
      flex-shrink: 0; /* never squash below its explicit w/h */
    }

    .preview-error {
      color: var(--red);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      padding: 1.5rem;
      background: rgba(248, 81, 73, 0.08);
      border: 1px solid rgba(248, 81, 73, 0.2);
      border-radius: var(--radius);
      white-space: pre-wrap;
      max-width: 600px;
    }

    .preview-placeholder {
      color: var(--fg3);
      font-size: 0.9rem;
      text-align: center;
    }

    .preview-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: 28px;
      border-top: 1px solid var(--border);
      background: var(--bg2);
      font-size: 0.7rem;
      color: var(--fg3);
      flex-shrink: 0;
    }

    /* ── Resize handle ── */
    .resize-handle {
      width: 4px;
      background: transparent;
      cursor: col-resize;
      flex-shrink: 0;
      transition: background 0.15s;
      position: relative;
      z-index: 10;
      margin-left: -4px;
    }
    .resize-handle:hover, .resize-handle.dragging {
      background: var(--blue);
    }

    /* ── Config panel ── */
    .config-panel {
      display: none;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      flex: 1;
    }
    .config-panel.visible { display: flex; }

    .config-section {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .config-section-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--fg3);
      margin-bottom: 0.625rem;
    }

    /* Color field row */
    .color-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.3rem 0;
    }
    .color-field-label {
      font-size: 0.8rem;
      color: var(--fg);
      flex: 1;
    }
    .color-edit-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      height: 28px;
      padding: 0 0.5rem 0 0.35rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg2);
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      min-width: 100px;
      justify-content: flex-end;
    }
    .color-edit-btn:hover { border-color: rgba(255,255,255,0.2); }
    :root.light .color-edit-btn:hover { border-color: rgba(0,0,0,0.2); }
    .color-swatch {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.15);
      flex-shrink: 0;
      background: transparent;
    }

    /* Color picker popup */
    .color-popup {
      display: none;
      position: fixed;
      z-index: 3000;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.75rem;
      width: 240px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
      flex-direction: column;
      gap: 0.6rem;
    }
    .color-popup.open { display: flex; }

    .color-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.1rem;
    }
    .color-popup-title { font-size: 0.78rem; font-weight: 600; color: var(--fg); }
    .color-popup-close {
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: 4px;
      background: transparent; color: var(--fg2);
      cursor: pointer; font-size: 1rem; line-height: 1;
    }
    .color-popup-close:hover { background: var(--bg3); color: var(--fg); }

    .color-hex-row {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .color-native {
      width: 32px; height: 32px;
      border-radius: 6px;
      border: 1px solid var(--border);
      padding: 2px;
      background: var(--bg3);
      cursor: pointer;
      flex-shrink: 0;
    }
    .color-hex-input {
      flex: 1;
      height: 32px;
      padding: 0 0.5rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg);
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      outline: none;
    }
    .color-hex-input:focus { border-color: var(--blue); }

    .color-clear-btn {
      height: 26px;
      padding: 0 0.6rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--fg2);
      font-size: 0.72rem;
      font-family: inherit;
      cursor: pointer;
    }
    .color-clear-btn:hover { color: var(--fg); }

    .color-palette-title {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--fg3);
    }
    .color-palette {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
    }
    .color-swatch-btn {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.12);
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .color-swatch-btn:hover {
      transform: scale(1.15);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 1;
      position: relative;
    }

    /* Font picker */
    .font-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.3rem 0;
    }
    .font-field-label { font-size: 0.8rem; color: var(--fg); flex: 1; }
    .font-select-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      height: 28px;
      padding: 0 0.5rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg);
      font-size: 0.75rem;
      cursor: pointer;
      min-width: 120px;
      justify-content: space-between;
      transition: border-color 0.15s;
    }
    .font-select-btn:hover { border-color: rgba(255,255,255,0.2); }
    :root.light .font-select-btn:hover { border-color: rgba(0,0,0,0.2); }
    .font-select-caret { color: var(--fg3); font-size: 0.6rem; }

    .font-popup {
      display: none;
      position: fixed;
      z-index: 3000;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.5rem;
      width: 220px;
      max-height: 320px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      flex-direction: column;
      gap: 0.25rem;
    }
    .font-popup.open { display: flex; }
    .font-search {
      height: 32px;
      padding: 0 0.5rem 0 2rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 7px;
      color: var(--fg);
      font-size: 0.8rem;
      font-family: inherit;
      outline: none;
      width: 100%;
      flex-shrink: 0;
    }
    .font-search:focus { border-color: var(--blue); }
    .font-search-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .font-search-icon {
      position: absolute;
      left: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--fg3);
      pointer-events: none;
    }
    .font-list {
      overflow-y: auto;
      flex: 1;
    }
    .font-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--fg);
      transition: background 0.12s;
    }
    .font-item:hover { background: var(--bg3); }
    .font-item.active { background: rgba(88,166,255,0.12); color: var(--blue); }
    .font-item-preview { font-size: 1rem; flex-shrink: 0; }
    .font-item-name { flex: 1; }
    .font-section-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--fg3);
      padding: 0.5rem 0.5rem 0.2rem;
    }

    /* Padding field */
    .padding-field { padding: 0.3rem 0; }
    .padding-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .padding-row label { font-size: 0.8rem; color: var(--fg); }
    .padding-num {
      width: 56px;
      height: 28px;
      padding: 0 0.4rem;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg);
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      text-align: right;
      outline: none;
    }
    .padding-num:focus { border-color: var(--blue); }
    .padding-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: var(--bg3);
      outline: none;
      cursor: pointer;
    }
    .padding-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: var(--blue);
      cursor: pointer;
      border: 2px solid var(--bg2);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .padding-slider::-moz-range-thumb {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: var(--blue);
      cursor: pointer;
      border: 2px solid var(--bg2);
    }

    /* ── Export split button ── */
    .export-wrap {
      position: relative;
      display: flex;
      gap: 1px;
    }
    .export-wrap .btn-primary:first-child {
      border-radius: var(--radius) 0 0 var(--radius);
    }
    .export-chevron {
      border-radius: 0 var(--radius) var(--radius) 0 !important;
      padding: 0 0.4rem;
      border-left: 1px solid rgba(255,255,255,0.15) !important;
    }
    .export-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 220px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 5px;
      z-index: 2000;
      flex-direction: column;
      gap: 1px;
    }
    .export-dropdown.open { display: flex; }
    .shadow-dropdown {
      box-shadow: 0 8px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
    }
    .export-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.45rem 0.6rem;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--fg);
      font-size: 0.82rem;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s;
    }
    .export-item:hover { background: rgba(255,255,255,0.07); }
    :root.light .export-item:hover { background: rgba(0,0,0,0.06); }
    .export-item-icon { width: 15px; height: 15px; flex-shrink: 0; color: var(--fg2); }
    .export-item-label { flex: 1; }
    .export-item-kbd {
      display: flex;
      gap: 2px;
      margin-left: auto;
    }
    .export-item-kbd kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 3px;
      border-radius: 4px;
      background: var(--bg3);
      border: 1px solid var(--border);
      font-size: 0.68rem;
      font-family: inherit;
      color: var(--fg2);
    }
    .export-divider {
      height: 1px;
      background: var(--border);
      margin: 3px 0;
    }
    .export-size-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.35rem 0.6rem;
      color: var(--fg);
      font-size: 0.82rem;
    }
    .size-pills {
      display: flex;
      gap: 3px;
      margin-left: auto;
    }
    .size-pill {
      height: 22px;
      padding: 0 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: var(--bg3);
      color: var(--fg2);
      font-size: 0.72rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.12s;
    }
    .size-pill:hover { color: var(--fg); border-color: rgba(255,255,255,0.2); }
    .size-pill.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    /* ── Toast ── */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      color: var(--fg);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
      z-index: 9999;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(-4px);
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--fg3); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--fg2); }

    /* ── Render spinner overlay ── */
    .render-spinner {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--blue);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: none;
    }
    .render-spinner.visible { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

<!-- Top bar -->
<div class="topbar">
  <a href="/beautiful-mermaid/" class="logo">
    <svg viewBox="0 0 299 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M137.879,300L137.875,300C62.3239,300 0.966154,239.232 0.0117188,163.908L0,162.126L137.879,162.126L137.879,300Z" fill="#06367A"/>
      <path d="M137.879,0L137.875,0C61.729,0 0,61.729 0,137.875L0,137.878L137.879,137.878L137.879,0Z" fill="#FF51FF"/>
      <path d="M160.558,137.883L160.561,137.883C236.707,137.883 298.436,76.1537 298.436,0.00758561L298.436,0.00562043L160.558,0.00562043L160.558,137.883Z" fill="#007CFF"/>
      <path d="M160.558,162.123L160.561,162.123C236.112,162.123 297.471,222.891 298.426,298.216L298.436,299.998L160.558,299.998L160.558,162.123Z" fill="#0A377B"/>
    </svg>
    <span>Beautiful Mermaid <span class="logo-sub">Live Editor</span></span>
  </a>

  <div class="topbar-sep"></div>

  <div class="tab-group">
    <button class="tab active" id="tab-code" data-panel="code">Code</button>
    <button class="tab" id="tab-config" data-panel="config">Config</button>
  </div>

  <div class="spacer"></div>

  <button class="btn" id="dark-light-btn" title="Toggle dark/light mode">
    <svg id="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  </button>

  <div class="topbar-sep"></div>

  <div class="theme-select-wrap">
    <label class="theme-select-label" for="theme-select">Theme</label>
    <select class="theme-select" id="theme-select">
      ${themeOptions}
    </select>
  </div>

  <div class="topbar-sep"></div>

  <!-- Export split button -->
  <div class="export-wrap" id="export-wrap">
    <button class="btn btn-primary" id="export-main-btn" title="Save PNG (⌘S)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Export Image
    </button>
    <button class="btn btn-primary export-chevron" id="export-chevron-btn" title="More export options">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <div class="export-dropdown shadow-dropdown" id="export-dropdown">

      <button class="export-item" id="export-png-btn">
        <svg class="export-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="export-item-label">Save PNG</span>
        <span class="export-item-kbd"><kbd>⌘</kbd><kbd>S</kbd></span>
      </button>

      <button class="export-item" id="export-svg-btn">
        <svg class="export-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="export-item-label">Save SVG</span>
        <span class="export-item-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>S</kbd></span>
      </button>

      <div class="export-divider"></div>

      <button class="export-item" id="copy-image-btn">
        <svg class="export-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span class="export-item-label">Copy Image</span>
        <span class="export-item-kbd"><kbd>⌘</kbd><kbd>C</kbd></span>
      </button>

      <button class="export-item" id="copy-link-btn">
        <svg class="export-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span class="export-item-label">Copy URL</span>
        <span class="export-item-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd></span>
      </button>

      <div class="export-divider"></div>

      <div class="export-size-row">
        <svg class="export-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        <span class="export-item-label">Size</span>
        <div class="size-pills" id="size-pills">
          <button class="size-pill" data-scale="1">1x</button>
          <button class="size-pill" data-scale="2">2x</button>
          <button class="size-pill active" data-scale="4">4x</button>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- Main -->
<div class="main">

  <!-- Left panel -->
  <div class="panel-left" id="panel-left">

    <div class="panel-header">
      <span class="panel-title" id="editor-panel-title">Source</span>
      <div class="panel-actions">
        <button class="icon-btn" id="copy-source-btn" title="Copy source">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="icon-btn" id="clear-btn" title="Clear editor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Code editor view -->
    <div class="editor-wrap" id="editor-view">
      <div class="line-numbers" id="line-numbers">1</div>
      <textarea
        class="code-editor"
        id="code-editor"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        placeholder="Enter mermaid diagram syntax here…"
      ></textarea>
    </div>

    <!-- Config view -->
    <div class="config-panel" id="config-view">

      <!-- Colors section -->
      <div class="config-section">
        <div class="config-section-title">Colors</div>
        <div class="color-field">
          <span class="color-field-label">Background</span>
          <button class="color-edit-btn" data-cfg="bg">
            <span class="cfg-hex-label" id="cfg-bg-label">—</span>
            <span class="color-swatch" id="cfg-bg-swatch"></span>
          </button>
        </div>
        <div class="color-field">
          <span class="color-field-label">Foreground</span>
          <button class="color-edit-btn" data-cfg="fg">
            <span class="cfg-hex-label" id="cfg-fg-label">—</span>
            <span class="color-swatch" id="cfg-fg-swatch"></span>
          </button>
        </div>
        <div class="color-field">
          <span class="color-field-label">Accent</span>
          <button class="color-edit-btn" data-cfg="accent">
            <span class="cfg-hex-label" id="cfg-accent-label">—</span>
            <span class="color-swatch" id="cfg-accent-swatch"></span>
          </button>
        </div>
        <div class="color-field">
          <span class="color-field-label">Line</span>
          <button class="color-edit-btn" data-cfg="line">
            <span class="cfg-hex-label" id="cfg-line-label">—</span>
            <span class="color-swatch" id="cfg-line-swatch"></span>
          </button>
        </div>
        <div class="color-field">
          <span class="color-field-label">Muted</span>
          <button class="color-edit-btn" data-cfg="muted">
            <span class="cfg-hex-label" id="cfg-muted-label">—</span>
            <span class="color-swatch" id="cfg-muted-swatch"></span>
          </button>
        </div>
        <div class="color-field">
          <span class="color-field-label">Surface</span>
          <button class="color-edit-btn" data-cfg="surface">
            <span class="cfg-hex-label" id="cfg-surface-label">—</span>
            <span class="color-swatch" id="cfg-surface-swatch"></span>
          </button>
        </div>
      </div>

      <!-- Font section -->
      <div class="config-section">
        <div class="config-section-title">Typography</div>
        <div class="font-field">
          <span class="font-field-label">Font family</span>
          <button class="font-select-btn" id="font-select-btn">
            <span id="font-select-label">Default</span>
            <span class="font-select-caret">▼</span>
          </button>
        </div>
      </div>

      <!-- Layout section -->
      <div class="config-section">
        <div class="config-section-title">Layout</div>
        <div class="padding-field">
          <div class="padding-row">
            <label>Padding</label>
            <input class="padding-num" id="cfg-padding" type="number" min="0" max="120" value="24" />
          </div>
          <input class="padding-slider" id="cfg-padding-slider" type="range" min="0" max="120" value="24" />
        </div>
        <div class="padding-field">
          <div class="padding-row">
            <label>Edge stroke</label>
            <input class="padding-num" id="cfg-edge-stroke" type="number" min="0.25" max="8" step="0.25" value="1" />
          </div>
          <input class="padding-slider" id="cfg-edge-stroke-slider" type="range" min="0.25" max="8" step="0.25" value="1" />
        </div>
        <div class="padding-field">
          <div class="padding-row">
            <label>Node border</label>
            <input class="padding-num" id="cfg-node-stroke" type="number" min="0.25" max="8" step="0.25" value="1" />
          </div>
          <input class="padding-slider" id="cfg-node-stroke-slider" type="range" min="0.25" max="8" step="0.25" value="1" />
        </div>
      </div>

    </div>

    <!-- Color picker popup (shared) -->
    <div class="color-popup" id="color-popup">
      <div class="color-popup-header">
        <span class="color-popup-title" id="color-popup-title">Color</span>
        <button class="color-popup-close" id="color-popup-close">×</button>
      </div>
      <div class="color-hex-row">
        <input type="color" class="color-native" id="color-native-input" />
        <input type="text" class="color-hex-input" id="color-hex-input" placeholder="#rrggbb" maxlength="9" />
        <button class="color-clear-btn" id="color-clear-btn">Clear</button>
      </div>
      <div class="color-palette-title">Presets</div>
      <div class="color-palette" id="color-palette"></div>
    </div>

    <!-- Font picker popup -->
    <div class="font-popup" id="font-popup">
      <div class="font-search-wrap">
        <svg class="font-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="font-search" id="font-search" placeholder="Quick search" />
      </div>
      <div class="font-list" id="font-list"></div>
    </div>

    <div class="status-bar">
      <span id="status-text">Ready</span>
      <span id="cursor-pos">Ln 1, Col 1</span>
    </div>

    <!-- Samples drawer -->
    <div class="samples-drawer">
      <div class="samples-header" id="samples-toggle">
        <span class="panel-title">Sample Diagrams</span>
        <svg class="samples-toggle-icon open" id="samples-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </div>
      <div class="samples-body open" id="samples-body">
        <div class="samples-inner">
          <div class="cat-tabs" id="cat-tabs">
            ${categoryButtons}
          </div>
          <div class="sample-list" id="sample-list"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Resize handle -->
  <div class="resize-handle" id="resize-handle"></div>

  <!-- Right panel -->
  <div class="panel-right" id="panel-right">
    <div class="preview-header">
      <span class="panel-title">Preview</span>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div class="zoom-controls">
          <button class="icon-btn" id="zoom-out-btn" title="Zoom out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span class="zoom-label" id="zoom-label">100%</span>
          <button class="icon-btn" id="zoom-in-btn" title="Zoom in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button class="icon-btn" id="zoom-fit-btn" title="Fit to view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="preview-body" id="preview-body">
      <div class="render-spinner" id="render-spinner"></div>
      <div class="preview-inner" id="preview-inner">
        <div class="preview-placeholder" id="preview-placeholder">
          Start typing to render your diagram
        </div>
      </div>
    </div>

    <div class="preview-footer">
      <span id="render-time"></span>
      <span>beautiful-mermaid</span>
    </div>
  </div>

</div>

<div class="toast" id="toast"></div>

<!-- Bundled renderer -->
<script type="module">
${bundleJs}

// ============================================================================
// State
// ============================================================================

var SAMPLES = ${samplesJson};
var THEMES = window.__mermaid.THEMES;
var renderMermaid = window.__mermaid.renderMermaidSVGAsync;

var state = {
  theme: '',
  zoom: 1,
  config: {},
  activeCategory: SAMPLES[0]?.category ?? '',
};

// ============================================================================
// Elements
// ============================================================================

var editor        = document.getElementById('code-editor');
var lineNumbers   = document.getElementById('line-numbers');
var previewInner  = document.getElementById('preview-inner');
var previewBody   = document.getElementById('preview-body');
var statusText    = document.getElementById('status-text');
var cursorPos     = document.getElementById('cursor-pos');
var renderTime    = document.getElementById('render-time');
var zoomLabel     = document.getElementById('zoom-label');
var spinner       = document.getElementById('render-spinner');
var toast         = document.getElementById('toast');
var themeSelect   = document.getElementById('theme-select');
var catTabs       = document.getElementById('cat-tabs');
var sampleList    = document.getElementById('sample-list');
var samplesToggle = document.getElementById('samples-toggle');
var samplesBody   = document.getElementById('samples-body');
var samplesIcon   = document.getElementById('samples-icon');
var panelLeft     = document.getElementById('panel-left');
var resizeHandle  = document.getElementById('resize-handle');
var editorView    = document.getElementById('editor-view');
var configView    = document.getElementById('config-view');

// ============================================================================
// Sharing — URL hash encodes the diagram source as base64
// ============================================================================

function encodeSource(src) {
  try { return btoa(unescape(encodeURIComponent(src))); } catch(e) { return ''; }
}
function decodeSource(b64) {
  try { return decodeURIComponent(escape(atob(b64))); } catch(e) { return ''; }
}

function getHashSource() {
  var hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    var obj = JSON.parse(decodeSource(hash));
    if (obj && obj.source) {
      if (obj.theme) { themeSelect.value = obj.theme; state.theme = obj.theme; }
      return obj.source;
    }
  } catch(e) {}
  // Legacy: just the source
  return decodeSource(hash) || null;
}

function updateHash() {
  var obj = { source: editor.value };
  if (state.theme) obj.theme = state.theme;
  window.history.replaceState(null, '', '#' + encodeSource(JSON.stringify(obj)));
}

// ============================================================================
// Rendering
// ============================================================================

var renderTimer = null;

function scheduleRender(delay) {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(doRender, delay ?? 300);
}

function buildOptions() {
  // Theme is the base; config values override specific properties on top
  var opts = {};
  if (state.theme && THEMES[state.theme]) {
    var t = THEMES[state.theme];
    opts.bg = t.bg;
    opts.fg = t.fg;
    if (t.line)    opts.line    = t.line;
    if (t.accent)  opts.accent  = t.accent;
    if (t.muted)   opts.muted   = t.muted;
    if (t.surface) opts.surface = t.surface;
    if (t.border)  opts.border  = t.border;
  }
  return Object.assign(opts, state.config);
}

async function doRender() {
  var source = editor.value.trim();
  if (!source) {
    previewInner.innerHTML = '<div class="preview-placeholder">Start typing to render your diagram</div>';
    statusText.textContent = 'Ready';
    statusText.className = '';
    renderTime.textContent = '';
    return;
  }

  spinner.classList.add('visible');
  var t0 = performance.now();

  try {
    var svg = await renderMermaid(source, buildOptions());
    var ms = (performance.now() - t0).toFixed(0);
    previewInner.innerHTML = svg;
    var svgEl = previewInner.querySelector('svg');
    applyStrokeOverrides(svgEl);
    applyZoom(state.zoom);
    statusText.textContent = 'OK';
    statusText.className = 'status-ok';
    renderTime.textContent = 'Rendered in ' + ms + 'ms';
    updateHash();
  } catch(err) {
    var ms = (performance.now() - t0).toFixed(0);
    previewInner.innerHTML = '<div class="preview-error">' + escHtml(String(err)) + '</div>';
    statusText.textContent = 'Error';
    statusText.className = 'status-err';
    renderTime.textContent = '';
  } finally {
    spinner.classList.remove('visible');
  }
}

// ============================================================================
// Zoom
// ============================================================================

function getSvgNaturalSize(svgEl) {
  // Prefer viewBox dimensions; fall back to width/height attrs
  var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { w: vb.width, h: vb.height };
  var w = parseFloat(svgEl.getAttribute('width'))  || svgEl.getBoundingClientRect().width  || 400;
  var h = parseFloat(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height || 300;
  return { w: w, h: h };
}

function applyZoom(z) {
  state.zoom = Math.max(0.1, Math.min(8, z));
  var svgEl = previewInner.querySelector('svg');
  if (svgEl) {
    var nat = getSvgNaturalSize(svgEl);
    svgEl.style.width  = (nat.w * state.zoom) + 'px';
    svgEl.style.height = (nat.h * state.zoom) + 'px';
    // Remove any leftover transform from old approach
    svgEl.style.transform = '';
  }
  zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
}

document.getElementById('zoom-in-btn').addEventListener('click', function() {
  applyZoom(state.zoom * 1.25);
});
document.getElementById('zoom-out-btn').addEventListener('click', function() {
  applyZoom(state.zoom / 1.25);
});
document.getElementById('zoom-fit-btn').addEventListener('click', function() {
  applyZoom(1);
});

// Ctrl/Cmd+scroll → zoom; plain scroll → pan (browser default)
previewBody.addEventListener('wheel', function(e) {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  var factor = Math.pow(0.999, e.deltaY); // smooth pinch-style scaling
  applyZoom(state.zoom * factor);
}, { passive: false });

// ============================================================================
// Editor helpers
// ============================================================================

function updateLineNumbers() {
  var lines = editor.value.split('\\n').length;
  var html = '';
  for (var i = 1; i <= lines; i++) html += i + '\\n';
  lineNumbers.textContent = html;
}

function updateCursorPos() {
  var val = editor.value;
  var pos = editor.selectionStart;
  var lines = val.substring(0, pos).split('\\n');
  var line = lines.length;
  var col  = lines[lines.length - 1].length + 1;
  cursorPos.textContent = 'Ln ' + line + ', Col ' + col;
}

// Sync line number scroll with editor scroll
editor.addEventListener('scroll', function() {
  lineNumbers.scrollTop = editor.scrollTop;
});

editor.addEventListener('input', function() {
  updateLineNumbers();
  scheduleRender();
});

editor.addEventListener('keydown', function(e) {
  // Tab → 2 spaces
  if (e.key === 'Tab') {
    e.preventDefault();
    var start = editor.selectionStart;
    var end   = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    updateLineNumbers();
    scheduleRender();
    return;
  }
  // Cmd/Ctrl+Enter → render immediately
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    scheduleRender(0);
    return;
  }
});

editor.addEventListener('keyup', updateCursorPos);
editor.addEventListener('click', updateCursorPos);

// (theme change is handled in the Init section below)

// ============================================================================
// Config panel — colors, font, padding
// ============================================================================

var cfgColors = { bg: '', fg: '', accent: '', line: '', muted: '', surface: '' };
var cfgFont = '';
var cfgPadding = 24;

var COLOR_PRESETS = [
  // Grays
  '#ffffff','#f5f5f5','#e0e0e0','#bdbdbd','#9e9e9e','#757575','#424242','#212121','#000000',
  // Reds / Pinks
  '#f44336','#e91e63','#ff4081','#ff1744','#d50000',
  // Purples / Indigo
  '#9c27b0','#673ab7','#3f51b5','#7c4dff','#aa00ff',
  // Blues
  '#2196f3','#03a9f4','#00bcd4','#1565c0','#2979ff','#0091ea',
  // Greens / Teal
  '#4caf50','#8bc34a','#009688','#00e676','#1b5e20',
  // Yellows / Oranges
  '#ffeb3b','#ffc107','#ff9800','#ff5722','#ff6d00',
  // Dark palettes
  '#0f1117','#161b22','#1c2128','#0d1117','#1a1a2e','#16213e',
];

function readConfig() {
  var cfg = {};
  if (cfgColors.bg)      cfg.bg      = cfgColors.bg;
  if (cfgColors.fg)      cfg.fg      = cfgColors.fg;
  if (cfgColors.accent)  cfg.accent  = cfgColors.accent;
  if (cfgColors.line)    cfg.line    = cfgColors.line;
  if (cfgColors.muted)   cfg.muted   = cfgColors.muted;
  if (cfgColors.surface) cfg.surface = cfgColors.surface;
  if (cfgFont)           cfg.font    = cfgFont;
  if (cfgPadding !== 24) cfg.padding = cfgPadding;
  state.config = cfg;
}

// Map config key → theme property key (same names, but 'fg' maps to 'fg' etc.)
var THEME_COLOR_MAP = { bg: 'bg', fg: 'fg', accent: 'accent', line: 'line', muted: 'muted', surface: 'surface' };

function getThemeColor(key) {
  if (!state.theme || !THEMES[state.theme]) return null;
  return THEMES[state.theme][THEME_COLOR_MAP[key]] || null;
}

function updateColorUI(key) {
  var override = cfgColors[key];
  var themeVal = getThemeColor(key);
  var effective = override || themeVal;
  var label  = document.getElementById('cfg-' + key + '-label');
  var swatch = document.getElementById('cfg-' + key + '-swatch');
  var btn    = document.querySelector('.color-edit-btn[data-cfg="' + key + '"]');

  if (label) {
    label.textContent = override || (themeVal ? themeVal : '—');
    label.style.opacity = override ? '1' : '0.45';
  }
  if (swatch) {
    swatch.style.background = effective || 'transparent';
    swatch.style.border = effective ? '1px solid rgba(0,0,0,0.15)' : '1px dashed var(--fg3)';
    swatch.style.opacity = override ? '1' : (themeVal ? '0.6' : '1');
  }
  if (btn) {
    btn.title = override ? 'Override: ' + override : (themeVal ? 'Theme default: ' + themeVal : 'Not set');
  }
}

function refreshAllColorUIs() {
  Object.keys(cfgColors).forEach(function(k) { updateColorUI(k); });
}

// Init swatches
refreshAllColorUIs();

// ── Color popup ──────────────────────────────────────────────────────────────

var colorPopup    = document.getElementById('color-popup');
var colorNative   = document.getElementById('color-native-input');
var colorHexInput = document.getElementById('color-hex-input');
var activeColorKey = null;

// Build preset palette
var paletteEl = document.getElementById('color-palette');
COLOR_PRESETS.forEach(function(hex) {
  var btn = document.createElement('button');
  btn.className = 'color-swatch-btn';
  btn.style.background = hex;
  btn.title = hex;
  btn.addEventListener('click', function() {
    setActiveColor(hex);
  });
  paletteEl.appendChild(btn);
});

function openColorPopup(key, anchorEl) {
  activeColorKey = key;
  var labels = { bg:'Background', fg:'Foreground', accent:'Accent', line:'Line', muted:'Muted', surface:'Surface' };
  document.getElementById('color-popup-title').textContent = labels[key] || key;

  var val = cfgColors[key] || '#ffffff';
  colorHexInput.value = cfgColors[key] || '';
  if (/^#[0-9a-fA-F]{6}$/.test(val)) colorNative.value = val;

  // Position near the button
  var rect = anchorEl.getBoundingClientRect();
  var popup = colorPopup;
  popup.classList.add('open');
  var pw = 240;
  var left = rect.right - pw;
  if (left < 8) left = 8;
  var top = rect.bottom + 6;
  if (top + 400 > window.innerHeight) top = rect.top - 406;
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
}

function setActiveColor(hex) {
  if (!activeColorKey) return;
  cfgColors[activeColorKey] = hex;
  colorHexInput.value = hex;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) colorNative.value = hex;
  updateColorUI(activeColorKey);
  readConfig();
  scheduleRender(200);
}

function closeColorPopup() {
  colorPopup.classList.remove('open');
  activeColorKey = null;
}

// Open popup on color-edit-btn click
document.querySelectorAll('.color-edit-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var key = btn.dataset.cfg;
    if (colorPopup.classList.contains('open') && activeColorKey === key) {
      closeColorPopup(); return;
    }
    openColorPopup(key, btn);
  });
});

document.getElementById('color-popup-close').addEventListener('click', closeColorPopup);

document.getElementById('color-clear-btn').addEventListener('click', function() {
  if (!activeColorKey) return;
  cfgColors[activeColorKey] = '';
  colorHexInput.value = '';
  updateColorUI(activeColorKey);
  readConfig();
  scheduleRender(200);
});

colorNative.addEventListener('input', function() {
  setActiveColor(colorNative.value);
});

colorHexInput.addEventListener('input', function() {
  var val = colorHexInput.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    colorNative.value = val;
    cfgColors[activeColorKey] = val;
    updateColorUI(activeColorKey);
    readConfig();
    scheduleRender(400);
  }
});

document.addEventListener('click', function(e) {
  if (!colorPopup.classList.contains('open')) return;
  if (!e.target.closest('#color-popup') && !e.target.closest('.color-edit-btn')) closeColorPopup();
});

// ── Font picker ───────────────────────────────────────────────────────────────

// Font value = just the font name (renderer wraps it in quotes internally)
var PRESET_FONTS = [
  { name: 'Inter',           value: 'Inter',           group: 'Sans-serif' },
  { name: 'Geist',           value: 'Geist',           group: 'Sans-serif' },
  { name: 'Roboto',          value: 'Roboto',          group: 'Sans-serif' },
  { name: 'Open Sans',       value: 'Open Sans',       group: 'Sans-serif' },
  { name: 'Lato',            value: 'Lato',            group: 'Sans-serif' },
  { name: 'Poppins',         value: 'Poppins',         group: 'Sans-serif' },
  { name: 'Nunito',          value: 'Nunito',          group: 'Sans-serif' },
  { name: 'DM Sans',         value: 'DM Sans',         group: 'Sans-serif' },
  { name: 'Space Grotesk',   value: 'Space Grotesk',   group: 'Sans-serif' },
  { name: 'Arial',           value: 'Arial',           group: 'System' },
  { name: 'Georgia',         value: 'Georgia',         group: 'Serif' },
  { name: 'Merriweather',    value: 'Merriweather',    group: 'Serif' },
  { name: 'Playfair Display',value: 'Playfair Display',group: 'Serif' },
  { name: 'JetBrains Mono',  value: 'JetBrains Mono',  group: 'Monospace' },
  { name: 'Fira Code',       value: 'Fira Code',       group: 'Monospace' },
  { name: 'Source Code Pro', value: 'Source Code Pro', group: 'Monospace' },
  { name: 'Courier New',     value: 'Courier New',     group: 'Monospace' },
];

var fontPopup     = document.getElementById('font-popup');
var fontSearch    = document.getElementById('font-search');
var fontList      = document.getElementById('font-list');
var fontSelectBtn = document.getElementById('font-select-btn');
var fontSelectLabel = document.getElementById('font-select-label');

function buildFontList(query) {
  var q = (query || '').toLowerCase();
  var filtered = PRESET_FONTS.filter(function(f) {
    return !q || f.name.toLowerCase().includes(q) || f.value.toLowerCase().includes(q);
  });

  // Group them
  var groups = {};
  filtered.forEach(function(f) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  fontList.innerHTML = '';

  // Also add browser-loaded fonts detected via document.fonts
  var browserFonts = [];
  try {
    document.fonts.forEach(function(ff) {
      var n = ff.family.replace(/['"]/g, '');
      if (!q || n.toLowerCase().includes(q)) browserFonts.push(n);
    });
    browserFonts = [...new Set(browserFonts)].sort();
  } catch(e) {}

  Object.keys(groups).forEach(function(group) {
    var label = document.createElement('div');
    label.className = 'font-section-label';
    label.textContent = group;
    fontList.appendChild(label);
    groups[group].forEach(function(f) { appendFontItem(f.name, f.value); });
  });

  if (browserFonts.length) {
    var label = document.createElement('div');
    label.className = 'font-section-label';
    label.textContent = 'Loaded in browser';
    fontList.appendChild(label);
    browserFonts.forEach(function(name) {
      appendFontItem(name, name);
    });
  }
}

function appendFontItem(name, value) {
  var item = document.createElement('div');
  item.className = 'font-item' + (cfgFont === value ? ' active' : '');
  var previewSpan = document.createElement('span');
  previewSpan.className = 'font-item-preview';
  previewSpan.style.fontFamily = value + ', sans-serif';
  previewSpan.textContent = 'Aa';
  var nameSpan = document.createElement('span');
  nameSpan.className = 'font-item-name';
  nameSpan.textContent = name;
  item.appendChild(previewSpan);
  item.appendChild(nameSpan);
  item.addEventListener('click', function() {
    cfgFont = value;
    fontSelectLabel.textContent = name;
    closeFontPopup();
    readConfig();
    scheduleRender(0);
  });
  fontList.appendChild(item);
}

function openFontPopup() {
  buildFontList('');
  fontSearch.value = '';
  var rect = fontSelectBtn.getBoundingClientRect();
  var top = rect.bottom + 6;
  var left = rect.right - 220;
  if (left < 8) left = 8;
  fontPopup.style.top  = top  + 'px';
  fontPopup.style.left = left + 'px';
  fontPopup.classList.add('open');
  fontSearch.focus();
}

function closeFontPopup() {
  fontPopup.classList.remove('open');
}

fontSelectBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  if (fontPopup.classList.contains('open')) { closeFontPopup(); return; }
  openFontPopup();
});

fontSearch.addEventListener('input', function() {
  buildFontList(fontSearch.value);
});

document.addEventListener('click', function(e) {
  if (!fontPopup.classList.contains('open')) return;
  if (!e.target.closest('#font-popup') && !e.target.closest('#font-select-btn')) closeFontPopup();
});

// ── Padding slider ────────────────────────────────────────────────────────────

var paddingNum    = document.getElementById('cfg-padding');
var paddingSlider = document.getElementById('cfg-padding-slider');

function setPadding(val) {
  val = Math.max(0, Math.min(120, parseInt(val, 10) || 0));
  cfgPadding = val;
  paddingNum.value    = val;
  paddingSlider.value = val;
  readConfig();
  scheduleRender(200);
}

paddingNum.addEventListener('input', function() { setPadding(paddingNum.value); });
paddingSlider.addEventListener('input', function() { setPadding(paddingSlider.value); });

// ── Stroke width overrides ────────────────────────────────────────────────────

var cfgEdgeStroke = 1;
var cfgNodeStroke = 1;

// Inject a <style> block into the SVG to override hardcoded stroke-width attrs.
// CSS rules override SVG presentation attributes (lower specificity).
function applyStrokeOverrides(svgEl) {
  var styleId = '__bm-sw-override';
  var old = svgEl.querySelector('#' + styleId);
  if (old) old.remove();

  var edgeChanged = cfgEdgeStroke !== 1;
  var nodeChanged = cfgNodeStroke !== 1;
  if (!edgeChanged && !nodeChanged) return;

  var rules = [];
  if (edgeChanged) {
    var ew = cfgEdgeStroke;
    // Lines and paths/polylines with fill="none" are connectors/edges
    rules.push(
      'line { stroke-width: ' + ew + ' }',
      'path[fill="none"] { stroke-width: ' + ew + ' }',
      'polyline[fill="none"] { stroke-width: ' + ew + ' }',
      'polygon[fill="none"] { stroke-width: ' + ew + ' }'  // open arrow heads
    );
  }
  if (nodeChanged) {
    var nw = cfgNodeStroke;
    // Filled shapes are node borders; polygons with fill are diamond/hexagon etc.
    rules.push(
      'rect { stroke-width: ' + nw + ' }',
      'ellipse { stroke-width: ' + nw + ' }',
      'circle { stroke-width: ' + nw + ' }',
      'polygon:not([fill="none"]) { stroke-width: ' + nw + ' }'
    );
  }

  var style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.id = styleId;
  style.textContent = rules.join('\n');
  svgEl.insertBefore(style, svgEl.firstChild);
}

function makeStrokeSetter(numEl, sliderEl, getVal, setVal) {
  return function(raw) {
    var v = Math.max(0.25, Math.min(8, parseFloat(raw) || 1));
    v = Math.round(v * 4) / 4; // snap to 0.25 steps
    setVal(v);
    numEl.value    = v;
    sliderEl.value = v;
    var svgEl = previewInner.querySelector('svg');
    if (svgEl) applyStrokeOverrides(svgEl);
  };
}

var edgeStrokeNum    = document.getElementById('cfg-edge-stroke');
var edgeStrokeSlider = document.getElementById('cfg-edge-stroke-slider');
var nodeStrokeNum    = document.getElementById('cfg-node-stroke');
var nodeStrokeSlider = document.getElementById('cfg-node-stroke-slider');

var setEdgeStroke = makeStrokeSetter(edgeStrokeNum, edgeStrokeSlider,
  function() { return cfgEdgeStroke; },
  function(v) { cfgEdgeStroke = v; }
);
var setNodeStroke = makeStrokeSetter(nodeStrokeNum, nodeStrokeSlider,
  function() { return cfgNodeStroke; },
  function(v) { cfgNodeStroke = v; }
);

edgeStrokeNum.addEventListener('input',    function() { setEdgeStroke(edgeStrokeNum.value); });
edgeStrokeSlider.addEventListener('input', function() { setEdgeStroke(edgeStrokeSlider.value); });
nodeStrokeNum.addEventListener('input',    function() { setNodeStroke(nodeStrokeNum.value); });
nodeStrokeSlider.addEventListener('input', function() { setNodeStroke(nodeStrokeSlider.value); });

// ============================================================================
// Tabs
// ============================================================================

document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var panel = tab.dataset.panel;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    if (panel === 'code') {
      editorView.style.display = 'flex';
      configView.classList.remove('visible');
      document.getElementById('editor-panel-title').textContent = 'Source';
    } else {
      editorView.style.display = 'none';
      configView.classList.add('visible');
      document.getElementById('editor-panel-title').textContent = 'Config';
      refreshAllColorUIs();
    }
  });
});

// ============================================================================
// Samples
// ============================================================================

samplesToggle.addEventListener('click', function() {
  var isOpen = samplesBody.classList.toggle('open');
  samplesIcon.classList.toggle('open', isOpen);
});

function renderSampleList(category) {
  state.activeCategory = category;
  // Update active cat button
  document.querySelectorAll('.cat-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.cat === category);
  });
  // Render sample items
  var items = SAMPLES.filter(function(s) { return s.category === category; });
  sampleList.innerHTML = items.map(function(s, i) {
    return '<div class="sample-item" data-source="' + escAttr(s.source) + '">' +
      '<span class="sample-item-arrow">›</span>' +
      '<span>' + escHtml(s.title) + '</span>' +
      '</div>';
  }).join('');

  sampleList.querySelectorAll('.sample-item').forEach(function(item) {
    item.addEventListener('click', function() {
      editor.value = item.dataset.source;
      updateLineNumbers();
      scheduleRender(0);
    });
  });
}

catTabs.addEventListener('click', function(e) {
  var btn = e.target.closest('.cat-btn');
  if (!btn) return;
  renderSampleList(btn.dataset.cat);
});

// ============================================================================
// Buttons
// ============================================================================

document.getElementById('copy-source-btn').addEventListener('click', function() {
  navigator.clipboard.writeText(editor.value).then(function() { showToast('Source copied!'); });
});

document.getElementById('clear-btn').addEventListener('click', function() {
  editor.value = '';
  updateLineNumbers();
  previewInner.innerHTML = '<div class="preview-placeholder">Start typing to render your diagram</div>';
  statusText.textContent = 'Ready';
  statusText.className = '';
  renderTime.textContent = '';
  window.history.replaceState(null, '', window.location.pathname);
});

// ============================================================================
// Export dropdown
// ============================================================================

var exportScale = 4;
var exportDropdown = document.getElementById('export-dropdown');

function toggleExportDropdown(e) {
  e.stopPropagation();
  exportDropdown.classList.toggle('open');
}
document.getElementById('export-chevron-btn').addEventListener('click', toggleExportDropdown);
document.getElementById('export-main-btn').addEventListener('click', function() {
  exportPNG();
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('#export-wrap')) exportDropdown.classList.remove('open');
});

// Size pills
document.getElementById('size-pills').addEventListener('click', function(e) {
  var pill = e.target.closest('.size-pill');
  if (!pill) return;
  exportScale = parseInt(pill.dataset.scale, 10);
  document.querySelectorAll('.size-pill').forEach(function(p) { p.classList.remove('active'); });
  pill.classList.add('active');
});

function getSvgEl() {
  var el = previewInner.querySelector('svg');
  if (!el) { showToast('Render a diagram first.'); return null; }
  return el;
}

function svgToPngBlob(svgEl, scale, cb) {
  var serialized = new XMLSerializer().serializeToString(svgEl);
  var svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(svgBlob);
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement('canvas');
    var w = img.naturalWidth  || svgEl.viewBox.baseVal.width  || 800;
    var h = img.naturalHeight || svgEl.viewBox.baseVal.height || 600;
    canvas.width  = w * scale;
    canvas.height = h * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(cb, 'image/png');
  };
  img.onerror = function() { URL.revokeObjectURL(url); showToast('PNG export failed.'); };
  img.src = url;
}

function exportPNG() {
  var svgEl = getSvgEl(); if (!svgEl) return;
  svgToPngBlob(svgEl, exportScale, function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'diagram.png'; a.click();
    URL.revokeObjectURL(url);
    showToast('PNG saved (' + exportScale + 'x)');
    exportDropdown.classList.remove('open');
  });
}

function exportSVG() {
  var svgEl = getSvgEl(); if (!svgEl) return;
  var data = new XMLSerializer().serializeToString(svgEl);
  var blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'diagram.svg'; a.click();
  URL.revokeObjectURL(url);
  showToast('SVG saved!');
  exportDropdown.classList.remove('open');
}

function copyImage() {
  var svgEl = getSvgEl(); if (!svgEl) return;
  svgToPngBlob(svgEl, exportScale, function(blob) {
    try {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
        showToast('Image copied to clipboard!');
        exportDropdown.classList.remove('open');
      });
    } catch(e) { showToast('Copy not supported in this browser.'); }
  });
}

function copyURL() {
  updateHash();
  navigator.clipboard.writeText(window.location.href).then(function() {
    showToast('URL copied to clipboard!');
    exportDropdown.classList.remove('open');
  });
}

document.getElementById('export-png-btn').addEventListener('click', exportPNG);
document.getElementById('export-svg-btn').addEventListener('click', exportSVG);
document.getElementById('copy-image-btn').addEventListener('click', copyImage);
document.getElementById('copy-link-btn').addEventListener('click', copyURL);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.target === editor) return;
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 's') { e.preventDefault(); exportPNG(); }
  if ((e.metaKey || e.ctrlKey) &&  e.shiftKey && e.key === 'S') { e.preventDefault(); exportSVG(); }
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'c') { e.preventDefault(); copyImage(); }
  if ((e.metaKey || e.ctrlKey) &&  e.shiftKey && e.key === 'C') { e.preventDefault(); copyURL(); }
});

// ============================================================================
// Resize handle
// ============================================================================

var isResizing = false;
var resizeStartX = 0;
var resizeStartW = 0;

resizeHandle.addEventListener('mousedown', function(e) {
  isResizing = true;
  resizeStartX = e.clientX;
  resizeStartW = panelLeft.getBoundingClientRect().width;
  resizeHandle.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', function(e) {
  if (!isResizing) return;
  var dx = e.clientX - resizeStartX;
  var newW = Math.max(280, Math.min(window.innerWidth * 0.75, resizeStartW + dx));
  panelLeft.style.width = newW + 'px';
});

document.addEventListener('mouseup', function() {
  if (!isResizing) return;
  isResizing = false;
  resizeHandle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});

// ============================================================================
// Toast
// ============================================================================

var toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ============================================================================
// Helpers
// ============================================================================

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============================================================================
// Dark / Light mode toggle
// ============================================================================

var isDark = localStorage.getItem('bm-editor-dark') !== 'false';
var iconMoon = document.getElementById('icon-moon');
var iconSun  = document.getElementById('icon-sun');

var AUTO_DARK_DIAGRAM_THEME  = 'zinc-dark';
var AUTO_LIGHT_DIAGRAM_THEME = '';

// Tracks whether the current diagram theme was auto-set by the mode toggle
// so we don't clobber a theme the user picked manually.
var diagramThemeIsAuto = true;

function applyColorMode(dark, force) {
  isDark = dark;
  if (dark) {
    document.documentElement.classList.remove('light');
    iconMoon.style.display = '';
    iconSun.style.display  = 'none';
  } else {
    document.documentElement.classList.add('light');
    iconMoon.style.display = 'none';
    iconSun.style.display  = '';
  }
  localStorage.setItem('bm-editor-dark', dark ? 'true' : 'false');

  // Auto-sync the diagram theme unless the user manually chose one
  if (diagramThemeIsAuto || force) {
    var autoTheme = dark ? AUTO_DARK_DIAGRAM_THEME : AUTO_LIGHT_DIAGRAM_THEME;
    themeSelect.value = autoTheme;
    state.theme = autoTheme;
    diagramThemeIsAuto = true;
    refreshAllColorUIs();
    scheduleRender(0);
  }
}

document.getElementById('dark-light-btn').addEventListener('click', function() {
  applyColorMode(!isDark, true);
});

// When user manually picks a diagram theme, stop auto-syncing
themeSelect.addEventListener('change', function() {
  diagramThemeIsAuto = false;
}, { capture: true });

// Apply on load
applyColorMode(isDark);

// ============================================================================
// Init
// ============================================================================

// Load saved diagram theme (manual user selection overrides auto-sync)
var savedTheme = localStorage.getItem('bm-editor-theme') || '';
if (savedTheme) {
  themeSelect.value = savedTheme;
  state.theme = savedTheme;
  diagramThemeIsAuto = false;
}

// Persist diagram theme choice
themeSelect.addEventListener('change', function() {
  state.theme = themeSelect.value;
  if (themeSelect.value) {
    localStorage.setItem('bm-editor-theme', themeSelect.value);
  } else {
    localStorage.removeItem('bm-editor-theme');
  }
  refreshAllColorUIs();
  scheduleRender(0);
});

// Init samples
renderSampleList(state.activeCategory);

// Load source from URL hash or use default
var hashSource = getHashSource();
if (hashSource) {
  editor.value = hashSource;
} else {
  editor.value = SAMPLES[0].source;
}

updateLineNumbers();
scheduleRender(0);

</script>
</body>
</html>`
}

const html = await generateEditorHtml()
const outPath = new URL('./editor.html', import.meta.url).pathname
await Bun.write(outPath, html)
console.log(`Written to ${outPath} (${(html.length / 1024).toFixed(1)} KB)`)
