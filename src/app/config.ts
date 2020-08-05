type AppConfig = { http: { useMocks: boolean, customLogReqs: boolean }, window: { cryptoUtils: boolean } }
export const config: AppConfig = {
  http: {
    useMocks: false,
    customLogReqs: true,
  },
  window: {
    cryptoUtils: false,
  },
}