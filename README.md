# Start9 Companion App

## Setup Instructions

**Make sure you have git, node, and npm installed**

`npm i -g @ionic/cli cordova`

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

Follow instructions here: `https://www.joshmorony.com/deploying-capacitor-applications-to-android-development-distribution/`

Upload to Google Play Developer Console.
