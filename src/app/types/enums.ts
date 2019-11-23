export enum Method {
  get = 'GET',
  post = 'POST',
  patch = 'PATCH',
  delete = 'DELETE',
}

export enum AuthStatus {
  unknown,
  authed,
  unauthed,
}