const db = require("../../models");
const Ledger = db.Ledger;
const Users = db.Users;
const { Op } = require("sequelize");

exports.createLedgerEntry = async (req, res) => {
  try {
    //req.body.CreatedBy = req.user.id;
    //req.body.ModifiedBy = req.user.id;
    const ledgerEntry = await Ledger.create(req.body);
    return res
      .status(201)
      .json({ success: true, message: "Ledger Entry Successfully..!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllLedgerEntries = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "LedgerId",
      sortOrder = "DESC",
      userIds = [],
    } = req.query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const whereCondition = {
      ...(userIds.length > 0 && {
        UserId: {
          [Op.in]: userIds,
        },
      }),
    };

    const ledgerEntries = await Ledger.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Users, as: "User", attributes: ["FirstName", "LastName"] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
    });
    const result = await Ledger.findOne({
      where: { UserId: 1 },
      include: [
        { model: Users, as: "User", attributes: ["FirstName", "LastName"] },
      ],
    });

    return res.status(200).json({
      success: true,
      ledgerEntries: ledgerEntries.rows,
      totalItems: ledgerEntries.count,
      totalPages: Math.ceil(ledgerEntries.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getLedgerEntryById = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntry = await Ledger.findOne({ where: { LedgerId: id } });

    if (!ledgerEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger entry not found" });
    }

    return res.status(200).json({ success: true, ledgerEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateLedgerEntry = async (req, res) => {
  try {
    const id = req.params.id;
    const { EntryType, Amount } = req.body;

    const [updated] = await Ledger.update(
      { EntryType, Amount },
      {
        where: { LedgerId: id },
      }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger entry not found" });
    }
    //req.body.ModifiedBy = req.user.id;
    const updatedLedgerEntry = await Ledger.findByPk(id);
    return res.status(200).json({ success: true, updatedLedgerEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteLedgerEntry = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Ledger.destroy({
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
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getLedgerEntryByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntryByUser = await Ledger.findAll({ where: { UserId: id } });

    if (!ledgerEntryByUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, ledgerEntryByUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
