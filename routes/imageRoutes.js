const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const imageController = require('../controllers/imageController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/'); // 업로드된 파일이 저장될 디렉토리
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일 이름 설정
  }
});

const upload = multer({ storage: storage });

// 이미지 업로드
router.post('/', upload.single('image'), imageController.uploadImage);

module.exports = router;
