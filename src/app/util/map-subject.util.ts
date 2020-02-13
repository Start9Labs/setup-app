import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take, map } from 'rxjs/operators'
import { PropertySubject, initPropertySubject, completePropertyObservable, peekProperties, PropertyObservableWithId, asPropertyObservable } from './property-subject.util'

export type Update<T extends { id: string }> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string }> {
  private add$: Subject<T[]>
  protected update$: Subject<Update<T>[]>
  private delete$: Subject<string[]>

  subject: { [id: string]: PropertySubject<T> }

  constructor (tMap: { [id: string]: T}) {
    this.init()
    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = initPropertySubject(t)
      return acc
    }, { })
  }

  private init () {
    this.add$ = new Subject()
    this.update$ = new Subject()
    this.update$.subscribe(s => this.update(s))
    this.delete$ = new Subject()
  }

  add (ts: T[]): void {
    console.log(`does add fire?`, JSON.stringify(ts))
    ts.forEach(t => {
      if (!this.subject[t.id]) {
        this.subject[t.id] = initPropertySubject(t)
      }
    })
    this.add$.next(ts)
  }

  delete (tids: string[]): void {
    tids.forEach(id => {
      if (this.subject[id]) {
        completePropertyObservable(this.subject[id])
        delete this.subject[id]
      }
    })
    this.delete$.next(tids)
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
    this.delete(Object.keys(this.subject))

    this.add$.complete()
    this.update$.complete()
    this.delete$.complete()

    this.init()
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
