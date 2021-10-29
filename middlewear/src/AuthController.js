'use strict'
const crypto = require('crypto');
const fs = require('fs');
const { Buffer } = require('buffer');
const User = require('../../models/User');
const userRoles = require('../../user.roles.json');
const { use } = require('../../../mp4-to-mp3/routes/ytbe.to.mp3.routes');
require('dotenv').config();
const AuthController = {
    /**
     * generates a random string of characters i.e. salt
     * @function
     * param {number} length - how long the random string will be
     */
    generateSalt : (length) => {
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex')
            .slice(0,length)
    },
    /**
     * hash password with sha512
     * @function
     * param {string} password - the users unhashed password
     * param {salt} password - the generated salt
     */
    hashPassword : (password, salt) => {
        let hash = crypto.createHmac('sha512', salt); // algorithm for hashing
        hash.update(password);
        let value = hash.digest('hex');
        return {
            salt : salt,
            passwordHash : value
        }
    },
    createBuffer : (str) => {
        return Buffer.from(str).toString('base64');
    },
    
    bufferDecode : (buffer) => {
        return JSON.parse(Buffer.from(buffer, 'base64').toString('ascii'))
    },
    
    generateToken : (user) => {
        var exp, iat, roles, myRoles;
        roles = userRoles;
        if (user.isAdmin == true) {
            myRoles = roles.isAdmin.privilidges
        } else {
            myRoles = roles.user.privilidges
        }
        iat = new Date(); // Now or whenever token function is called
        exp = new Date(iat + process.env.TOKEN_EXP);
        const tokenBody = JSON.stringify({
            id : user.id,
            roles : myRoles, 
            iat : iat, 
            exp : exp,
        })
        const myToken = Buffer.from(tokenBody).toString('base64');
        return myToken;
    },
    isAuth : async (req,res,cb) => {
        const authHeader = req.headers.authorization.split(" ");
        
        const bufferDecode = JSON.parse(Buffer.from(authHeader[1], 'base64').toString('ascii'));
        console.log("Decoded Token Buffer: ", bufferDecode);
        const userObj = await User.findById(bufferDecode.id);
        const now = new Date();
        if (userObj && now < bufferDecode.exp) {
            return userObj
        } else {
            return null
        }


    },
    isAdministrator : (req,res,cb) => {
        const authHeader = req.headers.authorization.split(" ");
    }
}

module.exports = AuthController;