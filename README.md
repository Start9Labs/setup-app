# Start9 Companion App

## Setup Instructions

**Make sure you have git, node, and npm installed**

`npm i -g ionic cordova`

`git clone https://github.com/Start9Labs/companion-app.git`

`cd companion-app`

`npm i`

`ionic serve`

## Building for iOS
https://ionicframework.com/docs/installation/ios

`ionic cordova build ios`

## Building for Android
https://ionicframework.com/docs/installation/android

`ionic cordova build android`

## Android deployment

build release apk:

`ionic cordova build android --prod --release`

use jarsigner to sign release apk:

`jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore start9-companion-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk start9-companion`

use zipalign to optimize package:

`~/Library/android/sdk/build-tools/29.0.2/zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk ../start9-companion.apk`