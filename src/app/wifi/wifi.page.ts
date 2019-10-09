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
      const listed = WifiWizard2.listNetworks().then(console.log).catch(console.error)
      const scanned = WifiWizard2.scan().then(console.log).catch(console.error)
      const enabled = WifiWizard2.isWifiEnabled().then(console.log).catch(console.error)
    } catch (e) {
      console.error(e)
    }
  }
}
