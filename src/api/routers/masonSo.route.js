const express = require('express')
const masonSoController = require('../controllers/masonSoDetail.controller');
const validateRole = require('../middleware/role');
// const { validate } = require('../../helper/customValidation');
// const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');
// const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/createMasonSoDetail', validateRole(["Admin", "Retailer"]), masonSoController.createMasonSoDetail);
router.get('/getAllMasonSoDetails', validateRole(["Admin", "Retailer"]), masonSoController.getAllMasonSoDetails);
router.get('/getMasonSoDetailById/:id', validateRole(["Admin", "Retailer"]), masonSoController.getMasonSoDetailById);
router.get('/getTotalRewardPointsForMason/:masonId', validateRole(["Admin", "Retailer"]), masonSoController.getTotalRewardPointsForMason);

module.exports = router;