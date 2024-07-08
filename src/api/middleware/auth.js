const jwt = require('jsonwebtoken')
 
const constants = require('../../helper/constants')
const config = require('../../helper/config')
const Login = require('../../models/loginModel')

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        if(!token){
            return res.status(401).json({ error: 'Token is required' });
        }
        const data = jwt.verify(token, config.JWT_KEY)
        req.user = data
        req.token = token
        next()
    } catch (error) {
        res.status(200).send({ statusCode : 500, message: constants.auth.not_authorize })
    }

}
module.exports = auth