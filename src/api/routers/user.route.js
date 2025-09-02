const express = require('express')
const userController = require('../controllers/user.controller');
const { validate } = require('../../helper/customValidation');
const validateRole = require('../middleware/role');
const { loginSchema } = require('../validators/auth.validator');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/addUser', validateRole(["Admin", "Retailer"]), validate(createUserSchema, "body"), userController.createUser);
router.post('/adminLogin',validate(loginSchema, "body"), userController.adminLogin);
router.post('/sendOtp', userController.sendOtp);
router.post('/verifyOtp', userController.verifyOtp);
router.post('/forgetPassword', userController.forgetPassword);
router.post('/changePassword', userController.changePassword);
router.post('/resetPassword/:UserId/:Token', userController.resetPassword);
router.get('/getAllUsers', validateRole(["Admin", "Retailer"]), userController.getAllUsers);
router.get('/getUserById/:id', validate(idSchema, 'params'), userController.getUserById);
router.put('/updateUser/:id', validateRole(["Admin", "Retailer"]), validate(updateUserSchema, 'body'), userController.updateUser);
router.delete('/deleteUser/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), userController.deleteUser);
router.get('/getRetailerDetailById/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), userController.getRetailerDetailById);
router.get('/getDashboardStats', validateRole(["Admin", "Retailer"]), userController.getDashboardStats);
router.get('/getRetailerStats', validateRole(["Admin", "Retailer"]), userController.getRetailerStats);
router.get('/getMessonStats', validateRole(["Admin", "Mason"]), userController.getMessonStats);


module.exports = router;