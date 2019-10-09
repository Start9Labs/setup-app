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
      WifiWizard2.listNetworks().then(console.log).catch(console.error)
      WifiWizard2.getConnectedSSID().then(console.log).catch(console.error)
      WifiWizard2.getConnectedNetworkID().then(console.log).catch(console.error)

      WifiWizard2.requestPermission().then(p => {
        console.log(p)
        WifiWizard2.scan().then(console.log).catch(console.error)
      })

      WifiWizard2.isWifiEnabled().then(console.log).catch(console.error)
    } catch (e) {
      console.error(e)
    }
  }
}
