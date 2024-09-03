exports.uploadImage = (req, res, next) => {
  if (req.file) {
    // 업로드된 파일의 URL을 포함하여 응답
    res.json({
      imageUrl: `/images/${req.file.filename}`
    });
  } else {
    next(err);
  }
};