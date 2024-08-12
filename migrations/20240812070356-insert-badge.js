'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Badges', [
      {
        name: "7일 연속 추억 등록"
      },
      {
        name: "추억 수 20개 이상 등록"
      },
      {
        name: "그룹 생성 후 1년 달성"
      },
      {
        name: "그룹 공간 1만 개 이상 받기"
      },
      {
        name: "추억 공감 1만 개 이상 받기"
      }
    ]);
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Badges');
  }
};
