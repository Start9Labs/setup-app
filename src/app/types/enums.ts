export enum Method {
  get = 'GET',
  post = 'POST',
  patch = 'PATCH',
  delete = 'DELETE',
}

export enum AuthStatus {
  uninitialized,
  authed,
  unauthed,
}