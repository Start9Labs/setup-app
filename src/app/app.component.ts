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
      icon: 'setup',
    },
  ]

  constructor (
    public platform: Platform,
    public splashScreen: SplashScreen,
    public statusBar: StatusBar,
    public storage: Storage,
    public session: SessionStore,
  ) {
    this.initializeApp()
  }

  initializeApp () {
    this.platform.ready().then(async () => {
      // load session data into memory
      await this.extractFromStorage()

      this.statusBar.styleDefault()
      this.splashScreen.hide()
    })
  }

  async extractFromStorage () {
    const session = await this.storage.get('session')
  }
}
