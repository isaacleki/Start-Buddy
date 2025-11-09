# Start Buddy

A task focus app that breaks down tasks into micro-steps and helps you focus on one at a time.

## Features

### P0 - MVP (Must-have)

- ✅ **Task Capture** - Quick add task in ≤10s
- ✅ **AI Breakdown** - LLM generates 3-5 micro-steps (≤2 min each)
- ✅ **Deterministic Fallback** - Universal template if LLM fails
- ✅ **Focus Session** - Timer with one-step view (5/10/15 min + 2-min micro)
- ✅ **"I'm Stuck"** - Two branches: Too big (auto micro-split), Low energy (2-min rescue)
- ✅ **Complete Step → Next** - Soft celebration; progress persists
- ✅ **Local Persistence** - Tasks/steps/sessions saved to localStorage
- ✅ **Activation Difficulty Score (ADS)** - Computes score from signals
- ✅ **Calm Copy** - Encouraging, neutral, no-shame language
- ✅ **Keyboard-first Flow** - Enter to add, Space to start/pause; a11y support
- ✅ **Mobile-responsive PWA** - Works on phone screens
- ✅ **Privacy First** - No third-party analytics; Export/Delete data buttons
- ✅ **LLM Guardrails** - JSON schema validation; server-side keys

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn (package manager)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
yarn install
```

3. Create a `.env.local` file (optional - for AI breakdown):
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Framer Motion** (animations)
- **Zustand** (state management with localStorage persistence)
- **Zod** (validation)
- **OpenAI API** (AI breakdown - optional)

## Project Structure

```
src/
  app/
    api/
      breakdown/     # AI breakdown API route
    layout.tsx       # Root layout
    page.tsx         # Main page
  components/
    TaskCapture.tsx  # Quick add task input
    AIBreakdown.tsx  # AI step generation
    StepList.tsx     # Editable step list
    FocusSession.tsx # Timer component
    StuckModal.tsx   # "I'm Stuck" feature
    PrivacyControls.tsx # Export/Delete data
    ui/              # shadcn/ui components
  lib/
    schemas.ts       # Zod schemas
    store.ts         # Zustand store
    utils.ts         # Utilities
    calm-copy.ts     # Calm copy library
```

## Usage

1. **Add a task** - Type your task and press Enter
2. **Wait for breakdown** - AI generates micro-steps (or uses fallback)
3. **Edit steps** - Customize, reorder, or add steps as needed
4. **Start focus session** - Choose duration (2/5/10/15 min) and start timer
5. **Complete steps** - Mark complete to move to next step
6. **Use "I'm Stuck"** - If stuck, choose "Too big" or "Low energy" for help

## Privacy

- No third-party analytics
- All data stored locally (localStorage)
- Export/Delete data buttons available
- API keys server-side only

## PWA Setup

The app is PWA-ready. To complete the setup:

1. Add app icons (`icon-192.png` and `icon-512.png`) to the `public/` directory
2. The manifest.json is already configured
3. Install prompt will appear on supported browsers

## Notes

- If `OPENAI_API_KEY` is not set, the app will use a fallback template for step generation
- All data is stored in localStorage and persists across reloads
- Timer continues running even if the tab is backgrounded

## License

MIT

