const db = require("../../models");
const LedgerEntry = db.LedgerEntry;
const Users = db.Users;
const { Op } = require("sequelize");

exports.createLedgerEntry = async (req, res) => {
  try {
    //req.body.CreatedBy = req.user.id;
    //req.body.ModifiedBy = req.user.id;
    const ledgerEntry = await LedgerEntry.create(req.body);
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
      userIds,
    } = req.query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const userIdsArray = userIds ? userIds.split(",").map(id => parseInt(id)) : [];

    const whereCondition = {
      ...(userIdsArray.length > 0 && {
        RetailerUserId: {
          [Op.in]: userIdsArray,
        },
      }),
    };

    const ledgerEntries = await LedgerEntry.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Users, as: "UserDetail", attributes: ["FirstName", "LastName"] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
    });

    // const result = await Ledger.findOne({
    //   where: { UserId: 1 },
    //   include: [
    //     { model: Users, attributes: ["FirstName", "LastName"] },
    //   ],
    // });

    return res.status(200).json({
      success: true,
      ledgerEntries: ledgerEntries.rows,
      totalItems: ledgerEntries.count,
      totalPages: Math.ceil(ledgerEntries.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getLedgerEntryById = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntry = await LedgerEntry.findOne({ where: { LedgerId: id } });

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

    const [updated] = await LedgerEntry.update(
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
    const updatedLedgerEntry = await LedgerEntry.findByPk(id);
    return res.status(200).json({ success: true, updatedLedgerEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
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
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getLedgerEntryByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const ledgerEntryByUser = await LedgerEntry.findAll({ where: { RetailerUserId: id } });

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
