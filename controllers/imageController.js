exports.uploadImage = (req, res) => {
  if (req.file) {
    // 업로드된 파일의 URL을 포함하여 응답
    res.json({
      imageUrl: `/images/${req.file.filename}`
    });
  } else {
    res.status(400).send({ message: '파일 업로드 실패' });
  }
};