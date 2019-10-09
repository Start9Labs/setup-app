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
      const scanned = await WifiWizard2.scan()
      console.log(scanned)
      const enabled = await WifiWizard2.isWifiEnabled()
      console.log(enabled)
      const listed = await WifiWizard2.listNetworks()
      console.log(listed)
    } catch (e) {
      console.error(e)
    }
  }
}
