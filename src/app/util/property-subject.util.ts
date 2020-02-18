import { BehaviorSubject, Observable, combineLatest, of, pairs } from 'rxjs'
import { map, pairwise, tap } from 'rxjs/operators'

export type PropertyObservableWithId<T> = {
  id: string
  observe: PropertyObservable<T>
}

export type PropertySubject<T> = {
  [k in keyof T]: BehaviorSubject<T[k]>
}

export type PropertyObservable<T> = {
  [k in keyof T]: Observable<T[k]>
}

// better type information than Object.entries without the return type cast
export function propertySubjects<T> (p : PropertySubject<T>): [string, BehaviorSubject<any>][] {
  return Object.entries(p)
}

export function asPropertyObservable<T> (ps : PropertySubject<T>): PropertyObservable<T> {
  return propertySubjects(ps).reduce( (acc, [key, value]) => {
    acc[key] = value.asObservable()
    return acc
  }, { } as PropertyObservable<T>)
}

export function peekProperties<T> (ps: PropertySubject<T>) : T {
  return propertySubjects(ps).reduce( (acc, [key, value]) => {
    acc[key] = value.getValue()
    return acc
  }, { } as T)
}

export function initPropertySubject<T> (t: T): PropertySubject<T> {
  return Object.entries(t).reduce( (acc, [k, v]) => {
    acc[k] = new BehaviorSubject(v)
    return acc
  }, { } as PropertySubject<T> )
}

export function withKey<V> (k: string, v: BehaviorSubject<V>): Observable<[string, V]> {
  return combineLatest(of(k), v)
}

export function fromPropertyObservable<T> (t: PropertySubject<T> | PropertyObservable<T>): Observable<T> {
  return combineLatest(...propertySubjects(t as any).map(([k, p]) => withKey(k, p))).pipe(map( kvPairs => {
    return kvPairs.reduce( (acc, [k, v]) => {
      acc[k] = v
      return acc
    }, { }) as T
  }))
}

export function completePropertyObservable<T> (t: PropertySubject<T> | PropertyObservable<T>): void {
  propertySubjects(t as any).forEach(p => p[1].complete() )
}
