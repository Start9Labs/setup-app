import { Component, Input } from '@angular/core'
import { AppStatus } from 'src/app/models/app-model'
import { ServerStatus } from 'src/app/models/server-model'

@Component({
  selector: 's9-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() appStatus?: AppStatus
  @Input() serverStatus?: ServerStatus
  color: string
  display: string

  ngOnChanges () {
    if (this.serverStatus) {
      this.handleServerStatus()
    } else if (this.appStatus) {
      this.handleAppStatus()
    }
  }

  handleServerStatus () {
    switch (this.serverStatus) {
      case ServerStatus.UNKNOWN:
        this.display = 'Connecting...'
        this.color = 'dark'
        break
      case ServerStatus.UNREACHABLE:
        this.display = 'Unreachable'
        this.color = 'danger'
        break
      case ServerStatus.NEEDS_CONFIG:
        this.display = 'Needs Config'
        this.color = 'warning'
        break
      case ServerStatus.RUNNING:
        this.display = 'Connected'
        this.color = 'success'
        break
      case ServerStatus.UPDATING:
        this.display = 'Updating...'
        this.color = 'primary'
        break
      default:
        this.color = 'secondary'
    }
  }

  handleAppStatus () {
    switch (this.appStatus) {
      case AppStatus.UNKNOWN:
        this.display = 'Unknown'
        this.color = 'dark'
        break
      case AppStatus.REMOVING:
        this.display = 'Removing...'
        this.color = 'danger'
        break
      case AppStatus.RESTARTING:
        this.display = 'Restarting...'
        this.color = 'warning'
        break
      case AppStatus.NEEDS_CONFIG:
      case AppStatus.RECOVERABLE:
        this.display = 'Needs Config'
        this.color = 'warning'
        break
      case AppStatus.RUNNING:
        this.display = 'Running'
        this.color = 'success'
        break
      case AppStatus.UNREACHABLE:
        this.display = 'Unreachable'
        this.color = 'danger'
        break
      case AppStatus.STOPPED:
        this.display = 'Stopped'
        this.color = 'danger'
        break
      case AppStatus.INSTALLING:
        this.display = 'Installing...'
        this.color = 'warning'
        break
      case AppStatus.DEAD:
        this.display = 'Corrupted'
        this.color = 'danger'
        break
      default:
        this.color = 'secondary'
    }
  }
}
