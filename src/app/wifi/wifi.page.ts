import { Component, OnInit } from '@angular/core';

declare var WifiWizard2: any;

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.page.html',
  styleUrls: ['./wifi.page.scss'],
})
export class WifiPage implements OnInit {

  constructor() { }

  async ngOnInit() {
    try {

      const x1 = await WifiWizard2.listNetworks()
      console.log(`listNetworks ${x1}`)
      const x2 = await WifiWizard2.getConnectedSSID()
      console.log(`getConnectedSSID ${x2}`)
      const x3 = await WifiWizard2.getConnectedNetworkID()
      console.log(`getConnectedNetworkID ${x3}`)
      const x4 = await WifiWizard2.requestPermission()
      console.log(`requestPermission ${x4}`)
      const x5 = await WifiWizard2.scan()
      console.log(`scan ${x5}`)
      const x6 = await WifiWizard2.isWifiEnabled()
      console.log(`isWifiEnabled ${x6}`)

    } catch (e) {
      console.error(e)
    }
  }
}
