# Zihan Fakir — Technical Portfolio Showcase

An ultra-modern, motion-led personal portfolio for **Zihan Fakir**, full-stack developer and software engineer.
Designed with a dark, HUD / cyberpunk-technical aesthetic featuring a real-time WebGL 3D robot centerpiece, GSAP text-scramble decode interactions, smooth liquid pill buttons, Lenis smooth scrolling, and live time HUD status.

Based on the motion architecture and design system of [Arif Hasan's Portfolio](https://arif-hasan.vercel.app).

---

## ⚡ Core Features

- **3D Robot Centerpiece**: Interactive WebGL robot (`robot.glb`) rendered live with Three.js, crease-edge wireframes, mouse-tracked pointer tilt, drag-to-rotate controls, and smooth idle breathing floating physics.
- **Ambient HUD System**:
  - Live HH:MM:SS clock in the owner's timezone (`Dhaka / GMT+6`).
  - Auto-cycling status indicator (`BUILDING`, `LEARNING`, `SHIPPING`, `CODING`).
  - Corner HUD coordinates & micro-brackets.
- **GSAP Motion Primitives**:
  - **`ScrambleText`**: Custom character-by-character decode effect that rapidly cycles through glyphs and locks in left-to-right on page entrance and hover, preserving accessibility (`aria-label` with real text).
  - **`LiquidButton`**: Cream pill button with an inset black circular badge that floods horizontally on hover across the button with a reversible timeline.
  - **`CursorDot`**: Smooth mouse-following cursor dot with velocity catch-up lag on fine-pointer devices.
  - **`PixelReveal`**: 22×13 pixel grid dissolve animation on page entrance.
- **Interactive Pages**:
  - **Home (`/`)**: 3D robot centerpiece, HUD live clock, text scramble name & title, and Liquid "Get in touch" button.
  - **About (`/about`)**: Narrative profile, categorized technical skills grid, academic education, living circuit career trajectory (`#career`), and 1-click email copy contact section (`#contact`).
  - **Projects (`/projects`)**: Filterable project showcases with custom accent colors, stack badges, GitHub source code, and live demo links.
  - **Achievements (`/achievements`)**: Tabbed credentials grid for Hackathons, Research, Courses, and Volunteering.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, React 19, TypeScript) |
| **Styling** | Tailwind CSS & PostCSS |
| **3D Graphics** | Three.js & WebGL (`GLTFLoader`, `EdgesGeometry`) |
| **Animations** | GSAP 3 (ScrollTrigger, Ticker sync) |
| **Smooth Scroll** | Lenis synced with GSAP ticker loop |
| **Icons** | Lucide React |

---

## 🚀 How to Run Locally

1. **Install dependencies**:
   ```powershell
   npm.cmd install
   ```

2. **Start development server**:
   ```powershell
   npm.cmd run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

3. **Build for production**:
   ```powershell
   npm.cmd run build
   ```

4. **Run production server**:
   ```powershell
   npm.cmd start
   ```

---

## 🌐 1-Click Deployment to Vercel

1. Push this repository to your GitHub account (`github.com/zihanfakir/...`).
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Keep default settings (`Next.js` framework preset).
4. Click **Deploy**.

---

© 2026 Zihan Fakir. All rights reserved.
