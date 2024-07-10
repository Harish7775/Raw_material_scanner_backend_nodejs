const express = require('express')
const userController = require('../controllers/user.controller');
const { validate } = require('../../helper/customValidation');
const validateRole = require('../middleware/role');
const { loginSchema } = require('../validators/auth.validator');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/addUser', userController.createUser);
router.post('/adminLogin',validate(loginSchema, "body"), userController.adminLogin);
router.post('/forgetPassword', userController.forgetPassword);
router.post('/resetPassword/:UserId/:Token', userController.resetPassword);
router.get('/getAllUsers', validateRole(["Admin", "Retailer"]), validate(getRecordsSchema, 'query'), userController.getAllUsers);
router.get('/getUserById/:id', validate(idSchema, 'params'), userController.getUserById);
router.put('/updateUser/:id', validateRole(["Admin", "Retailer"]), validate(updateUserSchema, 'body'), userController.updateUser);
router.delete('/deleteUser/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), userController.deleteUser);
router.get('/getRetailerDetailById/:id', validate(idSchema, 'params'), userController.getRetailerDetailById);
router.get('/getDashboardStats', userController.getDashboardStats);


module.exports = router;