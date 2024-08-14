'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Badges', [
      {
        id: 1,
        name: "7일 연속 추억 등록"
      },
      {
        id: 2,
        name: "추억 수 20개 이상 등록"
      },
      {
        id: 3,
        name: "그룹 생성 후 1년 달성"
      },
      {
        id: 4,
        name: "그룹 공감 1만 개 이상 받기"
      },
      {
        id: 5,
        name: "추억 공감 1만 개 이상 받기"
      }
    ]);
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Badges');
  }
};
