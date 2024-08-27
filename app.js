const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
require('./schedulers/scheduler')

const groupRoutes = require('./routes/groupRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const imageRoutes = require('./routes/imageRoutes');

const app = express();

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/groups', groupRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/image', imageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});