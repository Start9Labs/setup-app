import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class Store {
  torAddress: string
  claimed: boolean
}