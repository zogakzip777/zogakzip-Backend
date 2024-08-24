'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PostTags', {
      postId: {
        type: Sequelize.UUID,
        references: {
          model: 'Posts',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        primaryKey: true
      },
      tagId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        primaryKey: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PostTags');
  }
};