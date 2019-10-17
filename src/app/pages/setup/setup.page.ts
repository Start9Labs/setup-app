import { Component, OnInit } from '@angular/core'

declare var WifiWizard2: any

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
})
export class SetupPage implements OnInit {
  readonly defaultRouterIp: '192.168.0.1'
  readonly nodeSetupPort: 1776
  public network: any
  public secondNetwork: any

  constructor () { }

  async ngOnInit () {
    try {
      const x2 = await WifiWizard2.getConnectedSSID()
      const x3 = await WifiWizard2.getConnectedBSSID()
      this.network = x2
      this.secondNetwork = x3
    } catch (e) {
      console.error(e)
    }
  }
}
