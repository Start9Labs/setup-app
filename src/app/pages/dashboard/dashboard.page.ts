import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Storage } from '@ionic/storage';
import { SessionDirective } from 'src/app/components/session';

@Component({
  selector: 'dashboard-page',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss']
})
export class DashboardPage {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'List',
      url: '/list',
      icon: 'list'
    },
    {
      title: 'Wifi',
      url: '/wifi',
      icon: 'home'
    }
  ];

  private isLoading: boolean = true
  private isConnected: boolean = false

  constructor(
    private session: SessionDirective
  ) {}

  async ngOnInit() {
      if (await testTorConnection(this.session.torAddress)){
        this.isConnected = true
      } else {
        // fuck. something is wrong, we have the tor address but can't contact server.
      }

      this.isLoading = false

  }
}

async function testTorConnection(address : string): Promise<boolean> {
  return true
}
