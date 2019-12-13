
export type Omit<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>

export function pauseFor (ms: number) {
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