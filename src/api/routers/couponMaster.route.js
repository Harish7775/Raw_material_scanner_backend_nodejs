const express = require('express')
const couponMasterController = require('../controllers/couponMaster.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { updateCouponMasterSchema } = require("../validators/couponMaster.validator");
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router()

router.post('/getAllCouponMasters', validateRole(["Admin"]), couponMasterController.getAllCouponMasters);
router.get('/getCouponMasterById/:id', validateRole(["Admin"]), validate(idSchema, 'params'), couponMasterController.getCouponMasterById);
router.put('/updateCouponMaster/:id', validateRole(["Admin"]), validate(updateCouponMasterSchema, 'body'), couponMasterController.updateCouponMaster);
// router.delete('/deleteCoupon/:id', validateRole(["Admin"]), validate(idSchema, 'params'), couponController.deleteCoupon);
router.delete('/removeFileFromCouponMaster/:id', validateRole(["Admin"]), validate(idSchema, 'params'), couponMasterController.removeFileFromCouponMaster);

module.exports = router;