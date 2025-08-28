const db = require("../../models");
const PurchaseOrder = db.PurchaseOrder;
const PurchaseOrderItem = db.PurchaseOrderItem;
const Product = db.Product;
const Users = db.Users;
const SalesOrder = db.SalesOrder;
const { Op, Sequelize } = require("sequelize");

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const CreatedBy = req.user.id;

    const currentYear = new Date().getFullYear();

    const lastOrder = await PurchaseOrder.findOne({
      order: [["PurchaseOrderId", "DESC"]],
      attributes: ["PurchaseOrderId"],
    });

    const lastId = lastOrder ? lastOrder.PurchaseOrderId : 0;

    const OrderNumber = `${currentYear}/PO/${lastId + 1}`;
    const OrderDate = new Date();

    let TotalAmount = 0;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findByPk(item.ProductId);

        if (!product)
          throw new Error(`Product with ID ${item.ProductId} not found`);

        const itemTotal = product.Price * item.Quantity;
        TotalAmount += itemTotal;

        return {
          ProductId: item.ProductId,
          Quantity: item.Quantity,
          UnitPrice: product.Price,
        };
      })
    );

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      OrderNumber,
      OrderDate,
      TotalAmount,
      CreatedBy,
    });

    // Add items to purchase order
    for (const item of detailedItems) {
      await PurchaseOrderItem.create({
        ...item,
        PurchaseOrderId: purchaseOrder.PurchaseOrderId,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Purchase order created successfully. Order Number: ${OrderNumber}`,
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fromDate,
      toDate,
      search,
      retailer,
      status,
      orderBy = "createdAt",
      order = "DESC",
    } = req.query;
    const offset = (page - 1) * limit;

    // Base where conditions
    const where = {};

    // Date filtering
    if (fromDate && toDate) {
      where.OrderDate = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    } else if (fromDate) {
      where.OrderDate = {
        [Op.gte]: new Date(fromDate),
      };
    } else if (toDate) {
      where.OrderDate = {
        [Op.lte]: new Date(toDate),
      };
    }

    if (retailer) {
      where.CreatedBy = retailer;
    }

    if (status) {
      where.Status = status;
    }

    // Search functionality - will be added separately
    let searchCondition = null;
    if (search) {
      searchCondition = {
        [Op.or]: [
          { OrderNumber: { [Op.iLike]: `%${search}%` } },
          { "$items.Product.Name$": { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    // Combine conditions
    const finalWhere = searchCondition
      ? { [Op.and]: [where, searchCondition] }
      : where;

    const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll(
      {
        where: finalWhere,
        include: [
          {
            model: PurchaseOrderItem,
            as: "items",
            required: false,
            include: [
              {
                model: Product,
                attributes: ["Name"],
                required: false,
              },
            ],
          },
          {
            model: Users,
            attributes: ["FirstName", "LastName"],
          },
          {
            model: SalesOrder,
            as: "SalesOrder",
            attributes: ["SalesOrderId", "OrderNumber", "OrderDate", "TotalAmount"],
            required: false,
          },
        ],
        order: [[orderBy, order]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true,
        subQuery: false, // Important for complex queries
      }
    );

    const purchaseOrdersWithItemCount = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      itemsCount: po.items?.length || 0,
    }));

    return res.status(200).json({
      success: true,
      data: purchaseOrdersWithItemCount,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getPurchaseOrders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          as: "items",
          include: [{ model: Product, attributes: ["Name"] }],
        },
        {
          model: Users,
          attributes: ["FirstName", "LastName"],
        },
        {
          model: SalesOrder,
          as: "SalesOrder",
          attributes: ["OrderNumber", "OrderDate", "TotalAmount"],
          required: false,
        },
      ],
    });

    if (!purchaseOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    return res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseOrdersHistory = async (req, res) => {
  try {
    const CreatedBy = req.user.id;
    const {
      fromDate,
      toDate,
      search = "",
      page = 1,
      limit = 10,
      orderBy = "createdAt",
      order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build dynamic conditions
    const whereCondition = {
      CreatedBy,
    };

    if (fromDate && toDate) {
      whereCondition.OrderDate = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    } else if (fromDate) {
      whereCondition.OrderDate = {
        [Op.gte]: new Date(fromDate),
      };
    } else if (toDate) {
      whereCondition.OrderDate = {
        [Op.lte]: new Date(toDate),
      };
    }

    const purchaseOrders = await PurchaseOrder.findAndCountAll({
      include: [
        {
          model: PurchaseOrderItem,
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["Name"],
              where: search
                ? {
                    Name: {
                      [Op.like]: `%${search}%`,
                    },
                  }
                : undefined,
            },
          ],
        },
        {
          model: SalesOrder,
          as: "SalesOrder",
          attributes: ["OrderNumber", "OrderDate", "TotalAmount"],
          required: false,
        },
      ],
      where: whereCondition,
      order: [[orderBy, order]],
      offset,
      limit: parseInt(limit),
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      total: purchaseOrders.count,
      page: parseInt(page),
      pages: Math.ceil(purchaseOrders.count / limit),
      data: purchaseOrders.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePurchaseOrderStatus = async (req, res) => {
  const PurchaseOrderId = req.params.id;
  const { Status } = req.body;

  try {
    const purchaseOrder = await PurchaseOrder.findByPk(PurchaseOrderId);

    if (!purchaseOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    purchaseOrder.Status = Status;
    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: "Purchase order status updated successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePurchaseOrderItemsQuantity = async (req, res) => {
  const PurchaseOrderId = req.params.id;
  const { items, status } = req.body;

  try {
    const purchaseOrder = await PurchaseOrder.findByPk(PurchaseOrderId, {
      include: [{ model: PurchaseOrderItem, as: "items" }],
    });

    if (purchaseOrder.Status !== "Pending") {
      return res.status(404).json({
        success: false,
        message: "Only purchase orders with status 'Pending' can be updated.",
      });
    }

    if (status) {
      purchaseOrder.Status = status;
    }

    let newTotalAmount = 0;

    for (const item of items) {
      const orderItem = await PurchaseOrderItem.findOne({
        where: {
          PurchaseOrderItemId: item.PurchaseOrderItemId,
          PurchaseOrderId,
        },
      });

      if (orderItem) {
        orderItem.Quantity = item.Quantity;
        await orderItem.save();

        const quantity = parseFloat(item.Quantity);
        const unitPrice = parseFloat(orderItem.UnitPrice);
        newTotalAmount += quantity * unitPrice;
      }
    }

    if (newTotalAmount > 0) {
      purchaseOrder.TotalAmount = newTotalAmount;
    }
    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: "Purchase order item quantities updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// exports.updatePurchaseOrder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { items } = req.body;

//     const purchaseOrder = await PurchaseOrder.findByPk(id);

//     if (!purchaseOrder) {
//       return res.status(404).json({ success: false, message: "Purchase order not found" });
//     }

//     if (!items || items.length === 0) {
//       return res.status(400).json({ success: false, message: "No items provided" });
//     }

//     let TotalAmount = 0;

//     const detailedItems = await Promise.all(
//       items.map(async (item) => {
//         const product = await Product.findByPk(item.ProductId);

//         if (!product)
//           throw new Error(`Product with ID ${item.ProductId} not found`);

//         const itemTotal = product.Price * item.Quantity;
//         TotalAmount += itemTotal;

//         return {
//           ProductId: item.ProductId,
//           Quantity: item.Quantity,
//           UnitPrice: product.Price,
//         };
//       })
//     );

//     // Update purchase order
//     purchaseOrder.TotalAmount = TotalAmount;
//     await purchaseOrder.save();

//     // Delete existing items
//     await PurchaseOrderItem.destroy({ where: { PurchaseOrderId: id } });

//     // Add new items to purchase order
//     for (const item of detailedItems) {
//       await PurchaseOrderItem.create({
//         ...item,
//         PurchaseOrderId: purchaseOrder.id,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Purchase order updated successfully",
//       data: purchaseOrder,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// }
