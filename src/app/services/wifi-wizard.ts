import { Platform } from '@ionic/angular'
import { Injectable } from '@angular/core'

declare var WifiWizard2: any

@Injectable()
export class WifiWizard {

  constructor (
    public platform: Platform,
  ) { }

  async getConnectedSSID (): Promise<string> {
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

// export abstract class AbsWifiWizard {
//   abstract getConnectedSSID(): Promise<string>
//   abstract connect(ssid: string, password: string): Promise<void>

//   static new(platform: Platform): AbsWifiWizard {
//     if (platform.is('ios')) {
//       return new IosWifiWizard()
//     } else if (platform.is('android')) {
//       return new AndroidWifiWizard()
//     } else {
//       return new WebWifiWizard()
//     }
//   }
// }

// export class IosWifiWizard extends AbsWifiWizard {
//   constructor() { super() }

//   async getConnectedSSID(): Promise<string> {
//     return WifiWizard2.getConnectedSSID().catch((_: Error) => undefined)
//   }

//   async connect(ssid: string, password: string): Promise<void> {
//     await WifiWizard2.iOSConnectNetwork(ssid, password)
//   }
// }

// export class AndroidWifiWizard extends AbsWifiWizard {
//   constructor() { super() }

//   async getConnectedSSID(): Promise<string> {
//     return WifiWizard2.getConnectedSSID().catch((_: Error) => undefined)
//   }

//   async connect(ssid: string, password: string): Promise<void> {
//     await WifiWizard2.connect(ssid, true, password, 'WPA', true)
//   }
// }

// export class WebWifiWizard extends AbsWifiWizard {
//   constructor() { super() }

//   async getConnectedSSID(): Promise<string> {
//     return prompt('Enter current wifi ssid')
//   }

//   async connect(ssid: string, password: string): Promise<void> {
//     if (!confirm(`Browser detected. Please connect computer to wif: ${ssid}`)) {
//       throw new Error('User refused to comply with orders.')
//     }
//   }
// }