# Cadence v1.0.0 — how to run the app

**Cadence is a real mobile app** (Expo / React Native), version **1.0.0**  
iOS build **1** · Android versionCode **1**

Live speaking uses `expo-speech-recognition`, which needs a **native build**.  
It will **not** fully work inside Expo Go.

---

## What you need to do (Kevin)

### Option A — Phone app (recommended)

1. **Create a free Expo account** → https://expo.dev/signup  
2. In a terminal:

```bash
cd "c:\Users\good\Desktop\New folder (6)\cadence"
npm install
npx eas-cli login
npx eas init
```

3. Build a installable app:

**Android (easiest on Windows):**
```bash
npm run build:dev:android
```
When the build finishes, open the Expo link → download the APK → install on your phone.

**iPhone:**
- You need an Apple Developer account ($99/year) for a device build
- Then: `npm run build:dev:ios`
- Install via the Expo QR / TestFlight link EAS gives you

4. After install, start Metro and open Cadence:
```bash
npx expo start --dev-client
```
Scan the QR code with the Cadence app you just installed (not Expo Go).

5. Allow **Microphone** + **Speech Recognition** when prompted.

---

### Option B — Browser (fastest to try coaching)

```bash
cd "c:\Users\good\Desktop\New folder (6)\cadence"
npm install
npx expo start --web
```

Open **http://localhost:8081 in Chrome or Edge** (not Cursor’s Simple Browser).  
Allow the mic → Speak now → talk → Stop & analyze.

---

### Option C — Demo with no mic

In the app: **Speak now → “No mic? Try a demo sample” → Messy first take → Save**

---

## What I already set up for v1

| Item | Value |
|------|--------|
| App name | Cadence |
| Version | **1.0.0** |
| iOS buildNumber | **1** |
| Android versionCode | **1** |
| Bundle / package | `com.cadence.speak` |
| Icon / splash | Branded teal “C” |
| Mic + speech permissions | Configured |
| Daily reminder notifications | Configured |
| EAS profiles | development / preview / production |

---

## Daily habit after it’s installed

1. Open Cadence  
2. Speak today’s prompt (or prep 2–5 min first)  
3. Get fillers / WPM / upgrades  
4. Save → streak + XP update  

That’s the whole product.
