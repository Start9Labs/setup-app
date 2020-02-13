import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take } from 'rxjs/operators'
import { PropertySubject, initPropertySubject, completePropertyObservable, peekProperties, PropertyObservableWithId, asPropertyObservable } from './property-subject.util'

export type Update<T extends { id: string }> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string }> {
  add$: Subject<T[]> = new Subject()
  update$: Subject<Update<T>[]> = new Subject()
  delete$: Subject<string[]> = new Subject()

  subject: { [id: string]: PropertySubject<T> }

  constructor (tMap: { [id: string]: T}) {
    this.add$.subscribe(toAdd => this.add(toAdd))
    this.update$.subscribe(toUpdate => this.update(toUpdate))
    this.delete$.subscribe(toDeleteId => this.delete(toDeleteId))

    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = initPropertySubject(t)
      return acc
    }, { })
  }

  private add (ts: T[]): T[] {
    console.log(`adding somethings...`, ts)
    ts.forEach(t => {
      if (!this.subject[t.id]) {
        console.log(`we are adding something`, initPropertySubject(t))
        this.subject[t.id] = initPropertySubject(t)
      }
    })
    return ts
  }

  private delete (tids: string[]): void {
    tids.forEach(id => {
      if (this.subject[id]) {
        completePropertyObservable(this.subject[id])
        delete this.subject[id]
      }
    })
  }

  // missing keys in the update do *not* delete existing keys
  private update (ts: Update<T>[]): void {
    console.log(`we're updating the following things...`, JSON.stringify(ts))
    ts.forEach(t => {
      if (this.subject[t.id]) {
        const propertiesAreSubjects = this.subject[t.id] as PropertySubject<T>
        Object.entries(t).forEach(([kt, vt]) => {
          console.log(`Here is the property we are considering updating:`, kt, vt)
          if (propertiesAreSubjects[kt] as BehaviorSubject<any>) {

            propertiesAreSubjects[kt].pipe(take(1)).subscribe(vp => {
              if (vp !== vt) {
                console.log(`Property we are updating:`, kt, vt)
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
    this.delete$.next(Object.keys(this.subject))
    this.add$.complete()
    this.delete$.complete()
    this.update$.complete()
  }

  watch (id: string): undefined | PropertySubject<T> {
    return this.subject[id]
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
