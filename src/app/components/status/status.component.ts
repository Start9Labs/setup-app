import { Component, Input } from '@angular/core'
import { AppStatus } from 'src/app/models/app-model'
import { ServerStatus, EmbassyConnection } from 'src/app/models/server-model'

@Component({
  selector: 's9-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() appStatus?: AppStatus
  @Input() serverStatus?: ServerStatus
  @Input() connectionType = EmbassyConnection.NONE
  @Input() size: 'small' | 'medium' | 'large' = 'large'
  color: string
  display: string
  icon: string
  showDots: boolean

  ngOnChanges () {
    if (this.serverStatus) {
      this.handleServerStatus()
    } else if (this.appStatus) {
      this.handleAppStatus()
    }

    if (this.connectionType === EmbassyConnection.LAN) {
      this.icon = 'assets/img/home.png'
    } else if (this.connectionType === EmbassyConnection.TOR) {
      this.icon = 'assets/img/tor.png'
    } else if (this.connectionType === EmbassyConnection.NONE) {
      this.icon = undefined
    }
  }

  handleServerStatus () {
    switch (this.serverStatus) {
      case ServerStatus.UNKNOWN:
        this.display = 'Connecting'
        this.color = 'dark'
        this.showDots = true
        break
      case ServerStatus.UNREACHABLE:
        this.display = 'Unreachable'
        this.color = 'danger'
        this.showDots = false
        break
      case ServerStatus.NEEDS_CONFIG:
        this.display = 'Needs Config'
        this.color = 'warning'
        this.showDots = false
        break
      case ServerStatus.RUNNING:
        this.display = 'Connected'
        this.color = 'success'
        this.showDots = false
        break
      case ServerStatus.UPDATING:
        this.display = 'Updating'
        this.color = 'primary'
        this.showDots = true
        break
      default:
        this.color = 'secondary'
        this.showDots = false
    }
  }

  handleAppStatus () {
    switch (this.appStatus) {
      case AppStatus.UNKNOWN:
        this.display = 'Connecting'
        this.color = 'dark'
        this.showDots = true
        break
      case AppStatus.REMOVING:
        this.display = 'Removing'
        this.color = 'danger'
        this.showDots = true
        break
      case AppStatus.RESTARTING:
        this.display = 'Restarting'
        this.color = 'warning'
        this.showDots = true
        break
      case AppStatus.NEEDS_CONFIG:
      case AppStatus.RECOVERABLE:
        this.display = 'Needs Config'
        this.color = 'warning'
        this.showDots = false
        break
      case AppStatus.RUNNING:
        this.display = 'Running'
        this.color = 'success'
        this.showDots = false
        break
      case AppStatus.UNREACHABLE:
        this.display = 'Unreachable'
        this.color = 'danger'
        this.showDots = false
        break
      case AppStatus.STOPPED:
        this.display = 'Stopped'
        this.color = 'danger'
        this.showDots = false
        break
      case AppStatus.INSTALLING:
        this.display = 'Installing'
        this.color = 'primary'
        this.showDots = true
        break
      case AppStatus.DEAD:
        this.display = 'Corrupted'
        this.color = 'danger'
        this.showDots = false
        break
      default:
        this.color = 'secondary'
        this.showDots = false
    }
  }
}
