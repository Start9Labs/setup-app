import { BehaviorSubject, Observable, Subject, Subscription, interval } from 'rxjs'
import { take, ignoreElements } from 'rxjs/operators'

export type ObservableWithId<T> = {
  id: string
  observe$: Observable<T>
}

export type Update<T extends { id: string}> = Partial<T> & {
  id: string
}

export class MapSubject<T extends { id: string}> {
  add$: Subject<T[]> = new Subject()
  update$: Subject<Update<T>[]> = new Subject()
  delete$: Subject<string[]> = new Subject()
  subject: { [id: string]: BehaviorSubject<T> }

  private addSub: Subscription
  private deleteSub: Subscription
  private updateSub: Subscription

  constructor (tMap: { [id: string]: T}) {
    this.addSub = this.add$.subscribe(toAdd => this.add(toAdd))
    this.updateSub = this.update$.subscribe(toUpdate => this.update(toUpdate))
    this.deleteSub = this.delete$.subscribe(toDeleteId => this.delete(toDeleteId))

    this.subject = Object.entries(tMap).reduce((acc, [id, t]) => {
      acc[id] = new BehaviorSubject(t)
      return acc
    }, { })
  }

  watchSingle (id: string): undefined | Observable<T> {
    return this.subject[id].asObservable()
  }

  getAllObservables (): ObservableWithId<T>[] {
    return Object.entries(this.subject).map(([id, observe$]) => ({ id, observe$ }))
  }

  getObservables (ids: string[]): ObservableWithId<T>[] {
    return ids.map(id => ({ id, observe$: this.subject[id] }))
  }

  peek (id: string): undefined | T {
    return this.subject[id] && this.subject[id].getValue()
  }

  peekAll (): T[] {
    return Object.values(this.subject).map(s => s.getValue())
  }

  clear (): void {
    this.delete$.next(Object.keys(this.subject))
  }

  private add (ts: T[]): void {
    ts.forEach(t => {
      if (!this.subject[t.id]) {
        this.subject[t.id] = new BehaviorSubject(t)
      }
    })
  }

  private delete (tids: string[]): void {
    tids.forEach(id => {
      if (this.subject[id]) {
        this.subject[id].complete()
        delete this.subject[id]
      }
    })
  }

  private update (ts: Update<T>[]): void {
    ts.forEach(t => {
      if (this.subject[t.id]) {
        this.subject[t.id].asObservable().pipe(take(1)).subscribe(s => {
          this.subject[t.id].next({ ...s, ...t })
        })
      }
    })
  }

  refreshSubscriptions () {
    this.addSub.unsubscribe()
    this.updateSub.unsubscribe()
    this.deleteSub.unsubscribe()
    this.addSub = this.add$.subscribe(toAdd => this.add(toAdd))
    this.updateSub = this.update$.subscribe(toUpdate => this.update(toUpdate))
    this.deleteSub = this.delete$.subscribe(toDeleteId => this.delete(toDeleteId))
  }
}