import { S9Server } from 'src/app/models/server-model'

export const EditFriendlyName = (handler: () => Promise<any>) => ({
    text: 'Edit Friendly Name',
    icon: 'pricetag',
    handler: () => { handler() }
})

export const Wifi = (handler) => ({
    text: 'Wifi',
    icon: 'wifi',
    handler: () => handler().then(() => {})
})

export const ServerSpecs = (handler) => ({
    text: 'About This Server',
    icon: 'information-circle-outline',
    handler: () => handler().then(() => {})
})

export const Metrics = (handler) => ({
    text: 'Metrics',
    icon: 'pulse',
    handler: () => handler().then(() => {})
})

export const DeveloperOptions = (handler) => ({
    text: 'Developer Options',
    icon: 'code',
    handler: () => handler().then(() => {})
})

export const Restart = (handler) => ({
  text: 'Restart',
  icon: 'refresh',
  handler: () => handler().then(() => {})
})

export const Shutdown = (handler) => ({
  text: 'Shutdown',
  icon: 'power',
  handler: () => handler().then(() => {})
})

export const Forget = (handler) => ({
  text: 'Forget',
  cssClass: 'alert-danger',
  icon: 'trash',
  handler: () => handler().then(() => {})
})

export const EditFriendlyNameAlert: (s: S9Server, h: any) => any = (server, handler) => ({
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
      {
        text: 'Cancel',
        role: 'cancel',
      }, {
        text: 'Done',
        handler
      },
    ],
    cssClass: 'alert-config-value',
})