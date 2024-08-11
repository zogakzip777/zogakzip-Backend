const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const {
  username, password, database, host, dialect,
} = config;
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
  logging: false
});

const Group = require('./group')(sequelize, DataTypes);
const Post = require('./post')(sequelize, DataTypes);
const Comment = require('./comment')(sequelize, DataTypes);
const Tag = require('./tag')(sequelize, DataTypes);
const PostTag = require('./posttag')(sequelize, DataTypes);
const Badge = require('./badge')(sequelize, DataTypes);
const GroupBadge = require('./groupbadge')(sequelize, DataTypes);

const db = {};

db.sequelize = sequelize;
db.Group = Group;
db.Post = Post;
db.Comment = Comment;
db.Tag = Tag;
db.PostTag = PostTag;
db.Badge = Badge;
db.GroupBadge = GroupBadge;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;