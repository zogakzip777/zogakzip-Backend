const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const postController = require('../controllers/postController');

// 그룹 생성
router.post('/', groupController.createGroup);

// 그룹 목록 조회
router.get('/', groupController.getGroups);

// 그룹 수정
router.put('/:groupId', groupController.updateGroup);

// 그룹 삭제
router.delete('/:groupId', groupController.deleteGroup);

// 그룹 상세 정보 조회
router.get('/:groupId', groupController.getGroupById);

// 그룹 조회 권한 확인
router.post('/:groupId/verify-password', groupController.verifyGroupPassword);

// 그룹 공감하기
router.post('/:groupId/like', groupController.likeGroup);

// 그룹 공개 여부 확인
router.get('/:groupId/is-public', groupController.isGroupPublic)

// 게시글 등록
router.post('/:groupId/posts', postController.createPost);

// 게시글 목록 조회
router.get('/:groupId/posts', postController.getPosts);

module.exports = router;