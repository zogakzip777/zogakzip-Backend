'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PostTag extends Model {
    static associate(models) {
      PostTag.belongsTo(models.Post, { foreignKey: 'postId', targetKey: id });
      PostTag.belongsTo(models.Tag, { foreignKey: 'tagId', targetKey: id });
    }
  }
  PostTag.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    postId: {
      type: DataTypes.UUID,
      references: {
        model: 'Post',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    },
    tagId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tag',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PostTag',
    tableName: 'PostTags',
    timestamps: false
  });
  return PostTag;
};