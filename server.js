'use strict';

const http = require('http');
const net = require('net');
const AuthController = require("./middlewear/src/AuthController");
const DbInteraction = require('./modules/db.interaction');
const {requestBody} = require('./modules/consume.data');
const validator = require('./modules/validator');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const { Buffer } = require('buffer');
const dbInteraction = require('./modules/db.interaction');

mongoose.connect(process.env.MONGO_URI,
    {
        useNewUrlParser : true,
        useUnifiedTopology : true,
        // useCreateIndex : true
    }, (err)=>{
    if (err) {
        throw err
    } else {
        console.log("Mongo DB Atlas has Connected!!")
    }
})


var server = http.createServer(async function(req,res){
    
    const application_json = {
        "Content-Type" : "application/json", 
        "Connection" : "keep-alive",
        'Cache-Control': 'no-cache'};
    const text_html = {
        "Content-Type" : "text/html",
        "Connection" : "keep-alive",
        'Cache-Control': 'no-cache'};

    let clients = []; // clients entering the chat
    let messages = []; // chat messages
    if (req.url == "/register" && req.method == "POST") {
        req.body = await requestBody(req,res);
        console.log(req.headers);
        if (req.body.email && req.body.pass) {
            var errors = validator({
                email : req.body.email,
                pass : req.body.pass})
            if (errors.length > 0 ) {
                res.writeHead(401, application_json);
                const response = {
                    "message" : "Invalid Email or Pass",
                    errors : errors,
                }
                res.end(JSON.stringify(response));
            } else {
                
                // DB interaction
                
                const user = await DbInteraction.createNewUser(req, res);
                if (user == null) {
                    res.writeHead(301, {"Content-Type" : "application/json"});
                    const data = {"message" : "Error! User already exists with this email"};
                    res.end(JSON.stringify(data));
                } else {
                    
                    // Generate an Auth Token

                    const myToken = AuthController.generateToken(user);

                    //
                    res.writeHead(201, application_json);
                    res.end(JSON.stringify({"message" : "Success! user has been registered", "user" : user, "authToken" : myToken}));
                }
                

            }
        } else {
            res.writeHead(500, application_json);
            res.end(JSON.stringify({"message" : "Error ! missing username, email, or password"}))
        }

    } else if (req.url == "/login" && req.method == "POST") {
        req.body = await requestBody(req,res);
        if (req.body.email && req.body.pass) {
            var errors = validator({
                email : req.body.email,
                pass : req.body.pass})
            if (errors.length > 0 ) {
                res.writeHead(401, application_json);
                const response = {
                    message : "Invalid Email or Pass",
                    errors : errors,
                }
                res.end(JSON.stringify(response));
            } else {
              const user = await dbInteraction.logIn(req,res);
              if (user == null) {
                  res.writeHead(401, application_json);
                  res.write(JSON.stringify({message: "Invalid email or password"}));
                  res.end();
              } else {
                  res.writeHead(200, application_json);
                  res.write(JSON.stringify(user));
                  res.end();
              }
            }
        } else {
            res.writeHead(500, application_json);
            console.log(req.body);
            res.end(JSON.stringify({message : "Invalid Credentials: no username or password"}));
        }
        
    } else if (req.url == "/logout") {
        req.body = await requestBody(req,res);
        console.log(req);

    } else if (req.url == "/me") {
        
       if (req.method == "GET") {
        const isAuthorized = await AuthController.isAuth(req,res);
        if (isAuthorized == null) {
            res.writeHead(401, application_json);
            res.write(JSON.stringify({"message" : "Error! User is unautorized. please go to login page"}));
            res.end()
            // res redirect to a login page
        } else {
             res.writeHead(200, application_json);
             res.write(JSON.stringify(isAuthorized));
             res.end()
        }
       } else if (req.method == "DELETE") {

       }
     } else if (req.url == '/events') {

    } else if (req.url == '/message' && req.method == "POST"){

    }
    else if (req.url == "/") {

        
        res.writeHead(200, text_html);
        res.write(`<h1>Hello World!</h1>`)
        res.end();
    } else {
        res.writeHead(500, application_json);
        res.write("Invalid Request");
        res.end();
    }
}).listen(process.env.PORT, ()=>{console.log("Your Sever is connected on PORT: ", process.env.PORT)})

server.on("connection", (req, socket, head)=>{
    console.log("Hey There! New Connection in bound...");
    console.log(head);
})

