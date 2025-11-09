# Start Buddy - Project Summary

## ✅ Completed Features (P0 - MVP)

### Core Loop
1. **Task Capture (Quick Add)** ✅
   - Input one task in ≤10s
   - Press Enter to create
   - Task appears as "Task of the Moment"

2. **AI Breakdown (3–5 micro-steps)** ✅
   - LLM returns JSON steps (≤2 min each)
   - Editable list with add/delete/rename/reorder
   - Save functionality

3. **Deterministic Fallback** ✅
   - Universal template if LLM fails
   - Works when network fails

4. **Focus Session (One-step view)** ✅
   - Big timer buttons (5/10/15, + 2-min micro)
   - Shows only current step
   - Timer runs and persists if tab changes

5. **"I'm Stuck"** ✅
   - Two branches: Too big (auto micro-split), Low energy (2-min rescue)
   - Returns to session in ≤2 clicks

6. **Complete Step → Next** ✅
   - Soft celebration
   - Prompt to continue or stop
   - Progress persists across reloads

### Data & Personalization
7. **Local Persistence** ✅
   - Tasks/steps/sessions saved to localStorage
   - Zustand with persist middleware

8. **Activation Difficulty Score (ADS v1)** ✅
   - Computes score from signals (time-to-start, stuck count, abandon)
   - UI bias: suggests 2-min first step when high

### UX & Accessibility
9. **Calm Copy / No-shame Language** ✅
   - Microcopy library (encouraging, neutral)

10. **Keyboard-first Flow & a11y** ✅
    - Enter to add, Space to start/pause
    - Focus outlines, ARIA labels

11. **Mobile-responsive PWA** ✅
    - Works on phone screens
    - Install prompt ready (needs icons)

### Privacy & Safety
12. **Privacy First** ✅
    - No third-party analytics
    - "Export / Delete all data" buttons

13. **LLM Guardrails** ✅
    - JSON schema validation
    - Profanity/unsafe filter in prompts
    - Server-side keys

## 📁 Project Structure

```
Start_Buddy/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── breakdown/
│   │   │       └── route.ts          # AI breakdown API
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Main page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── TaskCapture.tsx           # Quick add task
│   │   ├── AIBreakdown.tsx           # AI step generation
│   │   ├── StepList.tsx              # Editable step list
│   │   ├── FocusSession.tsx          # Timer component
│   │   ├── StuckModal.tsx            # "I'm Stuck" feature
│   │   ├── PrivacyControls.tsx       # Export/Delete data
│   │   └── ui/                       # shadcn/ui components
│   └── lib/
│       ├── schemas.ts                # Zod schemas
│       ├── store.ts                  # Zustand store
│       ├── utils.ts                  # Utilities
│       └── calm-copy.ts              # Calm copy library
├── public/
│   └── manifest.json                 # PWA manifest
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 Getting Started

1. **Install dependencies:**
```bash
yarn install
```

2. **Set up environment (optional):**
```bash
# Create .env.local
OPENAI_API_KEY=your_key_here
```

3. **Run development server:**
```bash
yarn dev
```

4. **Open browser:**
Navigate to http://localhost:3000

## 🔧 Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Framer Motion** (animations)
- **Zustand** (state management with localStorage)
- **Zod** (validation)
- **OpenAI API** (optional - fallback available)

## 📊 Data Model

- **Task**: {id, title, category?, user_hard_tag?, status, created_at, ads_score?}
- **Step**: {id, task_id, text, duration_min (1|2), status, order}
- **Session**: {id, task_id, step_id, timer_min, started_at, ended_at?, stuck_used, completed}
- **Stats**: {task_id, tts_ms?, stuck_count, abandoned_count, carryovers, ads_score}

## 🎯 Key Features

### AI Breakdown
- Calls `/api/breakdown` endpoint
- Uses OpenAI GPT-4o-mini (or fallback template)
- Returns 3-5 micro-steps (1-2 min each)
- Validates response with Zod schema

### Focus Timer
- Supports 2/5/10/15 minute sessions
- Persists across tab changes
- Handles visibility changes
- Shows one step at a time

### "I'm Stuck" Feature
- **Too Big**: Splits step into 3 micro-steps
- **Low Energy**: Creates 2-minute rescue step
- Updates current step automatically

### Activation Difficulty Score (ADS)
- Calculated from:
  - Time-to-start (max 40 points)
  - Stuck count (max 30 points)
  - Abandoned count (max 20 points)
  - Carryovers (max 10 points)
- UI bias: suggests 2-min steps when ADS is high

## 🔒 Privacy & Security

- No third-party analytics
- All data stored locally (localStorage)
- Export/Delete data buttons
- API keys server-side only
- Rate limiting on API endpoints
- Input validation and sanitization

## 📱 PWA Support

- Manifest.json configured
- Mobile-responsive design
- Install prompt ready
- **Note**: Add icons (`icon-192.png`, `icon-512.png`) to complete setup

## 🧪 Testing Checklist

- ✅ Add → AI steps → edit → start timer → mark done → celebration → persists on reload
- ✅ LLM down? Fallback steps appear
- ✅ Hitting "I'm Stuck" returns to a new smaller step in ≤30s
- ✅ ADS high? UI defaults to 2-min starter
- ✅ "Delete all" wipes local & server records

## 🚧 Future Enhancements (P1/P2)

See original specification for:
- Category hints
- Energy/Time insights
- Routine builder
- Body-double timer
- Micro-wins log + streak
- Badges
- Coach/Therapist report
- Calendar/Email hooks
- Adaptive scheduling
- Offline-first sync
- Account/Auth

## 📝 Notes

- Timer logic handles tab backgrounding
- Data persists across reloads
- Fallback template works without API key
- All components are keyboard accessible
- Mobile-responsive with Tailwind breakpoints

## 🐛 Known Issues

- Timer resume logic could be improved (currently resets on page reload)
- PWA icons need to be added
- No error boundary yet (would be good to add)

## 📄 License

MIT

