'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Companies', [
      {
        Name: 'Asian Paint',
        IsActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        Name: 'Wooden Royal Paint Brush',
        IsActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        Name: 'The Roller Company',
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
