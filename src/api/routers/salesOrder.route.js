const express = require("express");
const salesOrderController = require("../controllers/salesOrder.controller");
const validateRole = require("../middleware/role");
const router = express.Router();

router.post("/createSalesOrder", validateRole(["Admin", "Retailer"]), salesOrderController.createSalesOrder);
router.get("/getSalesOrders", validateRole(["Admin", "Retailer"]), salesOrderController.getSalesOrders);
router.get("/getSalesOrderById/:id", validateRole(["Admin", "Retailer"]), salesOrderController.getSalesOrderById);
router.get("/getSalesOrderByPOId/:id", validateRole(["Admin", "Retailer"]), salesOrderController.getSalesOrderByPurchaseOrderId);
router.get("/getSalesOrdersByCustomer", validateRole(["Admin", "Retailer"]), salesOrderController.getSalesOrdersByCustomer);
router.put("/updateSalesOrder/:id", validateRole(["Admin"]), salesOrderController.updateSalesOrder);

module.exports = router;