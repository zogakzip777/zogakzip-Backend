const { BadRequestError, WrongPasswordError, NotFoundError } = require("../utils/customErrors");

const errorHandler = (err, req, res, next) => {
  // 에러 메세지 출력
  console.error({ error: err.message });
  
  if (err.name === 'SequelizeValidationError') {
    err = new BadRequestError();
  }

  // 에러 응답 기본 설정
  let statusCode = err.statusCode || 500;
  let message = err.message || '서버에서 오류가 발생했습니다';
  
  // 에러 응답 반환
  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
