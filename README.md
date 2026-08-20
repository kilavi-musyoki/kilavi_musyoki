# Silicon Soul — Kilavi Musyoki Portfolio

Personal portfolio and interactive hardware diagnostic interface built with React 19, Vite, Tailwind CSS, and Framer Motion. Designed with a telecommunications, embedded systems, and PCB telemetry aesthetic.

```
System Serial : SN-2024-KM-PORTFOLIO-REV2
Firmware      : v4.0.0
Owner         : Kilavi Musyoki (Telecommunications & Information Engineering, DeKUT)
Status        : Production / Active
```

---

## Overview

This repository contains the source code for my personal portfolio. Rather than using a standard portfolio template, the interface is modeled after electronic test benches, multi-layer printed circuit boards, and telecommunications equipment.

Key focus areas highlighted in the portfolio include:
- Telecommunications & RF engineering (microstrip simulation, impedance matching)
- Embedded systems & IoT (FreeRTOS, ESP32, MQTT)
- Cybersecurity & offensive security tooling (OWASP Top 10, IAM, cloud security)
- Full-stack web application development

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 19, Vite 7, Tailwind CSS 4 |
| **Animation & Physics** | Framer Motion 12, GSAP |
| **Audio Synthesis** | Web Audio API (real-time square wave / noise synthesis) |
| **Canvas & Graphics** | HTML5 2D Canvas (Oscilloscope, Tetris grid, PCB renderer) |
| **Security & Forms** | Cloudflare Turnstile, EmailJS, Nodemailer |
| **Linting & Tooling** | ESLint 9, PostCSS, Autoprefixer |

---

## Key Modules & Interactive Components

### 1. Hardware Layer Disassembly (`DeviceSandbox.jsx`, `Board.jsx`)
- **Tri-Layer Inspection Slider:** Lets users switch between the product enclosure (`Casing`), internal 7-layer circuit traces (`PCB`), and micro-architecture die (`Silicon`).
- **Dynamic Optical Sensor:** Hardware LED on the PCB board tracks cursor coordinates across the screen with real-time lerp interpolation.
- **CRT Scanline Glitch:** Canvas-based glitch filter and chromatic aberration trigger during layer transitions.

### 2. Embedded Arcade Engine (`TetrusGame.jsx`)
- Self-contained arcade game built from scratch using HTML5 Canvas.
- **Custom Audio Synthesizer (`TetrisAudio.js`):** Uses the browser's Web Audio API to synthesize 8-bit sound effects (rotation, line clear, drop, game over) programmatically without loading external audio files.
- Integrated into the interactive avatar hub.

### 3. Idle Mascot (`IdleCharacter.jsx`)
- Spawns after 5 seconds of user inactivity.
- Runs across the viewport, performs flips and wind-up jumps, and displays telemetry messages.
- Clicking or tapping the character triggers an energy collapse animation followed by a full-screen, multi-stage fireworks particle burst color-matched to the active theme.

### 4. Contextual Telemetry Cursor (`CyberCursor.jsx`)
- Replaces the system cursor on fine-pointer devices with a low-latency HUD reticle.
- Dynamically adapts based on the hovered element:
  - `default`: 18px micro-radar reticle with central dot.
  - `pointer`: Snap brackets for buttons and links.
  - `project-expand` / `project-collapse`: Aperture reticle that pulses on click, color-matched to each project's accent color.
  - `grab`: Dual mechanical caliper claws that physically clamp inward during slider drags.
  - `crosshair`: Orthogonal laser crosshair for PCB components and canvas elements.
  - `text`: Slim laser I-beam probe for inputs and code.

### 5. Canvas Oscilloscope (`Contact.jsx`)
- Real-time animated waveform monitor rendering selectable sine, ECG/heartbeat, and digital clock pulse signals.
- Connected to a contact form with Cloudflare Turnstile anti-bot verification.

---

## Featured Projects (Modules 01 - 10)

- **MODULE 01 — Multi-Protocol IoT Gateway** `[C++, FreeRTOS, ESP32, MQTT]`  
  Industrial edge gateway bridging Modbus RTU, BLE sensors, and MQTT brokers.

- **MODULE 02 — 5G Network Slice Manager** `[Go, Kubernetes, gRPC, Docker]`  
  Automated lifecycle orchestrator for 5G Core Network Functions (AMF, SMF, UPF).

- **MODULE 03 — Distributed Telemetry Pipeline** `[Rust, Apache Kafka, InfluxDB]`  
  High-throughput telemetry ingestion pipeline processing 50k+ sensor events/sec.

- **MODULE 04 — Edge ML Signal Classifier** `[Python, TensorFlow Lite, C++]`  
  On-device RF modulation classifier recognizing QPSK, 16-QAM, and FSK signals.

- **MODULE 05 — Cellular Base Station Controller** `[C++, Open5GS, Linux, Python]`  
  Software-defined gNodeB controller managing RRC connection states and mobility handovers.

- **MODULE 06 — CyberPath** `[React 18, TypeScript, Vite, Google Apps Script]`  
  Hands-on OWASP Top 10 interactive learning platform with step-by-step exploit and patch labs.

- **MODULE 07 — RF Impedance Matching Network** `[Python, SciPy, Matplotlib]`  
  Smith chart impedance matching calculator for L-section, Pi, and T networks.

- **MODULE 08 — Microstrip Transmission Line Simulation** `[Keysight ADS, Python, SciPy]`  
  Quasi-static synthesis and EM simulation of characteristic impedance and dielectric loss.

- **MODULE 09 — UniDMS** `[React, Express, PostgreSQL, Node.js]`  
  University document management system with role-based access control and approval workflows.

- **MODULE 10 — University Management System** `[React, Tailwind CSS, Node.js, SQL]`  
  Centralized portal managing course registration, grade tracking, and fee reconciliation.

---

## Design System & Theme Engine

The application includes two distinct themes managed in `src/theme.js` and `src/index.css`:

| Token | Dark Mode (`Silicon Obsidian`) | Light Mode (`Warm Amber Circuit`) |
|---|---|---|
| Background | `#060A10` | `#FDFBD4` |
| Primary Accent | `#4BD8A0` (Mint) | `#CE8946` (Amber) |
| Secondary Accent | `#6FD4FF` (Cyan) | `#D4AF37` (Gold) |
| Border Standard | `rgba(75, 216, 160, 0.18)` | `rgba(189, 183, 107, 0.45)` |
| Body Text | `#CED4DE` | `#2C1F0A` |
| Card Background | `rgba(16, 20, 28, 0.45)` | `rgba(255, 250, 220, 0.60)` |

---

## Directory Structure

```
portfoliov4/
├── public/
│   ├── assets/
│   │   └── Kilavi_Musyoki_CV.pdf
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Board.jsx              # Interactive SVG PCB
│   │   ├── CyberCursor.jsx        # Contextual custom cursor
│   │   ├── DebugOverlay.jsx       # Diagnostic HUD panel
│   │   ├── DeviceCanvas.jsx       # 3D hardware layer canvas
│   │   ├── DeviceSandbox.jsx      # Layer disassembler controller
│   │   ├── IdleCharacter.jsx      # Telemetry mascot + fireworks
│   │   ├── LeverControl.jsx       # Mechanical slider input
│   │   ├── PortraitHub.jsx        # Avatar + game switcher
│   │   ├── TetrusGame.jsx         # Canvas Tetris game
│   │   └── ThemeToggle.jsx        # Light/Dark mode power switch
│   ├── engine/
│   │   ├── TetrisAudio.js         # Web Audio API sound synthesizer
│   │   ├── TetrisEngine.js        # Game loop & collision logic
│   │   └── TetrisRenderer.js      # Canvas render routines
│   ├── hooks/
│   │   └── useFocusTrap.js        # Accessibility focus trap
│   ├── sections/
│   │   ├── Hero.jsx               # Bootloader, specs, PCB preview
│   │   ├── About.jsx              # Engineering datasheet & skill bars
│   │   ├── Projects.jsx           # 10 expandable module datasheets
│   │   ├── Milestones.jsx         # Version changelog timeline
│   │   └── Contact.jsx            # Waveform oscilloscope & form
│   ├── theme.js                   # Central design tokens
│   ├── scrollSetup.js             # Smooth scroll configuration
│   ├── index.css                  # Global styles & keyframe animations
│   ├── App.jsx                    # Root application component
│   └── main.jsx                   # Entry point
├── api/
│   └── contact.js                 # Serverless Nodemailer endpoint
├── package.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0 or newer)
- npm or pnpm

### Local Setup

```bash
# Clone the repository
git clone https://github.com/kilavi-musyoki/portfoliov4.git

# Navigate to project root
cd portfoliov4

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Environment Variables

To configure the contact form, create a `.env.local` file in the root directory:

```env
# EmailJS Service Credentials
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Optional: Cloudflare Turnstile Captcha
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

---

## Build & Deployment

```bash
# Create production build
npm run build

# Preview build locally
npm run preview
```

### Deploying to Vercel

```bash
npm install -g vercel
vercel --prod
```

Configure your environment variables in the Vercel project settings (**Settings → Environment Variables**).

---

## Diagnostics & Keyboard Controls

- **Diagnostic Mode:** Type `debug` anywhere on the page to toggle the diagnostic overlay showing live FPS, memory usage, and component bounds.
- **Arcade Toggle:** Click the game icon on the avatar card to switch between the portrait and the playable Tetris arcade.
- **Layer Slider:** Drag the lever in the hardware section to inspect Casing, PCB, and Silicon die layers.

---

## Contact

**Kilavi Musyoki**  
B.Sc. Telecommunications & Information Engineering  
Dedan Kimathi University of Technology (DeKUT)

- **Email:** musyokikilavi870@gmail.com
- **Phone:** +254 700 663 557
- **GitHub:** [github.com/kilavi-musyoki](https://github.com/kilavi-musyoki)
- **LinkedIn:** [linkedin.com/in/kilavi-musyoki](https://linkedin.com/in/kilavi-musyoki)
