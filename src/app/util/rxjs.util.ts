import { Observable, forkJoin, interval } from 'rxjs'
import { map, take, filter } from 'rxjs/operators'

type FiniteObservable<T> = Observable<T>

export const squash = map(() => { return })
export const isFalse = filter(a => !a)
export const isTrue = filter(a => !!a)
export function forkPause (ms: number): FiniteObservable<void> {
  return interval(ms).pipe(take(1), squash)
}
export function forkDoAll (...os: Observable<any>[]): FiniteObservable<any[]> {
  return forkJoin(os.map(a => a.pipe(take(1))))
}
