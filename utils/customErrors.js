class BadRequestError extends Error {
  constructor() {
    super('잘못된 요청입니다');
    this.name = 'BadRequestError';
    this.statusCode = 400;
    Error.captureStackTrace(this, this.constructor);
  }
}

class WrongPasswordError extends Error {
  constructor() {
    super('비밀번호가 틀렸습니다');
    this.name = 'WrongPasswordError';
    this.statusCode = 403;
  }
};

class NotFoundError extends Error {
  constructor() {
    super('존재하지 않습니다');
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
};

module.exports = {
  BadRequestError,
  WrongPasswordError,
  NotFoundError
}