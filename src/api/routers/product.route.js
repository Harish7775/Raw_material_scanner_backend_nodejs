const express = require('express');
const productController = require('../controllers/product.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { createProductSchema, updateProductSchema, getAllProductSchema } = require("../validators/product.validator");
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/addProduct', validateRole(["Admin"]), validate(createProductSchema, 'body'), productController.createProduct);
router.post('/getProducts', validateRole(["Admin"]), validate(getAllProductSchema, 'body'), productController.getAllProducts);
router.get('/getProductById/:id', validateRole(["Admin"]), validate(idSchema, 'params'), productController.getProductById);
router.put('/updateProduct/:id', validateRole(["Admin"]), validate(updateProductSchema, 'body'), productController.updateProduct);
router.delete('/deleteProduct/:id', validateRole(["Admin"]), validate(idSchema, 'params'), productController.deleteProduct);


module.exports = router;