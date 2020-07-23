type AppConfig = { http: { useMocks: boolean, customLogReqs: boolean } }
export const config: AppConfig = {
  http: {
    useMocks: false,
    customLogReqs: true,
  },
}