import { S9Server } from 'src/app/models/server-model'
import { AlertOptions, LoadingOptions } from '@ionic/core'
import { ActionSheetButton } from '@ionic/core'

export const EditNameAlert: (s: S9Server, h: (a?: any) => any) => AlertOptions = (server, handler) => ({
  backdropDismiss: false,
  header: 'Embassy Name',
  inputs: [{
      name: 'inputValue',
      type: 'text',
      value: server.label,
      placeholder: '(ex. My Server)',
    },
  ],
  buttons: [
    CancelButton, {
      text: 'Done',
      handler,
    },
  ],
  cssClass: 'alert-config-value',
} as AlertOptions)

export const UpdateAlert: (s: S9Server, version: string, h: () => any) => AlertOptions = (server, version, handler) => ({
  backdropDismiss: false,
  header: 'Confirm',
  message: `Update Ambassador to ${version}?`,
  buttons: [
    CancelButton, {
      text: 'Update',
      handler: () => { handler() },
    },
  ],
} as AlertOptions)

export const RestartAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => ({
  backdropDismiss: false,
  header: 'Confirm',
  message: `Are you sure you want to restart ${server.label}?`,
  buttons: [
    CancelButton, {
      text: 'Restart',
      cssClass: 'alert-danger',
      handler: () => { handler() },
    },
  ],
} as AlertOptions)

export const ShutdownAlert: (s: S9Server, h: () => any) => AlertOptions = (server, handler) => ({
  backdropDismiss: false,
  header: 'Confirm',
  message: `Are you sure you want to shut down ${server.label}?`,
  buttons: [
    CancelButton, {
      text: 'Shutdown',
      cssClass: 'alert-danger',
      handler: () => { handler() },
    },
  ],
} as AlertOptions)

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
} as ActionSheetButton