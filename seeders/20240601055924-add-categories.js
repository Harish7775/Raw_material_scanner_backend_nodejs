'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      {
        Name: 'Paints',
        IsActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        Name: 'Brushes',
        IsActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        Name: 'Rollers',
        IsActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Companies', null, {});
  }
};
