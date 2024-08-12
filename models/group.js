'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.hasMany(models.Post, { foreignKey: 'groupId', sourceKey: 'id' });
      Group.hasMany(models.GroupBadge, { foreignKey: 'groupId', sourceKey: 'id' });
    }
  }
  Group.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    introduction: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'Groups',
    timestamps: true,
    updatedAt: false
  });
  return Group;
};