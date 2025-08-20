const express = require('express')
const masonSoController = require('../controllers/masonSoDetail.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { createMasonSoDetailSchema, masonIdSchema } = require('../validators/masonSo.validator');
const { idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/createMasonSoDetail', validateRole(["Admin", "Retailer"]), validate(createMasonSoDetailSchema, 'body'), masonSoController.createMasonSoDetail);
router.get('/getAllMasonSoDetails', validateRole(["Admin", "Retailer"]), masonSoController.getAllMasonSoDetails);
router.get('/getMasonSoDetailById/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), masonSoController.getMasonSoDetailById);
router.get('/getTotalRewardPointsForMason/:masonId', validateRole(["Admin", "Retailer"]), validate(masonIdSchema, 'params'), masonSoController.getTotalRewardPointsForMason);
router.get('/getRewardHistory', masonSoController.getRewardHistory);

module.exports = router;