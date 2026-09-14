# Cadence

**Duolingo for speaking** — a 2-minute daily prompt that makes you sharper before the interview, the meeting, or the camera.

**Version: 1.0.0**

## Start here

Cadence is a website. No Expo Go, no Xcode.

```bash
cd ~/Projects/cadence
npm install
npm start
```

Open **http://localhost:8081** in Chrome or Edge. Allow the mic.

To put it on the internet: `npx vercel`

More detail: **[RUN.md](./RUN.md)**

## What’s in v1

- Onboarding (name, goal, reminder)
- Today ritual → Speak / Prep 2 / Prep 5
- Live speech recognition + transcript
- Local coaching: WPM, fillers, repeats, vocab upgrades, scores
- Stats, Routine, Prompt library
- Streaks + XP persisted on device

## Stack

Expo SDK 57 (web) · Expo Router · TypeScript · Zustand
