import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { DataService } from './services/data-service'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { LANService } from './services/lan-service'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    public platform: Platform,
    public splashScreen: SplashScreen,
    public statusBar: StatusBar,
    public dataService: DataService,
    public LANService: LANService,
  ) {
    document.body.classList.toggle('dark', true)
    platform.ready().then(async () => {
      // load data into memory
      await this.dataService.load()

      // mocky mock
      if (!this.dataService.servers.length) {
        await this.dataService.saveServer({
          secret: '1234abcd',
          SID: 'start9-abcd',
          friendlyName: 'My First Server',
          zeroconfHostname: 'start9-abcd.local',
          torAddress: 'hgfjandkhasjdbfkljamxjkasbnc.onion',
          ipAddress: 'lalalalalala',
          connected: true,
        })
      }

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        this.LANService.watch()
        // style status bar for iOS and Android
        if (platform.is('ios')) {
          statusBar.styleDefault()
        } else {
          statusBar.styleLightContent()
        }
        setTimeout(() => {
          this.splashScreen.hide()
        }, 300)
      }
    })
  }
}
