'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PostTag extends Model {
    static associate(models) {
      PostTag.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id' });
      PostTag.belongsTo(models.Tag, { foreignKey: 'tagId', targetKey: 'id' });
    }
  }
  PostTag.init({
    postId: {
      type: DataTypes.UUID,
      references: {
        model: 'Post',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
      primaryKey: true
    },
    tagId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tag',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    modelName: 'PostTag',
    tableName: 'PostTags',
    timestamps: false
  });
  return PostTag;
};