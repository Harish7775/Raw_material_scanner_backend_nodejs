const express = require('express');
const ledgerController = require('../controllers/ledgerEntry.controller');
const { validate } = require('../../helper/customValidation');
const { getRecordsSchema, idSchema } = require('../validators/common.validator');
const { createLedgerEntrySchema, updateLedgerEntrySchema } = require("../validators/ledgerEntry.validator");
const router = express.Router();

router.post('/addLedgerEntry', validate(createLedgerEntrySchema, 'body'), ledgerController.createLedgerEntry);
router.get('/getAllLedgerEntries', validate(getRecordsSchema, 'query'), ledgerController.getAllLedgerEntries);
router.get('/getLedgerEntryById/:id', validate(idSchema, 'params'), ledgerController.getLedgerEntryById);
router.put('/updateLedgerEntry/:id', validate(updateLedgerEntrySchema, 'body'), ledgerController.updateLedgerEntry);
router.delete('/deleteLedgerEntry/:id', validate(idSchema, 'params'), ledgerController.deleteLedgerEntry);
router.get('/getLedgerEntryByUserId/:id', validate(idSchema, 'params'), ledgerController.getLedgerEntryByUserId);

module.exports = router;