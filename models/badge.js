'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Badge extends Model {
    static associate(models) {
      Badge.hasMany(models.GroupBadge, { foreignKey: 'badgeId', sourceKey: 'id' });
    }
  }
  Badge.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Badge',
    tableName: 'Badges',
    timestamps: false
  });
  return Badge;
};