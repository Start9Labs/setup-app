import { Component, OnInit } from '@angular/core'

declare var WifiWizard2: any

@Component({
  selector: 'page-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
})
export class SetupPage implements OnInit {
  readonly defaultRouterIp: '192.168.12.1'
  readonly nodeSetupPort: 1776
  public network: any

  constructor () { }

  async ngOnInit () {
    try {
      this.network = await WifiWizard2.getConnectedSSID()
    } catch (e) {
      console.error(e)
    }
  }
}
