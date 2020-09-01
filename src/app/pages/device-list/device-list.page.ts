import { Component } from '@angular/core'
import { Store, Device } from '../../store'
import { Observable } from 'rxjs'

@Component({
  selector: 'device-list',
  templateUrl: './device-list.page.html',
  styleUrls: ['./device-list.page.scss'],
})
export class DeviceListPage {
  devices$: Observable<Device[]>

  constructor (
    private readonly store: Store,
  ) { }

  ngOnInit ( ) {
    this.devices$ = this.store.watchDevices()
  }
}
