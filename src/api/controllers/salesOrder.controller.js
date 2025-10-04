const db = require("../../models");
const SalesOrder = db.SalesOrder;
const SalesOrderItem = db.SalesOrderItem;
const PurchaseOrder = db.PurchaseOrder;
const { Op } = require("sequelize");
const Product = db.Product;
const Users = db.Users;
const LedgerEntry = db.LedgerEntry;

exports.createSalesOrder = async (req, res) => {
  try {
    const { CustomerId, PurchaseOrderId, items } = req.body;

    const CreatedBy = req.user.id;
    const OrderDate = new Date();

    const currentYear = new Date().getFullYear();

    const lastOrder = await SalesOrder.findOne({
      order: [["SalesOrderId", "DESC"]],
      attributes: ["SalesOrderId"],
    });

    const lastId = lastOrder ? lastOrder.SalesOrderId : 0;

    const OrderNumber = `${currentYear}/SO/${lastId + 1}`;

    let TotalAmount = 0;

    const salesOrder = await SalesOrder.create({
      OrderNumber,
      CustomerId,
      OrderDate,
      TotalAmount,
      //   Status,
      CreatedBy,
      PurchaseOrderId,
    });

    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const itemTotal = item.UnitPrice * item.Quantity;
        TotalAmount += itemTotal;

        return {
          SalesOrderId: salesOrder.SalesOrderId,
          ProductId: item.ProductId,
          Quantity: item.Quantity,
          UnitPrice: item.UnitPrice,
        };
      })
    );

    salesOrder.TotalAmount = TotalAmount;
    await salesOrder.save();

    await SalesOrderItem.bulkCreate(detailedItems);

    res.status(201).json({
      success: true,
      message: "Sales Order created successfully",
      data: salesOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "DESC",
      fromDate,
      toDate,
      retailer,
      search,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let where = {};

    // Date filtering
    if (fromDate && toDate) {
      where.OrderDate = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    } else if (fromDate) {
      where.OrderDate = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      where.OrderDate = { [Op.lte]: new Date(toDate) };
    }

    // Filter by retailer
    if (retailer) {
      where.CustomerId = retailer;
    }

    // Filter by status
    if (status) {
      where.Status = status;
    }

    // Search by OrderNumber only
    if (search) {
      where.OrderNumber = { [Op.like]: `%${search}%` };
    }

    const { count, rows: salesOrders } = await SalesOrder.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: "Customer",
          attributes: ["UserId", "FirstName", "LastName", "Email"],
          required: false,
        },
        {
          model: PurchaseOrder,
          attributes: ["PurchaseOrderId", "OrderNumber", "Status"],
          required: false,
        },
        {
          model: SalesOrderItem,
          as: "items",
          separate: true,
          required: false,
          include: [
            {
              model: Product,
              attributes: ["ProductId", "Name"],
              required: false,
            },
          ],
        },
      ],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true, // needed because of the include
      subQuery: false, // ensures proper pagination
    });

    res.status(200).json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: salesOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const salesOrder = await SalesOrder.findOne({
      where: { SalesOrderId: id },
      include: [
        {
          model: Users,
          as: "Customer",
          attributes: ["UserId", "FirstName", "LastName"],
        },
        {
          model: PurchaseOrder,
          attributes: ["PurchaseOrderId", "OrderNumber", "Status"],
        },
        {
          model: SalesOrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "Product",
              attributes: ["ProductId", "Name"],
            },
          ],
        },
      ],
    });

    if (!salesOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Sales Order not found" });
    }

    res.status(200).json({ success: true, data: salesOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;
    const salesOrder = await SalesOrder.findByPk(id);
    if (!salesOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Sales Order not found" });
    }
    salesOrder.Status = Status;
    await salesOrder.save();

    if(Status === "Delivered"){
      const ledgerEntry = await LedgerEntry.create({
        EntryType: "Debit",
        Amount: salesOrder.TotalAmount,
        RetailerUserId: salesOrder.CustomerId,
        TransactionDate: new Date(),
        SalesOrderId: salesOrder.SalesOrderId
      })
    }
       
    res.status(200).json({
      success: true,
      message: "Sales Order updated successfully",
      data: salesOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesOrderByPurchaseOrderId = async (req, res) => {
  try {
    const purchaseOrderId = req.params.id;

    const salesOrders = await SalesOrder.findOne({
      where: { PurchaseOrderId: purchaseOrderId },
      include: [
        {
          model: Users,
          as: "Customer",
          attributes: ["UserId", "FirstName", "LastName"],
        },
        {
          model: PurchaseOrder,
          attributes: ["PurchaseOrderId", "OrderNumber", "Status"],
        },
        {
          model: SalesOrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "Product",
              attributes: ["ProductId", "Name"],
            },
          ],
        },
      ],
    });

    res.status(200).json({ success: true, data: salesOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesOrdersByCustomer = async (req, res) => {
  try {
    const userId = req.user.id;

    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
      fromDate,
      toDate,
      status,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // Base where clause
    let whereClause = { CustomerId: userId };

    // Date filtering
    if (fromDate && toDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    } else if (fromDate) {
      whereClause.createdAt = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      whereClause.createdAt = { [Op.lte]: new Date(toDate) };
    }

    // Status filter
    if (status) {
      whereClause.Status = status;
    }

    // Search by OrderNumber only
    if (search) {
      whereClause.OrderNumber = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await SalesOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: "Customer",
          attributes: ["UserId", "FirstName", "LastName"],
        },
        {
          model: PurchaseOrder,
          attributes: ["PurchaseOrderId", "OrderNumber", "Status"],
        },
        {
          model: SalesOrderItem,
          as: "items",
          separate: true,
          include: [
            {
              model: Product,
              as: "Product",
              attributes: ["ProductId", "Name"],
            },
          ],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true, // ensures correct pagination with includes
      subQuery: false,
    });

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalRecords: count,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

