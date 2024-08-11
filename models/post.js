'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.Group, { foreignKey: 'groupId', targetKey: id });
      Post.hasMany(models.Comment, { foreignKey: 'postId', sourceKey: 'id' });
      Post.hasMany(models.PostTag, { foreignKey: 'postId', sourceKey: 'id' });
    }
  }
  Post.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    groupId: {
      type: DataTypes.UUID,
      references: {
        model: 'Group',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    moment: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'Posts',
    timestamps: true,
  });
  return Post;
};