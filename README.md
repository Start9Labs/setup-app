# Setup App

A cross-platform app for setting up a Start9 Embassy personal server. Currently available on [iOS](https://apps.apple.com/us/app/id1528125889) and [Android](https://play.google.com/store/apps/details?id=com.start9labs.setup).

## Contributing

Pull requests are welcome! Please follow the instructions below to get started.

### Development Environment

**Make sure you have git, node, and npm installed**

`npm i -g @ionic/cli cordova`

`git clone https://github.com/Start9Labs/setup-app.git`

`cd setup-app`

`npm i`

In `src/app/config.ts`, set all mocks to `true`

`ionic serve`

This launches the development server in your default browser with automatic reload enabled.

### Building to device
https://capacitor.ionicframework.com/docs/basics/building-your-app/
