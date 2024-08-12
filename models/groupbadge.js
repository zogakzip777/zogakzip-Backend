'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GroupBadge extends Model {
    static associate(models) {
      GroupBadge.belongsTo(models.Group, { foreignKey: 'groupId', targetKey: 'id' });
      GroupBadge.belongsTo(models.Badge, { foreignKey: 'badgeId', targetKey: 'id' });
    }
  }
  GroupBadge.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
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
    badgeId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Badge',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'GroupBadge',
    tableName: 'GroupBadges',
    timestamps: false
  });
  return GroupBadge;
};