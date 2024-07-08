const express = require('express')
const companyController = require('../controllers/company.controller');
const validateRole = require('../middleware/role');
const { validate } = require('../../helper/customValidation');
const { createCompanySchema, updateCompanySchema } = require("../validators/company.validator")
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const router = express.Router();


router.post('/addCompany', validateRole(["Admin"]), validate(createCompanySchema, 'body'), companyController.createCompany);
router.get('/getCompanies', validateRole(["Admin"]), validate(getRecordsSchema, 'query'), companyController.getAllCompanies);
router.get('/getCompanyById/:id', validateRole(["Admin"]), validate(idSchema, 'params'), companyController.getCompanyById);
router.put('/updateCompany/:id', validateRole(["Admin"]), validate(updateCompanySchema, 'body'), companyController.updateCompany);
router.delete('/deleteCompany/:id', validateRole(["Admin"]), validate(idSchema, 'params'), companyController.deleteCompany);


module.exports = router;