import { Component, Input } from '@angular/core'
import { AppHealthStatus } from 'src/app/models/s9-app'

@Component({
  selector: 's9-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() serverUpdating: boolean
  @Input() status: AppHealthStatus
  color: string

  constructor () { }

  ngOnChanges () {
    if (!this.serverUpdating) {
      switch (this.status) {
        case AppHealthStatus.UNKNOWN:
          this.color = 'dark'
          break
        case AppHealthStatus.RUNNING:
          this.color = 'success'
          break
        case AppHealthStatus.UNREACHABLE:
        case AppHealthStatus.STOPPED:
          this.color = 'danger'
          break
        default:
          this.color = 'dark'
      }
    }
  }
}
