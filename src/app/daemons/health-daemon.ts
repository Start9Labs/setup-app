import { Injectable } from '@angular/core'
import { S9ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { StatusCheckService } from '../services/status-check.service'

@Injectable({
  providedIn: 'root',
})
export class HealthDaemon {
  private static readonly ms = 60000

  constructor (
    private readonly statusCheckService: StatusCheckService,
    private readonly svm: S9ServerModel,
  ) { }

  async serverStatusCheck (): Promise<void> {
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
      await pauseFor(HealthDaemon.ms)
    }

  }
}