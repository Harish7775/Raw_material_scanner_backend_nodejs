const express = require('express')
const couponController = require('../controllers/coupon.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { createCouponSchema, updateCouponSchema, getRoleByCouponSchema } = require("../validators/coupon.validator");
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router()

router.post('/addCoupon', validateRole(["Admin"]), validate(createCouponSchema, 'body'), couponController.createCoupon);
router.post('/getCoupons', validateRole(["Admin"]), couponController.getAllCoupons);
router.get('/getCouponById/:id', validateRole(["Admin"]), validate(idSchema, 'params'), couponController.getCouponById);
router.put('/updateCoupon/:id', validateRole(["Admin", "Retailer"]), validate(updateCouponSchema, 'body'), couponController.updateCoupon);
router.delete('/deleteCoupon/:id', validateRole(["Admin"]), validate(idSchema, 'params'), couponController.deleteCoupon);
router.get('/getRedeemCoupons/:id', validate(idSchema, 'params'), couponController.getCoupons);
router.get('/getCouponByRole/:name', validate(getRoleByCouponSchema, 'params'), couponController.getCouponByRole);
router.get('/getQrCodeHistory/:id', validate(idSchema, 'params'), couponController.getQrCodeHistory);

module.exports = router;