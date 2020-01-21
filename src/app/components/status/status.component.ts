import { Component, Input } from '@angular/core'
import { AppHealthStatus } from 'src/app/models/app-model'

@Component({
  selector: 's9-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() status: AppHealthStatus
  @Input() target: 'server' | 'app'
  color: string
  display: string

  constructor () { }

  ngOnChanges () {
    switch (this.status) {
      case AppHealthStatus.UNKNOWN:
        this.display = 'Connecting'
        this.color = 'dark'
        break
      case AppHealthStatus.REMOVING:
        this.display = 'Removing'
        this.color = 'danger'
        break
      case AppHealthStatus.RESTARTING:
        this.display = 'Restarting'
        this.color = 'warning'
        break
      case AppHealthStatus.NEEDS_CONFIG:
      case AppHealthStatus.RECOVERABLE:
        this.display = 'Needs Config'
        this.color = 'warning'
        break
      case AppHealthStatus.RUNNING:
        this.display = this.target === 'app' ? 'Running' : 'Connected'
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
      case AppHealthStatus.DEAD:
        this.display = 'Corrupted'
        this.color = 'danger'
        break
      default:
        this.color = 'dark'
    }
  }
}
