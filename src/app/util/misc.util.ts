export type Omit<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>

export type PromiseRes<T> = { result: 'resolve', value: T } | { result: 'reject', value: Error }
export async function tryAll ( promises: Promise<any>[] ): Promise<PromiseRes<any>[]> {
  return Promise.all(promises.map(
    p => p
    .then (r =>  ({ result: 'resolve' as 'resolve', value: r }))
    .catch(e =>  ({ result: 'reject' as 'reject'  , value: e })),
  ))
}

// arr1 - arr2
export function diff<T> (arr1: T[], arr2: T[]): T[] {
  return arr1.filter(x => !arr2.includes(x))
}

// arr1 & arr2
export function both<T> (arr1: T[], arr2: T[]): T[] {
  return arr1.filter(x => arr2.includes(x))
}

export async function doForAtLeast (minTime: number, promises: Promise<any>[]): Promise<any[]> {
  const returned = await Promise.all(promises.concat(pauseFor(minTime)))
  returned.pop()
  return returned
}

export function pauseFor (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export type Valued<T> = { [s: string]: T }

export function toObject<T> (t: T[], map: (t0: T) => string): Valued<T> {
  return t.reduce( (acc, next) => {
    acc[map(next)] = next
    return acc
  }, { } as Valued<T>)
}

export function toDedupObject<T> (t: T[], t2: T[], map: (t0: T) => string): Valued<T> {
  return toObject(t.concat(t2), map)
}

export function update<T> (t: Valued<T>, u: Valued<T>): Valued<T> {
  return { ...t,  ...u}
}

export function fromObject<T> (o : Valued<T>): T[] {
  return Object.values(o)
}

export function deepCloneUnknown<T> (value: T): T {
  if (typeof value !== 'object' || value === null) {
    return value
  }
  if (Array.isArray(value)) {
    return deepCloneArray(value)
  }
  return deepCloneObject(value)
}

export function deepCloneObject<T> (source: T) {
  const result = { }
  Object.keys(source).forEach(key => {
    const value = source[key]
    result[key] = deepCloneUnknown(value)
  }, { })
  return result as T
}

export function deepCloneArray (collection: any) {
  return collection.map(value => {
    return deepCloneUnknown(value)
  })
}