import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home',
    },
    {
      title: 'List',
      url: '/list',
      icon: 'list',
    },
    {
      title: 'Setup',
      url: '/setup',
      icon: 'construct',
    },
  ]

  constructor (
    platform: Platform,
    splashScreen: SplashScreen,
    statusBar: StatusBar,
  ) {
    platform.ready().then(async () => {
      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // style status bar for iOS and Android
        if (platform.is('ios')) {
          statusBar.styleDefault()
        } else {
          statusBar.styleLightContent()
        }
        splashScreen.hide()
      }
    })
  }
}
