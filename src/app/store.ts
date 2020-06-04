import { Injectable } from '@angular/core'
import { AuthService, AuthStatus } from './services/auth.service'
import { Subscription } from 'rxjs'

import { Plugins } from '@capacitor/core'
const { Storage } = Plugins

@Injectable({
  providedIn: 'root',
})
export class Store {
  authSub: Subscription
  torEnabled: boolean
  showTorPrompt: boolean
  errorLogs: string[] = []

  constructor (
    private readonly authService: AuthService,
  ) {
    this.setDefaults()
  }

  initMonitors (): void {
    this.authSub = this.authSub || this.authService.watch().subscribe(s => this.handleAuthChange(s))
  }

  async load (): Promise<void> {
    this.torEnabled = await this.getValue('torEnabled')
    this.showTorPrompt = !(await this.getValue('hideTorPrompt'))
  }

  async hideTorPrompt (): Promise<void> {
    await this.setValue('hideTorPrompt', true)
  }

  async toggleTor (on: boolean): Promise<void> {
    await this.setValue('torEnabled', on)
    this.torEnabled = on
  }

  private setDefaults () {
    this.torEnabled = false
    this.showTorPrompt = true
  }

  private async getValue (key: string): Promise<any> {
    return JSON.parse((await Storage.get({ key })).value)
  }

  private async setValue (key: string, value: any): Promise<void> {
    await Storage.set({ key, value: JSON.stringify(value) })
  }

  private async handleAuthChange (status: AuthStatus): Promise<void> {
    if (status === AuthStatus.MISSING) {
      await Storage.clear()
      this.setDefaults()
    }
  }
}