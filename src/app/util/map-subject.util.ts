import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take, map } from 'rxjs/operators'
import { PropertySubject, initPropertySubject, completePropertyObservable, peekProperties, PropertyObservableWithId, asPropertyObservable } from './property-subject.util'

export type Update<T extends { id: string }> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string }> {
  addPump$: BehaviorSubject<T[]> = new BehaviorSubject([])
  updatePump$: BehaviorSubject<Update<T>[]> = new BehaviorSubject([])
  deletePump$: BehaviorSubject<string[]> = new BehaviorSubject([])

  add$: Observable<T[]>
  delete$: Observable<string[]>

  subject: { [id: string]: PropertySubject<T> }

  constructor (tMap: { [id: string]: T}) {
    this.add$ = this.addPump$.pipe(map(toAdd => this.add(toAdd)))
    this.delete$ = this.deletePump$.pipe(map(toDeleteId => this.delete(toDeleteId)))
    this.updatePump$.subscribe(toUpdate => this.update(toUpdate))

    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = initPropertySubject(t)
      return acc
    }, { })
  }

  private add (ts: T[]): T[] {
    console.log(`does add fire?`, JSON.stringify(ts))
    ts.forEach(t => {
      if (!this.subject[t.id]) {
        this.subject[t.id] = initPropertySubject(t)
      }
    })
    return ts
  }

  private delete (tids: string[]): string[] {
    tids.forEach(id => {
      if (this.subject[id]) {
        completePropertyObservable(this.subject[id])
        delete this.subject[id]
      }
    })
    return tids
  }

  // missing keys in the update do *not* delete existing keys
  private update (ts: Update<T>[]): void {
    ts.forEach(t => {
      if (this.subject[t.id]) {
        const propertiesAreSubjects = this.subject[t.id] as PropertySubject<T>
        Object.entries(t).forEach(([kt, vt]) => {
          if (propertiesAreSubjects[kt] as BehaviorSubject<any>) {
            propertiesAreSubjects[kt].pipe(take(1)).subscribe(vp => {
              if (vp !== vt) {
                propertiesAreSubjects[kt].next(vt)
               }
            })
          } else {
            propertiesAreSubjects[kt] = new BehaviorSubject(vt)
          }
        })
      }
    })
  }

  clear (): void {
    this.deletePump$.next(Object.keys(this.subject))
    this.addPump$.complete()
    this.updatePump$.complete()
    this.deletePump$.complete()
  }

  watch (id: string): undefined | PropertySubject<T> {
    return this.subject[id]
  }

  watchAdd (): Observable<T[]> {
    return this.add$
  }

  watchDelete (): Observable<string[]> {
    return this.delete$
  }

  peek (id: string): undefined | T {
    return this.subject[id] && peekProperties(this.subject[id])
  }

  peekAll (): T[] {
    return Object.values(this.subject).map(s => peekProperties(s))
  }

  watchAll (): PropertyObservableWithId<T>[] {
    return Object.entries(this.subject).map(([id, observe]) => ({ id, observe }))
  }

  watchThese (ids: string[]): PropertyObservableWithId<T>[] {
    return ids.map(id => ({ id, observe: asPropertyObservable(this.subject[id])}))
  }
}
