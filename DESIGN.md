# Conversio Semantic Design System (DESIGN.md)

> **Design Paradigm**: Studio Glass & Precision Telemetry Console  
> **Target Audience**: Teams, engineers, and creators demanding instant, uncompromised real-time collaboration with zero vendor surveillance and zero software bloat.

---

## 1. Visual Atmosphere & Principles

* **Density**: `Balanced High-Agency` (5/10 on landing, 8/10 in active meeting room)
* **Variance**: `Offset Asymmetric Precision` (6/10)
* **Motion**: `Fluid Physics & Hardware-Accelerated Micro-Transitions` (6/10)
* **Design Tenet**: "Every pixel represents actual application state." No faux decorative charts, no marketing fluff, no generic 3D illustrations.

---

## 2. Calibrated Color Palette

| Color Token | Descriptive Name | Hex Code | Functional Role |
| :--- | :--- | :--- | :--- |
| `--c-ink` | Deep Obsidian Void | `#07090D` | Canonical application canvas & dark ground |
| `--c-glass` | Slate Carbon Glass | `#0E121A` | Elevated cards, side drawers, modals, controls |
| `--c-chalk` | Crisp Optical Chalk | `#EDEDE8` | High-contrast readable typography & icons |
| `--c-muted` | Technical Slate | `#8A909E` | Secondary captions, timestamps, specs, labels |
| `--c-signal` | Bioluminescent Emerald | `#00F2A9` | Primary action signal, active audio meter, online status |
| `--c-pulse` | Precision Crimson | `#FF4D4D` | Room lock, mic/camera muted, disconnect, danger actions |
| `--c-prism` | Warm Technical Amber | `#FFB74D` | Security badges, waiting room pending, OCC warnings |
| `--c-line` | Sub-pixel Hairline | `237 237 232` (0.08 alpha) | Architectural card borders, grid dividing lines |

> [!IMPORTANT]
> Generic "AI neon purple/cyan gradients" are strictly prohibited. The single energetic accent is Bioluminescent Emerald (`#00F2A9`), counterbalanced with warm optical chalk and obsidian glass.

---

## 3. Typographic Architecture

1. **Display & Editorial Headlines**:
   * Font: `Instrument Serif` (Modern editorial serif)
   * Style: 400 normal / 400 italic, tracking `[-0.025em]`, tight leading (`0.98 - 1.05`)
   * Scope: Hero value propositions, modal title accents, high-impact statements
2. **User Interface & Controls**:
   * Font: `Geist Sans`
   * Style: 400 / 500 / 600 weight, strict line-height `1.4 - 1.5`, max 65 characters per prose line
   * Scope: Navigation, buttons, inputs, chat bubbles, participant names
3. **Telemetry & Technical Metrics**:
   * Font: `Geist Mono`
   * Style: Monospaced tabular figures, uppercase micro-labels with `tracking-[0.08em]`
   * Scope: Room IDs, latency/ping indicators, encryption fingerprints, packet loss, timer counters

---

## 4. Component Behaviors & Tokens

* **Buttons**:
  * *Primary Signal*: Background `#00F2A9`, text `#07090D`, 2px rounded corners (`rounded-[2px]`), subtle hover sweep light flare.
  * *Secondary Glass*: Background `rgba(237,237,232,0.05)`, border `border-line`, text `#EDEDE8`, hover background `rgba(237,237,232,0.09)`.
  * *Danger Action*: Background `rgba(255,77,77,0.12)`, border `rgba(255,77,77,0.3)`, text `#FF4D4D`.
* **Inputs & Forms**:
  * Minimalist single-line borders, background `#0E121A`, text `#EDEDE8`, focus ring `#00F2A9`.
  * Inline validation errors with immediate descriptive feedback.
* **Badges & Indicators**:
  * Live pulse dot with green bioluminescent glow for healthy WebRTC connection.
  * Amber lock pill for passcode-protected and OCC-versioned rooms.

---

## 5. Hero Section Philosophy

The hero section must address **what Conversio solves** within 3 seconds of reading:
1. **The Problem**: Corporate video tools are heavy, collect intrusive telemetry, require sluggish native apps or forced accounts, and lack verifiable end-to-end client encryption.
2. **The Solution**: Instant WebRTC video rooms + client-side AES-256-GCM encrypted file drop + real-time whiteboard in a single lightweight browser tab. Zero install. Zero friction. Absolute privacy.
3. **Instant Agency**: Immediate 1-step room creation or room code entry directly in the hero fold without scrolling.
