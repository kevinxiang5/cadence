# Cadence — run it in Xcode

The iOS project is already generated. Open this file in Xcode:

`ios/Cadence.xcworkspace`

(not the `.xcodeproj`)

---

## First time on this Mac

Xcode is downloading the **iOS 26.5 Simulator** (about 8.5 GB). Let that finish — the laptop will get warm. You only do this once.

To open the project again later:

```bash
cd ~/Projects/cadence
npm run ios:xcode
```

---

## In Xcode

1. Plug in your iPhone **or** wait for a simulator to appear in the device list
2. **Signing & Capabilities** → Team → add your Apple ID (free) and select it
3. Hit **Run** (the play button)

If Xcode asks to trust the developer on your iPhone: Settings → General → VPN & Device Management → trust.

Allow **Microphone** and **Speech Recognition** when the app asks.

---

## Keep Metro running

In a second Terminal tab:

```bash
cd ~/Projects/cadence
npm start
```

Leave that running while the app is open.

---

## If the workspace is missing again

```bash
cd ~/Projects/cadence
npm run ios:xcode
```

That installs CocoaPods locally (no Homebrew compile) and reopens Xcode.
