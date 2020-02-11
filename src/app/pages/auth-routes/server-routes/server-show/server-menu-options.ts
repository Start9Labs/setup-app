import { S9Server } from 'src/app/models/server-model'
import { AlertOptions, LoadingOptions } from '@ionic/core'

export const EditFriendlyName = (handler: () => Promise<any>) => ({
    text: 'Edit Friendly Name',
    icon: 'pricetag',
    handler: () => { handler() }
})

export const Wifi = (handler) => ({
    text: 'Wifi',
    icon: 'wifi',
    handler: () => { handler() }
})

export const ServerSpecs = (handler) => ({
    text: 'About This Server',
    icon: 'information-circle-outline',
    handler: () => { handler() }
})

export const Metrics = (handler) => ({
    text: 'Metrics',
    icon: 'pulse',
    handler: () => { handler() }
})

export const DeveloperOptions = (handler) => ({
    text: 'Developer Options',
    icon: 'code',
    handler: () => { handler() }
})

export const Restart = (handler) => ({
  text: 'Restart',
  icon: 'refresh',
  handler: () => { handler() }
})

export const Shutdown = (handler) => ({
  text: 'Shutdown',
  icon: 'power',
  handler: () => { handler() }
})

export const Forget = (handler) => ({
  text: 'Forget',
  cssClass: 'alert-danger',
  icon: 'trash',
  handler: () => { handler() }
})

export const EditFriendlyNameAlert: (s: S9Server, h: (a?: any) => any) => AlertOptions = (server, handler) => ({
    backdropDismiss: false,
    header: 'Friendly Name',
    inputs: [
      {
        name: 'inputValue',
        type: 'text',
        value: server.label,
        placeholder: '(ex. My Server)',
      },
    ],
    buttons: [
        CancelButton,
      {
        text: 'Done',
        handler
      },
    ],
    cssClass: 'alert-config-value',
})

export const UpdateAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => (
    {
        backdropDismiss: false,
        header: 'Confirm',
        message: `Update MeshOS to ${server.versionLatest}?`,
        buttons: [
            CancelButton,
          {
            text: 'Update',
            handler: () => { handler() }
          },
        ],
      } as AlertOptions
)

export const RestartAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => (
    {
        backdropDismiss: false,
        header: 'Confirm',
        message: `Are you sure you want to restart ${server.label}?`,
        buttons: [
            CancelButton,
            {
                text: 'Restart',
                cssClass: 'alert-danger',
                handler: () => { handler() },
            },
        ],
  } as AlertOptions
)

export const ShutdownAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => (
    {
        backdropDismiss: false,
        header: 'Confirm',
        message: `Are you sure you want to shut down ${server.label}?`,
        buttons: [
            CancelButton,
          {
            text: 'Shutdown',
            cssClass: 'alert-danger',
            handler: () => { handler() },
          },
        ],
    } as AlertOptions
)

export const ForgetAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => (
    {
        backdropDismiss: false,
        header: 'Caution',
        message: `Are you sure you want to forget ${server.label} on this device? You can add it back later. The server itself will not be affected.`,
        buttons: [
          CancelButton,
          {
            text: 'Forget Server',
            cssClass: 'alert-danger',
            handler: () => { handler() },
          },
        ],
    } as AlertOptions
)

export const LoadingSpinner: (m?: string) => LoadingOptions = (m) => {
    const toMergeIn = m ? { message: m } : { }
    return {
        spinner: 'lines',
        cssClass: 'loader',
        ...toMergeIn,
    } as LoadingOptions
}

export const CancelButton = {
    text: 'Cancel',
    role: 'cancel',
}