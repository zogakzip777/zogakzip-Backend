const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// 게시글 수정
router.put('/:postId', postController.updatePost);

// 게시글 삭제
router.delete('/:postId', postController.deletePost);

// 게시글 상세 정보 조회
router.get('/:postId', postController.getPostById);

// 게시글 조회 권한 확인
router.post('/:postId/verify-password', postController.verifyPostPassword);

// 게시글 공감하기
router.post('/:postId/like', postController.likePost);

// 게시글 공개 여부 확인
router.get('/:postId/is-public', postController.isPostPublic);

// 댓글 등록
router.post('/:postId/comments', commentController.createComment);

// 댓글 목록 조회
router.get('/:postId/comments', commentController.getComments);

module.exports = router;
