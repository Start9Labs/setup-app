import { Platform } from '@ionic/angular'
import { Injectable } from '@angular/core'

declare var WifiWizard2: any

@Injectable()
export class WifiWizard {

  constructor (
    public platform: Platform,
  ) { }

  async getConnectedSSID (): Promise<string | null> {
    if (this.platform.is('cordova')) {
      return WifiWizard2.getConnectedSSID().catch((_: Error) => undefined)
    } else {
      return prompt('Enter current wifi SSID')
    }
  }

  async connect (ssid: string, password: string): Promise<void> {
    if (this.platform.is('ios')) {
      await WifiWizard2.iOSConnectNetwork(ssid, password)
    } else if (this.platform.is('android')) {
      await WifiWizard2.connect(ssid, true, password, 'WPA', true)
    } else {
      if (!confirm(`Browser detected. Please connect computer to wifi: ${ssid}`)) {
        throw new Error('User refused to comply with orders.')
      }
    }
  }
}