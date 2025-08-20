const db = require("../../models");
const SalesOrder = db.SalesOrder;
const SalesOrderItem = db.SalesOrderItem;
const PurchaseOrder = db.PurchaseOrder;
const { Op } = require("sequelize");
const Product = db.Product;
const Users = db.Users;

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
      // TotalAmount,
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

    if (fromDate && toDate) {
      where.OrderDate = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.OrderDate = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.OrderDate = { [Op.lte]: toDate };
    }

    if (retailer) {
      where.CustomerId = retailer;
    }

    if (status) {
      where.Status = status;
    }

    if (search) {
      where[Op.or] = [
        { OrderNumber: { [Op.like]: `%${search}%` } },
      ];
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
      distinct: true,
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

    let whereClause = { CustomerId: userId };

    if (fromDate && toDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    } else if (fromDate) {
      whereClause.createdAt = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      whereClause.createdAt = { [Op.lte]: new Date(toDate) };
    }

    if(status) {
      whereClause.Status = status;
    }

    let itemInclude = {
      model: SalesOrderItem,
      as: "items",
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ["ProductId", "Name"],
          // where: search
          //   ? {
          //       Name: { [Op.like]: `%${search}%` },
          //     }
          //   : undefined,
        },
      ],
    };

    const { count, rows } = await SalesOrder.findAndCountAll({
      where: {
        ...whereClause,
        ...(search
          ? {
              OrderNumber: { [Op.like]: `%${search}%` },
            }
          : {}),
      },
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
        itemInclude,
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
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
