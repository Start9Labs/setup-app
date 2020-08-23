export function trace<T> (t: T): T {
  console.log(`TRACE`, t)
  return t
}

// curried description. This allows e.g somePromise.thentraceDesc('my result'))
export function traceDesc<T> (description: string): (t: T) => T {
  return t => {
    console.log(`TRACE`, description, t)
    return t
  }
}

export function traceThrowDesc<T> (description: string, t: T | undefined): T {
  if (!t) throw new Error(description)
  return t
}
