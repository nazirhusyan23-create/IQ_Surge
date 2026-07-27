# IQ Surge — Android App (Capacitor)

This is a complete, production-ready Android Studio / Gradle project generated from your
original single-file `index.html` game. The game itself (HTML/CSS/JS) was extracted into
`www/` and wrapped as a native Android app using [Capacitor](https://capacitorjs.com/).

- **Package ID:** `com.iqsurge.app`
- **Min SDK:** 24 (Android 7.0 Nougat) — matches your "Android 7+" requirement
- **Target/Compile SDK:** 36 (latest)
- **ABIs:** `armeabi-v7a`, `arm64-v8a`
- **No Google Play Services dependency** — installs and runs fine on Amazon Fire tablets,
  sideloaded APKs, and any Android 7+ device, in addition to Google Play.

---

## Project structure

```
IQSurge/
├── package.json                  # npm deps: @capacitor/core, /android, /cli, etc.
├── capacitor.config.ts           # Capacitor app config (appId, splash, status bar...)
├── www/                          # The actual game (extracted from your index.html)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js                 # game logic + AdMob integration hooks
├── android/                      # Native Android Gradle project
│   ├── app/
│   │   ├── build.gradle
│   │   ├── proguard-rules.pro
│   │   ├── keystore.properties   # TEST-ONLY signing config (see below)
│   │   ├── release.keystore      # TEST-ONLY keystore (see below)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/iqsurge/app/MainActivity.java
│   │       ├── assets/capacitor.config.json
│   │       └── res/              # icons, splash screen, strings, network config
│   ├── build.gradle, settings.gradle, variables.gradle, gradle.properties
│   └── gradlew / gradlew.bat / gradle/wrapper/gradle-wrapper.properties
└── .github/workflows/android.yml # CI: builds & uploads a release APK automatically
```

---

## Building locally

You'll need Node.js 22+ and a JDK 21 installed.

```bash
npm install
npx cap sync android
cd android
./gradlew assembleRelease     # -> android/app/build/outputs/apk/release/app-release.apk
./gradlew assembleDebug       # -> android/app/build/outputs/apk/debug/app-debug.apk
```

> **First build note:** this repo ships `gradlew`/`gradlew.bat` and a pinned
> `gradle-wrapper.properties` (Gradle 8.14.3), but not the binary
> `gradle-wrapper.jar` (binaries can't be authored directly). The very first time you
> build, run this once from the `android/` folder if `./gradlew` complains it's missing:
> ```bash
> gradle wrapper --gradle-version 8.14.3
> ```
> (Requires Gradle installed locally just for that one command — e.g. `brew install gradle`,
> `sdk install gradle`, or `apt install gradle`.) After that, `./gradlew` is fully
> self-contained. **The GitHub Actions workflow below does this automatically for you**,
> so if you'd rather not install Gradle locally, just push to GitHub and download the
> built APK from the Actions tab.

You can also just open the `android/` folder in Android Studio (Otter 2025.2.1+) and click
Run — Android Studio will handle the wrapper generation itself on first sync.

---

## GitHub Actions (automatic builds)

`.github/workflows/android.yml` runs on every push and pull request to `main`/`master`, and
can also be triggered manually from the Actions tab. It:

1. Installs Node + JDK 21
2. Runs `npm install` and `npx cap sync android`
3. Generates the Gradle wrapper (Gradle 8.14.3)
4. Builds a **signed release APK** and a debug APK
5. Uploads both as workflow artifacts (`iq-surge-release-apk`, `iq-surge-debug-apk`) —
   downloadable from the Actions run summary page, no Play/Amazon account needed to get an
   installable file.

To use it: push this project to a GitHub repository, then check the **Actions** tab.

---

## ⚠️ About the included keystore — read before publishing

`android/keystore.properties` and `android/release.keystore` are a **test-only** signing
key generated so `./gradlew assembleRelease` works immediately with zero setup, and so the
CI workflow always produces an installable, signed APK even before you configure secrets.

**Do not use this keystore to publish to Google Play or the Amazon Appstore.** It's a
generic, publicly-known key (anyone who has this project has it) — using it in production
would let anyone else sign "updates" to your app.

Both `android/keystore.properties` and `android/*.keystore` are already listed in
`.gitignore`, so if you push this project to your own git repo, your local test keystore
stays local (or you can just leave it — it's fine for local testing, just not for a store
listing).

### Before your first real release:

1. **Generate your own private release keystore** (keep it somewhere safe — losing it means
   you can never update your app again under the same listing):
   ```bash
   keytool -genkeypair -v -keystore my-release.keystore -alias mykeyalias \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Replace `android/keystore.properties` with your own `storeFile` / `storePassword` /
   `keyAlias` / `keyPassword`, and put `my-release.keystore` in `android/`.
3. For CI signing, don't commit the real keystore. Instead add these **repository secrets**
   (Settings → Secrets and variables → Actions):
   - `ANDROID_KEYSTORE_BASE64` — output of `base64 -w0 my-release.keystore`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

   The workflow automatically detects and uses these instead of the throwaway keystore once
   they're present.

---

## Publishing to Google Play

1. Build a signed **App Bundle** instead of an APK for Play Store submission:
   ```bash
   cd android && ./gradlew bundleRelease
   # -> android/app/build/outputs/bundle/release/app-release.aab
   ```
2. Create an app listing in the [Play Console](https://play.google.com/console), upload the
   `.aab`, fill in the store listing, content rating, and privacy policy, and submit for
   review.

## Publishing to the Amazon Appstore

1. Use the release **APK** built by `./gradlew assembleRelease` (Amazon Appstore accepts APKs
   directly; AAB support also exists but APK is the simplest path).
2. Create a developer account at [developer.amazon.com](https://developer.amazon.com/), add a
   new Android app, and upload the APK from `android/app/build/outputs/apk/release/`.
3. Because this project has **no Google Play Services / Play Store dependency**, it installs
   and runs correctly on Fire tablets and other non-Google-certified Android devices without
   any changes.

---

## AdMob

Your original HTML already contained placeholder AdMob wiring (`AdManager` in
`www/js/app.js`) written against the `admob-plus` plugin API (`window.admob`), with real ad
unit IDs already in place. It no-ops safely if the native plugin isn't installed. To make ads
actually serve in the native app:

```bash
npm install admob-plus-cordova admob-plus-capacitor
npx cap sync android
```

Then add your AdMob App ID to `android/app/src/main/AndroidManifest.xml` inside
`<application>` as required by that plugin's docs (a `com.google.android.gms.ads.APPLICATION_ID`
`<meta-data>` tag). No other code changes are needed — `AdManager.initialize()` is already
wired up to run on app start.

---

## App icon & splash screen

Placeholder launcher icons (legacy + adaptive, all densities) and a splash screen were
generated to match your game's purple-to-teal (`#6c5ce7` → `#00d9c0`) dark theme. To replace
them with your own artwork later, the easiest path is the
[`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) tool:

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

Drop a 1024×1024 `resources/icon.png` and a 2732×2732 `resources/splash.png` in first (an
empty `resources/` folder is already included) and re-run the command above.

---

## What's still simulated / worth reviewing

- The AdMob ad unit IDs already in your original HTML are used as-is; verify they belong to
  your own AdMob account before shipping.
- The placeholder keystore/icons/splash above are meant to make the project build and run
  immediately — swap them for your real assets/keys before a public store release.
