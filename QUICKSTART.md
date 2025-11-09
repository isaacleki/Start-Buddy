# Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
yarn install
```

2. **Set up environment variables (optional):**
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note:** If you don't provide an OpenAI API key, the app will use a fallback template for step generation. This works perfectly fine for testing!

3. **Run the development server:**
```bash
yarn dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Add a task** - Type your task in the input field and press Enter
2. **Wait for breakdown** - The AI will generate 3-5 micro-steps (or use the fallback template)
3. **Edit steps** - Customize, reorder, or add steps as needed
4. **Start focus session** - Choose a duration (2/5/10/15 min) and start the timer
5. **Complete steps** - Mark complete to move to the next step
6. **Use "I'm Stuck"** - If stuck, choose "Too big" or "Low energy" for help

## Features to Test

### Core Loop
- ✅ Quick add task (≤10s)
- ✅ AI breakdown with fallback
- ✅ Editable step list
- ✅ Focus timer (persists if tab changes)
- ✅ "I'm Stuck" feature
- ✅ Step completion flow

### Data & Persistence
- ✅ Local storage (persists across reloads)
- ✅ Activation Difficulty Score (ADS)
- ✅ Export/Delete data

### UX & Accessibility
- ✅ Keyboard-first flow (Enter to add, Space to pause)
- ✅ Mobile-responsive
- ✅ Calm, encouraging copy

## Troubleshooting

### Timer not working
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

### Steps not generating
- Check if OPENAI_API_KEY is set (optional)
- Check browser console for API errors
- Fallback template should still work

### Data not persisting
- Check browser localStorage (DevTools → Application → Local Storage)
- Ensure cookies/localStorage are enabled
- Try exporting data to verify it's being saved

## Next Steps

1. Add PWA icons (`icon-192.png` and `icon-512.png`) to `public/` directory
2. Customize the calm copy in `src/lib/calm-copy.ts`
3. Adjust ADS calculation in `src/lib/utils.ts`
4. Deploy to Vercel or your preferred hosting platform

## Building for Production

```bash
yarn build
yarn start
```

## Deployment

The app is ready to deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Make sure to set `OPENAI_API_KEY` in your Vercel environment variables!

