import { Component } from '@angular/core'
import { AppState, Device } from '../../app-state'
import { Observable } from 'rxjs'

@Component({
  selector: 'page-device-list',
  templateUrl: './device-list.page.html',
  styleUrls: ['./device-list.page.scss'],
})
export class DeviceListPage {
  devices$: Observable<Device[]>

  constructor (
    private readonly appState: AppState,
  ) { }

  ngOnInit ( ) {
    this.devices$ = this.appState.watchDevices()
  }
}
