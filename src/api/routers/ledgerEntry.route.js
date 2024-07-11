const express = require('express');
const ledgerController = require('../controllers/ledgerEntry.controller');
const { validate } = require('../../helper/customValidation');
const validateRole = require('../middleware/role');
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const { createLedgerEntrySchema, updateLedgerEntrySchema } = require("../validators/ledgerEntry.validator");
const router = express.Router();

router.post('/addLedgerEntry', validateRole(["Admin", "Retailer"]), validate(createLedgerEntrySchema, 'body'), ledgerController.createLedgerEntry);
router.get('/getAllLedgerEntries', validateRole(["Admin", "Retailer"]), validate(getRecordsSchema, 'query'), ledgerController.getAllLedgerEntries);
router.get('/getLedgerEntryById/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), ledgerController.getLedgerEntryById);
router.put('/updateLedgerEntry/:id', validateRole(["Admin", "Retailer"]), validate(updateLedgerEntrySchema, 'body'), ledgerController.updateLedgerEntry);
router.delete('/deleteLedgerEntry/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), ledgerController.deleteLedgerEntry);
router.get('/getLedgerEntryByUserId/:id', validateRole(["Admin", "Retailer"]), validate(idSchema, 'params'), ledgerController.getLedgerEntryByUserId);

module.exports = router;