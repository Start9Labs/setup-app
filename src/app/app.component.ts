import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Storage } from '@ionic/storage';
import { SessionDirective } from 'components/session';
import { DashboardPage } from 'pages/dashboard/dashboard';

@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
})
export class AppComponent {
  @ViewChild(Nav) nav: Nav
  rootPage: any

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private session: SessionDirective
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      const torAddress = await this.storage.get("torAddress")
      if(torAddress){
        this.session.torAddress = torAddress
        this.rootPage = DashboardPage
      } else {
        this.rootPage = SetupPage
      }

      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}

// setup mode : we don't have anything. No tor address, not connected to start9 ssid
//
