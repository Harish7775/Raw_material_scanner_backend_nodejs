const db = require('../../models')
const Roles = db.Roles;

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;

    const existingRole = await Roles.findOne({ where: { Name: name } });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role name already exists' });
    }

    const newRole = await Roles.create({
      Name: name,
    });

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role: newRole,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const id = req.params.id;

    const role = await Roles.findByPk(id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    await role.destroy();

    return res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};