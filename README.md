# Start9 Companion App

## Setup Instructions

**Make sure you have git, node, and npm installed**

`npm i -g ionic cordova`

`git clone https://github.com/Start9Labs/companion-app.git`

`cd companion-app`

`npm i`

`ionic serve`

## Building
https://capacitor.ionicframework.com/docs/basics/building-your-app/

## Android deployment

build release apk:

`ionic build --prod --release`

`npx cap copy android`

use jarsigner to sign release apk:

`jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore start9-companion-release-key.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk start9-companion`

use zipalign to optimize package:

`~/Library/android/sdk/build-tools/29.0.2/zipalign -v 4 android/app/build/outputs/apk/release/app-release-unsigned.apk ../start9-companion.apk`

add "-[SEM version]" to end of apk name.

Upload to Google Play Developer Console.
