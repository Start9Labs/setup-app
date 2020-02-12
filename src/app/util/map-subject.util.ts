import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take } from 'rxjs/operators'

export type ObservableWithId<T> = {
  id: string
  observe$: Observable<T>
}

export type Update<T extends { id: string }> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string }> {
  add$: Subject<T[]> = new Subject()
  update$: Subject<Update<T>[]> = new Subject()
  delete$: Subject<string[]> = new Subject()
  subject: { [id: string]: BehaviorSubject<T> }
  constructor (tMap: { [id: string]: T}) {
    this.add$.subscribe(toAdd => this.add(toAdd))
    this.update$.subscribe(toUpdate => this.update(toUpdate))
    this.delete$.subscribe(toDeleteId => this.delete(toDeleteId))
    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = new BehaviorSubject(t)
      return acc
    }, { })
  }

  private add (ts: T[]): void {
    ts.forEach(t => {
      console.log(`adding server ${t.id}`)
      if (!this.subject[t.id]) {
        this.subject[t.id] = new BehaviorSubject(t)
      }
    })
  }

  private delete (tids: string[]): void {
    tids.forEach(id => {
      console.log(`deleting server ${id}`)
      if (this.subject[id]) {
        this.subject[id].complete()
        delete this.subject[id]
      }
    })
  }

  private update (ts: Update<T>[]): void {
    ts.forEach(t => {
      console.log(`updating server ${t.id}`)
      if (this.subject[t.id]) {
        this.subject[t.id].asObservable().pipe(take(1)).subscribe(s => {
          this.subject[t.id].next({ ...s, ...t })
        })
      }
    })
  }

  clear (): void { this.delete$.next(Object.keys(this.subject)) }

  watchUpdate (id: string): undefined | BehaviorSubject<T> {
    return this.subject[id]
  }

  peek (id: string): undefined | T {
    return this.subject[id] && this.subject[id].getValue()
  }

  peekAll (): T[] {
    return Object.values(this.subject).map(s => s.getValue())
  }

  watchAllOfThem (): ObservableWithId<T>[] {
    return Object.entries(this.subject).map(([id, observe$]) => ({ id, observe$ }))
  }

  watchThem (ids: string[]): ObservableWithId<T>[] {
    return ids.map(id => ({ id, observe$: this.subject[id] }))
  }
}
