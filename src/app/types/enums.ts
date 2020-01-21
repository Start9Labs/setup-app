export enum Method {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  head = 'head',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
}

export enum AuthStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  MISSING = 'MISSING',
}