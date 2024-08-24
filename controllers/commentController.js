const db = require("../models/index.js");
const { Comment } = db; // 사용할 모델 불러오기
const { hashPassword, comparePassword } = require("../utils/passwordUtils"); // 비밀번호 비교 유틸리티 불러오기

// 댓글 등록
exports.createComment = async (req, res) => {
  const { postId } = req.params;
  const { nickname, content, password } = req.body;

  try {
    // 입력 유효성 검사
    if (!nickname || !content || !password) {
      return res.status(400).json({ message: "잘못된 요청입니다" });
    }

    // 비밀번호 해싱 처리
    const hashedPassword = await hashPassword(password);

    // 댓글 생성 및 저장
    const comment = await Comment.create({
      postId,
      nickname,
      content,
      password: hashedPassword, // 해싱된 비밀번호 저장
    });

    // 성공 응답
    return res.status(200).json({
      id: comment.id,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error(`댓글 등록 중 오류 발생: ${error.message}`);
    // 예상치 못한 서버 오류
    return res.status(500).json({ message: "서버 오류가 발생했습니다" });
  }
};

// 댓글 목록 조회
exports.getComments = async (req, res) => {
  const { postId } = req.params; // postId로 특정 게시글의 댓글을 조회
  const { page = 1, pageSize = 10 } = req.query; // 기본값 설정

  try {
    // 페이지와 페이지당 아이템 수를 숫자로 변환
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    // 댓글 목록 조회 및 총 댓글 수 계산
    const { count, rows } = await Comment.findAndCountAll({
      where: { postId }, // 특정 게시글의 댓글만 조회
      limit,
      offset,
      order: [["createdAt", "ASC"]], // 작성된 시간 순으로 정렬
    });

    // 총 페이지 수 계산
    const totalPages = Math.ceil(count / limit);

    // 응답 반환
    return res.status(200).json({
      currentPage: parseInt(page, 10),
      totalPages,
      totalItemCount: count,
      data: rows.map((comment) => ({
        id: comment.id,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error(`댓글 목록 조회 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }
};


// 댓글 수정
exports.updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { nickname, content, password } = req.body;

  try {
    // 데이터베이스에서 해당 댓글 찾기
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ message: "존재하지 않습니다" });
    }

    // 비밀번호 확인
    const isMatch = await comparePassword(password, comment.password);
    if (!isMatch) {
      return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
    }

    // 댓글 내용 수정
    if (nickname) comment.nickname = nickname;
    if (content) comment.content = content;

    // 변경된 댓글 저장
    await comment.save();

    // 수정된 댓글의 응답 반환
    return res.status(200).json({
      id: comment.id,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error(`댓글 수정 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }
};


// 댓글 삭제
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { password } = req.body;

  try {
    // 입력 유효성 검사
    if (!password) {
      return res.status(400).json({ message: "잘못된 요청입니다" });
    }

    // 데이터베이스에서 해당 댓글 찾기
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ message: "존재하지 않습니다" });
    }

    // 비밀번호 확인
    const isMatch = await comparePassword(password, comment.password);
    if (!isMatch) {
      return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
    }

    // 댓글 삭제
    await comment.destroy();

    return res.status(200).json({ message: "댓글 삭제 성공" });
  } catch (error) {
    console.error(`댓글 삭제 중 오류 발생: ${error.message}`);
    return res.status(500).json({ message: "서버 오류가 발생했습니다" });
  }
};
