import { Platform, AlertController } from '@ionic/angular'
import { Injectable } from '@angular/core'

declare var WifiWizard2: any

@Injectable()
export class WifiWizard {

  constructor (
    public platform: Platform,
    public alert: AlertController,
  ) { }

  async getConnectedSSID (): Promise<string> {
    if (this.platform.is('cordova')) {
      return WifiWizard2.getConnectedSSID().catch((_: Error) => undefined)
    } else {
      return prompt('Enter current wifi SSID')
    }
  }

  async connect (SSID: string, password: string): Promise<void> {
    if (this.platform.is('ios')) {
      await WifiWizard2.iOSConnectNetwork(SSID, password)
    } else if (this.platform.is('android')) {
      await WifiWizard2.connect(SSID, true, password, 'WPA', true)
    } else {
      if (!confirm(`Browser detected. Please connect computer to wif: ${SSID}`)) {
        throw new Error('User refused to comply with orders.')
      }
    }
  }
}