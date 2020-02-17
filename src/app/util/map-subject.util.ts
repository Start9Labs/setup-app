import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take, map } from 'rxjs/operators'
import { PropertySubject, initPropertySubject, completePropertyObservable, peekProperties, PropertyObservableWithId, asPropertyObservable } from './property-subject.util'

export type Update<T extends { id: string }> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string }> {
  private add$: Subject<PropertyObservableWithId<T>[]>
  protected update$: Subject<Update<T>[]>
  private delete$: Subject<string[]>

  subject: { [id: string]: PropertySubject<T> }

  constructor (tMap: { [id: string]: T}) {
    this.add$ = new Subject()
    this.update$ = new Subject()
    this.update$.subscribe(s => this.update(s))
    this.delete$ = new Subject()
    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = initPropertySubject(t)
      return acc
    }, { })
  }

  add (ts: T[]): void {
    this.add$.next(
      ts.filter(t => !this.subject[t.id]).map(t => {
        const newSubject = initPropertySubject(t)
        this.subject[t.id] = newSubject
        return { observe: newSubject, id: t.id }
      }),
    )
  }

  delete (tids: string[]): void {
    const toReturn = [] as string[]
    tids.forEach(id => {
      if (this.subject[id]) {
        completePropertyObservable(this.subject[id])
        delete this.subject[id]
        toReturn.push(id)
      }
    })
    this.delete$.next(toReturn)
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
  }

  watch (id: string): undefined | PropertySubject<T> {
    return this.subject[id]
  }

  watchAdd (): Observable<PropertyObservableWithId<T>[]> {
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
