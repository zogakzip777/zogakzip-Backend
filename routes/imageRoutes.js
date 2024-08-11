const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

/* multer 설정 */

// 이미지 업로드
router.put('/', imageController.updateComment);

module.exports = router;
