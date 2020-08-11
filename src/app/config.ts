type AppConfig = { http: { useMocks: boolean, customLogReqs: boolean }, window: { cryptoUtils: boolean } }
export const config: AppConfig = {
  http: {
    useMocks: true,
    customLogReqs: true,
  },
  window: {
    cryptoUtils: false,
  },
}