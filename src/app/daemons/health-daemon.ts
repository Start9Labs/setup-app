import { Injectable } from '@angular/core'
import { S9ServerModel } from '../models/server-model'
import { SetupService } from '../services/setup.service'
import { pauseFor } from 'src/app/util/misc.util'
import { StatusCheckService } from '../services/status-check.service'

@Injectable({
  providedIn: 'root',
})
export class HealthDaemon {
  constructor (
    private readonly setupService: SetupService,
    private readonly statusCheckService: StatusCheckService,
    private readonly svm: S9ServerModel,
  ) { }

  async serverStatusCheck (ms: number): Promise<void> {
    while (true) {
      const sss = this.svm.getServers()
      await Promise.all(
        sss.map(
          async ss => {
            const { attempt, version } = await this.statusCheckService.getS9AgentStatus(ss)
            this.svm.saveServer({ ...ss, lastStatusAttempt: attempt, version: version || ss.version })
          },
        ),
      )
      await pauseFor(ms)
    }

  }
}