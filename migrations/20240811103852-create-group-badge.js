'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GroupBadges', {
      groupId: {
        type: Sequelize.UUID,
        references: {
          model: 'Groups',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        primaryKey: true
      },
      badgeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Badges',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        primaryKey: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GroupBadges');
  }
};