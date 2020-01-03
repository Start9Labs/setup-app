import { Component, Input } from '@angular/core'
import { AppHealthStatus } from 'src/app/models/s9-app'

@Component({
  selector: 's9-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() status: AppHealthStatus
  color: string
  display: string

  constructor () { }

  ngOnChanges () {
    switch (this.status) {
      case AppHealthStatus.UNKNOWN:
      case AppHealthStatus.REMOVING:
      case AppHealthStatus.RESTARTING:
        this.display = 'Connecting'
        this.color = 'dark'
        break
      case AppHealthStatus.NEEDS_CONFIG:
        this.display = 'Needs Config'
        this.color = 'warning'
        break
      case AppHealthStatus.RUNNING:
        this.display = 'Running'
        this.color = 'success'
        break
      case AppHealthStatus.UNREACHABLE:
        this.display = 'Unreachable'
        this.color = 'danger'
        break
      case AppHealthStatus.STOPPED:
        this.display = 'Stopped'
        this.color = 'danger'
        break
      case AppHealthStatus.INSTALLING:
        this.display = 'Installing'
        this.color = 'warning'
        break
      case AppHealthStatus.INSTALL_FAILED:
        this.display = 'Install Failed'
        this.color = 'danger'
        break
      case AppHealthStatus.UPDATING:
        this.display = 'Updating'
        this.color = 'warning'
        break
      case AppHealthStatus.DEAD:
        this.display = 'Dead'
        this.color = 'danger'
        break
      default:
        this.color = 'dark'
    }
  }
}
