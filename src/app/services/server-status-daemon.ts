import { Injectable } from '@angular/core'
import { S9ServerModel } from '../storage/server-model'
import { SetupService } from './setup-service'
import { isLanEnabled, updateS9 } from '../storage/s9-server'
import { pauseFor } from 'src/types/misc'

@Injectable()
export class ServerStatusDaemon {
  constructor (
    private readonly setupService: SetupService,
    private readonly svm: S9ServerModel,
  ) { }

  async handshakeLoop (ms: number): Promise<void> {
    while (true) {
      const sss = this.svm.getServers()
      await Promise.all(
        sss.map(
          async ss => {
            if (isLanEnabled(ss)) {
              const handshakeAttempt = await this.setupService.handshake(ss)
              this.svm.saveServer(updateS9(ss, { lastHandshake: handshakeAttempt }))
            }
          },
        ),
      )
      await pauseFor(ms)
    }
  }
}