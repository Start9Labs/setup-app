import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Storage } from '@ionic/storage'
import { SessionStore } from './components/session'

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
    private readonly platform: Platform,
    private readonly splashScreen: SplashScreen,
    private readonly statusBar: StatusBar,
  ) {
    this.initializeApp()
  }

  initializeApp () {
    this.platform.ready().then(async () => {
      this.statusBar.styleDefault()
      this.splashScreen.hide()
    })
  }
}
