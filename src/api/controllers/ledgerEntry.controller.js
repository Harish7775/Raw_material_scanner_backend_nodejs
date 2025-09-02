const db = require("../../models");
const LedgerEntry = db.LedgerEntry;
const Users = db.Users;
const Product = db.Product;
const { Op } = require("sequelize");

exports.createLedgerEntry = async (req, res) => {
  try {
    req.body.CreatedBy = req.user.id;
    req.body.ModifiedBy = req.user.id;

    const ledgerEntry = await LedgerEntry.create(req.body);
    return res
      .status(201)
      .json({ success: true, message: "Ledger Entry Successfully..!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllLedgerEntries = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "LedgerId",
      sortOrder = "DESC",
      userIds,
      fromDate,
      toDate,
      search,
    } = req.query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const userIdsArray = userIds
      ? userIds.split(",").map((id) => parseInt(id))
      : [];

    const whereCondition = {
      ...(userIdsArray.length > 0 && {
        RetailerUserId: {
          [Op.in]: userIdsArray,
        },
      }),
      ...(fromDate &&
        toDate && {
          TransactionDate: {
            [Op.between]: [
              new Date(fromDate),
              new Date(new Date(toDate).setHours(23, 59, 59, 999)),
            ],
          },
        }),
    };

    const includeCondition = [
      {
        model: Users,
        as: "UserDetail",
        attributes: ["FirstName", "LastName"],
        where: {},
      },
      {
        model: Product,
        as: "ProductDetail",
        attributes: ["Name"],
        // where: {},
      },
    ];

    if (search) {
      includeCondition[0].where = {
        [Op.or]: [{ FirstName: { [Op.like]: `%${search}%` } }],
      };
    }

    const ledgerEntries = await LedgerEntry.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
    });

    let userSums = [];
    if (userIdsArray.length > 0) {
      userSums = await Promise.all(
        userIdsArray.map(async (userId) => {
          const creditSum = await LedgerEntry.sum("Amount", {
            where: { RetailerUserId: userId, EntryType: "Credit" },
          });

          const debitSum = await LedgerEntry.sum("Amount", {
            where: { RetailerUserId: userId, EntryType: "Debit" },
          });

          return {
            userId,
            creditSum: creditSum || 0,
            debitSum: debitSum || 0,
            netAmount: (creditSum || 0) - (debitSum || 0),
          };
        })
      );
    }

    return res.status(200).json({
      success: true,
      ledgerEntries: ledgerEntries.rows,
      userSums,
      totalItems: ledgerEntries.count,
      totalPages: Math.ceil(ledgerEntries.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLedgerEntryById = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntry = await LedgerEntry.findOne({
      where: { LedgerId: id },
      include: [{ model: Product, as: "ProductDetail", attributes: ["Name"] }],
    });

    if (!ledgerEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger entry not found" });
    }

    return res.status(200).json({ success: true, ledgerEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLedgerEntry = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      EntryType,
      Amount,
      TransactionDate,
      Unit,
      PersonalNote,
      ProductId,
    } = req.body;

    const [updated] = await LedgerEntry.update(
      { EntryType, Amount, TransactionDate, Unit, PersonalNote, ProductId },
      {
        where: { LedgerId: id },
      }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger entry not found" });
    }
    req.body.ModifiedBy = req.user.id;
    const updatedLedgerEntry = await LedgerEntry.findByPk(id);
    return res.status(200).json({ success: true, updatedLedgerEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteLedgerEntry = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await LedgerEntry.destroy({
      where: { LedgerId: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger entry not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Ledger entry deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLedgerEntryByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntryByUser = await LedgerEntry.findAll({
      where: { RetailerUserId: id },
      order: [["createdAt", "DESC"]],
    });

    if (!ledgerEntryByUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const creditSum = await LedgerEntry.sum("Amount", {
      where: { RetailerUserId: id, EntryType: "Credit" },
    });

    const debitSum = await LedgerEntry.sum("Amount", {
      where: { RetailerUserId: id, EntryType: "Debit" },
    });

    const total = (creditSum || 0) - (debitSum || 0);

    return res.status(200).json({ success: true, ledgerEntryByUser, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
