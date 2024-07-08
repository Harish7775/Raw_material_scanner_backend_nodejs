 
 
const config = require('../../helper/config')
const jwt =require ('jsonwebtoken')
const {User}  = require("../../models")
// Register an user
exports.register = async (req, res) => {
  try {
     
    
    const user = await  User.create(req.body);
 
   
    return res.status(200).send({ message:  'success',success:true});
  } catch (error) {
    return res.status(404).send({ error: error.message,success:false });
  }
};

 

 


 





