import { Component, OnInit } from '@angular/core';

declare var WifiWizard2: any;

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.page.html',
  styleUrls: ['./wifi.page.scss'],
})
export class WifiPage implements OnInit {

  constructor() { }

  ngOnInit() {
    WifiWizard2.startScan((stuff) => {
      console.log(stuff)
    }, (errorStuff) => {
      console.error(errorStuff)
    });
  }
}
