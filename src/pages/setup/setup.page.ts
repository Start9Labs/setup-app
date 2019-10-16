import { Component, OnInit } from '@angular/core';

declare var WifiWizard2: any;

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.page.html',
  styleUrls: ['./wifi.page.scss'],
})
export class WifiPage implements OnInit {
  readonly defaultRouterIp: "192.168.0.1"
  readonly nodeSetupPort: 1776
  private network: any
  private secondNetwork: any

  constructor() { }

  async ngOnInit() {
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
