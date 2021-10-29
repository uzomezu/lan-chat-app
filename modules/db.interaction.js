const mongoose = require('mongoose');
const User = require('../models/User');
const { hashPassword, generateToken } = require('../middlewear/src/AuthController');
require('dotenv').config();

module.exports = {
    createNewUser : async (req, res) => {
        // API only reaches this point if pass and email are valid
        const existingUser = await User.findOne({
            email : req.body.email,
        });
        if (existingUser) {
            console.log(existingUser);
            return null;
        } else {
            const cryptoPassword = hashPassword(req.body.pass, process.env.SALT); // Hash the users pass
            const newUser = await new User({
                email : req.body.email, 
                pass : cryptoPassword.passwordHash
            });
            await newUser.save();
            console.log(newUser);
            return newUser;
        }
    },
    logIn : async (req,res) => {
        const cryptoPassword = hashPassword(req.body.pass, process.env.SALT); // Hash the users pass
        
        const existingUser = await User.findOne({
            email : req.body.email, // Find me a user with email from body
        });
        
        if (existingUser && existingUser.pass === cryptoPassword.passwordHash) {
            // User has provided a valid password
            const myToken = generateToken(existingUser);
            return {
                user : existingUser,
                token : myToken
            };
        } else {
            return null;
        }
    }
}
