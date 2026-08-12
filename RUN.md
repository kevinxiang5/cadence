# Cadence v1.0.0 — how to run the app

**Cadence is a real mobile app** (Expo / React Native), version **1.0.0**  
iOS build **1** · Android versionCode **1**

Live speaking uses `expo-speech-recognition`, which needs a **native build**.  
It will **not** fully work inside Expo Go.

---

## Mac / Xcode (what to run now)

CocoaPods Homebrew auto-install is skipped. Use `--no-install`, then install pods yourself.

In **Terminal** from the repo folder:

```bash
cd ~/Desktop/cadence
git pull
npm install

# confirm CocoaPods works (ignore uuid deprecation warnings)
pod --version

# generate iOS project WITHOUT Homebrew
npx expo prebuild --platform ios --no-install

# install native iOS deps
cd ios
pod install
cd ..

open ios/*.xcworkspace
```

Then in **Xcode**:
1. Pick a simulator, **or** plug in your iPhone and pick it
2. Signing & Capabilities → select **your Apple team** (needed for a real phone)
3. Hit **Run**
4. In a second Terminal tab, keep Metro running:

```bash
cd ~/Desktop/cadence
npx expo start
```

5. On the phone/simulator, allow **Microphone** + **Speech Recognition**

Speech recognition is much more reliable on a **real iPhone** than the simulator.

If `prebuild` left a half-broken `ios/` folder, wipe it and retry:

```bash
rm -rf ios
npx expo prebuild --platform ios --no-install
cd ios && pod install && cd ..
open ios/*.xcworkspace
```

Shortcut after CocoaPods is already installed:

```bash
npx expo run:ios
```

---

## Option A — Phone app via EAS (cloud build)

1. **Create a free Expo account** → https://expo.dev/signup  
2. In a terminal:

```bash
cd cadence
npm install
npx eas-cli login
npx eas init
```

3. Build:

**Android:**
```bash
npm run build:dev:android
```

**iPhone:**
- Apple Developer account ($99/year) for a device build
- Then: `npm run build:dev:ios`

4. After install:
```bash
npx expo start --dev-client
```

5. Allow **Microphone** + **Speech Recognition**.

---

## Option B — Browser (fastest to try coaching)

```bash
cd cadence
npm install
npx expo start --web
```

Open **http://localhost:8081 in Chrome or Edge**.  
Allow the mic → Speak now → talk → Stop & analyze.

---

## Option C — Demo with no mic

**Speak now → “No mic? Try a demo sample” → Messy first take → Save**

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
