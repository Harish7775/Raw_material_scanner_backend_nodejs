const express = require('express')
const roleController = require('../controllers/role.controller')
const router = express.Router()


router.post('/addRole', roleController.createRole);
router.delete('/deleteRole/:id', roleController.deleteRole);
 

module.exports = router;