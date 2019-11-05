export function pauseFor (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}