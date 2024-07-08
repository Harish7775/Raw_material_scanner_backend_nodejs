const express = require('express')
const categoryController = require('../controllers/category.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/addCategory', validateRole(["Admin"]), validate(createCategorySchema, 'body'), categoryController.createCategory);
router.get('/getCategories', validateRole(["Admin"]), validate(getRecordsSchema, 'query'), categoryController.getAllCategories);
router.get('/getCategoryById/:id', validateRole(["Admin"]), validate(idSchema, 'params'), categoryController.getCategoryById);
router.put('/updateCategory/:id', validateRole(["Admin"]), validate(updateCategorySchema, 'body'), categoryController.updateCategory);
router.delete('/deleteCategory/:id', validateRole(["Admin"]), validate(idSchema, 'params'), categoryController.deleteCategory);


module.exports = router;