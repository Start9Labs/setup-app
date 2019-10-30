import { Injectable } from '@angular/core'
import { HandshakeDaemon } from './handshake-daemon'
import { WifiWizard } from './wifi-wizard'

// detects when phone changes wifi network
@Injectable()
export class WifiConnectionDaemon {
    private currentWifiSSID: string | undefined
    private lastWifiSSID: string | undefined

    constructor(
        private readonly wifiWizard: WifiWizard,
        private readonly hsDaemon: HandshakeDaemon
    ) { }

    async watch(timeout: number) {
        setTimeout(() => this.setCurrentWifi(), timeout)
    }

    async setCurrentWifi(): Promise<string> {

        console.log('RUNNING ' + this.currentWifiSSID)

        this.lastWifiSSID = this.currentWifiSSID
        this.currentWifiSSID = await this.wifiWizard.getConnectedSSID()

        //if we have wifi and it's new reset the handshake daemon
        if (this.lastWifiSSID !== this.currentWifiSSID && this.currentWifiSSID) {
            this.hsDaemon.reset()
        }

        return this.currentWifiSSID
    }
}