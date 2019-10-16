import { Component } from '@angular/core'
import { SessionDirective } from 'src/components/session'

@Component({
  selector: 'dashboard-page',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage {
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
      title: 'Wifi',
      url: '/wifi',
      icon: 'home',
    },
  ]

  private isLoading = true
  private isConnected = false

  constructor (
    private session: SessionDirective,
  ) { }

  async ngOnInit () {
      if (await testTorConnection(this.session.torAddress)) {
        this.isConnected = true
      } else {
        // fuck. something is wrong, we have the tor address but can't contact server.
      }

      this.isLoading = false

  }
}

async function testTorConnection (address : string): Promise<boolean> {
  return true
}
