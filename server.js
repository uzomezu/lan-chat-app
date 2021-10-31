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

    let clients = []; // clients entering the chat
    let messages = []; // chat messages

var server = http.createServer(async function(req,res){
    
    const application_json = {
        "Content-Type" : "application/json", 
        "Connection" : "keep-alive",
        'Cache-Control': 'no-cache',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Max-Age": 2592000, // 30 days
    };
    const text_html = {
        "Content-Type" : "text/html",
        "Connection" : "keep-alive",
        'Cache-Control': 'no-cache',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Max-Age": 2592000, // 30 days
    };
    const event_stream = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Max-Age": 2592000, // 30 days
          };
    
    if (req.url == "/register" && req.method == "POST") {
        req.body = await requestBody(req,res); // Grab the body as JSON
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
        req.body = await requestBody(req,res); // Grab the body as JSON
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
    } else if (req.url == '/chat') {
        
            // Good request
            res.writeHead(200, event_stream);
            // Grab messages
            let data = `data: ${JSON.stringify(messages)}\n\n`;
            //send data 
            res.write(data);
            const clientId = new Date();
            const newClient = { 
                id : clientId,
                res
            };
            clients.push(newClient);
            req.on('end', () => {
                console.log(`${clientId} has closed their connection.`)
                clients = clients.filter((client)=>client.id !== clientId)
            })
            res.end();
            
    } else if (req.url == '/message' && req.method == "POST"){
        req.body = await requestBody(req,res); // Grab the body as JSON
        const message = req.body; //grab req body of user request
        const sendEventToAll = (newMessage) => {
            return clients.forEach(client => {
                client.res.end((`data: ${JSON.stringify(newMessage)}\n\n`))
            });
        }
        console.log(message);
        messages.push(message);
        res.writeHead(201, application_json);
        res.end(JSON.stringify(message));
        return sendEventToAll(message);
        
    } else if (req.url == '/random') {
        res.writeHead(200, application_json);
        res.write(JSON.stringify({"message" : "random data"}));
        res.end();
    } else if (req.url == "/") {
        res.writeHead(200, text_html);
        console.log(req.socket.localAddress);
        res.write(fs.readFileSync('./index.html', 'utf8').toString());
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

