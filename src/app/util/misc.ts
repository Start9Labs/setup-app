export function pauseFor (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}