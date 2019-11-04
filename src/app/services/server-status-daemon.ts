import { Injectable } from '@angular/core'
import { S9ServerModel } from '../storage/server-model'
import { SetupService } from './setup-service'
import { isFullySetup } from '../storage/s9-server'

@Injectable()
export class ServerStatusDaemon {
  constructor (
    private readonly setupService: SetupService,
    private readonly svm: S9ServerModel,
  ) { }

  async setupLoop (ms: number): Promise<void> {
    setInterval(async () => {
      const sss = this.svm.getServers().filter(ss => !isFullySetup(ss))
      await Promise.all(
        sss.map(
          ss => this.setupService.setup(ss).then(ss => this.svm.saveServer(ss)),
        ),
      )
    }, ms)
  }

  async handshakeLoop (ms: number): Promise<void> {
    setInterval(async () => {
      const sss = this.svm.getServers()
      await Promise.all(
        sss.map(
          ss => this.setupService.handshake(ss).then(ss => this.svm.saveServer(ss)),
        ),
      )
    }, ms)
  }
}