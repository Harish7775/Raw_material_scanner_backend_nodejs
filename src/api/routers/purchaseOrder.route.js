const express = require('express')
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const validateRole = require('../middleware/role');
const router = express.Router()

router.post('/createPurchaseOrder', validateRole(["Admin", "Retailer"]), purchaseOrderController.createPurchaseOrder);
router.get('/getPurchaseOrders', validateRole(["Admin", "Retailer"]), purchaseOrderController.getPurchaseOrders);
router.get('/getPurchaseOrderById/:id', validateRole(["Admin", "Retailer"]), purchaseOrderController.getPurchaseOrderById);
router.get('/getPurchaseOrdersHistory', validateRole(["Admin", "Retailer"]), purchaseOrderController.getPurchaseOrdersHistory);
router.put('/updatePOStatus/:id', validateRole(["Admin", "Retailer"]), purchaseOrderController.updatePurchaseOrderStatus);
router.put('/updateQuantity/:id', validateRole(["Admin", "Retailer"]), purchaseOrderController.updatePurchaseOrderItemsQuantity);

module.exports = router;