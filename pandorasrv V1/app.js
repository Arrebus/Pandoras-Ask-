'use strict';
//Laboration 2
//3000 för internet
//9000 för standard
let portnr = 3000;
const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);



var cookieParser = require('cookie-parser');
const { Console } = require('console');
const { secureHeapUsed } = require('crypto');
app.use(cookieParser());

let users = [];
const minimumPlayers = 3;


//får inte hashen o funka så detta får duga
let rooms = [];
let roomQ = [];
//simulerar att public är static
app.use('/public', express.static(__dirname + '/static'));
//middleware så vi kan ta emot data
app.use(express.urlencoded({extended : true}));
//sätt igång servern.
server.listen(portnr, function(){
    //console.log('Server live på port: ', portnr);
});

app.get('/', function(req, res){
        res.redirect('/lobby');
});



//spelsida
app.get('/lobby', function(req, res){
        //console.log('ger ut Chattsidan...');
            res.sendFile(__dirname + '/index.html'); 
});

app.use('/client.js', express.static(__dirname + '/client.js'));
io.on('connect', (socket) => {
    //console.log("ansluter användare med id: " + socket.id);
    var roomcode = 0;
    var roombool = false;
    var id = socket.id;
    
    socket.on('joinsrv', function(username){
        users[socket.id] = username
        console.log(users);
    });

    socket.on('joinRoom', function(room){
        //om spel pågår, tillåt inte att gå med.
        roomcode = room;
        
        roombool = true;
        //om den är tom
        if(!rooms[roomcode]){
            console.log("skapar rum: " + roomcode);
            rooms[roomcode] = {"questions" : [], "users" : [], "qIndex" : 0, "gameRunning" : false};
            //boolean för att rum finns?
        }
        if(rooms[roomcode]["gameRunning"] == false){
        socket.join(roomcode);
        socket.emit('joinAcc');
        var newUser = {"username": users[socket.id], "ready": false, "id" : socket.id};
        rooms[roomcode]["users"].push(newUser);
        io.sockets.in(roomcode).emit('updatePlayers', rooms[roomcode]["users"]);
        }else{
            socket.emit('upptaget');
        }

    });
    socket.on('leaveRoom', function(){
        if(roombool){
            for(var user in rooms[roomcode]["users"]){
                if(rooms[roomcode]["users"][user]["id"] == socket.id){
                    rooms[roomcode]["users"].splice(user, 1);
                    socket.emit('leaveRoom');
                    io.sockets.in(roomcode).emit('updatePlayers', rooms[roomcode]["users"]);
                    if(rooms[roomcode]["users"].length < 1){
                        delete rooms[roomcode];
                        console.log("tog bort ett rum, följande rum finns kvar:");
                        console.log(rooms);
                    }
                }
            }
        }
    });

    socket.on('postQuestion', function(question){
        try{
        rooms[roomcode]["questions"].push(question);
        console.log("---FRÅGA---")
        console.log(users[socket.id] + " till " + question["receiver"] + ":");
        console.log(question["question"]);
        console.log("-----------");
        if(rooms[roomcode]["questions"].length == rooms[roomcode]["users"].length){
            rooms[roomcode]["questions"] = shuffleQ(rooms[roomcode]["questions"]);
            console.log(rooms[roomcode]["questions"]);
            io.sockets.in(roomcode).emit('updateQuestions', rooms[roomcode]["questions"]);
            //make everyone inte redo walla
            for(var user in rooms[roomcode]["users"]){
                var u = rooms[roomcode]["users"][user]
                u["ready"] = false;
                console.log(u["username"] + " ready: " + u["ready"]);
            }
            console.log("alla har ställt vasin fråga!");
            rooms[roomcode]["qIndex"] = 0;
            console.log(rooms[roomcode]["qIndex"]);
            io.sockets.in(roomcode).emit('klunkar', randomklunkar());
            io.sockets.in(roomcode).emit('startDisplay', rooms[roomcode]["qIndex"]);
        }
    }catch(error){
        console.log(error);
    }
    });

    socket.on('clientReady', function(bool){
        if(roombool){
        for(var user in rooms[roomcode]["users"]){
            if(rooms[roomcode]["users"][user]["id"] == socket.id){
                rooms[roomcode]["users"][user]["ready"] = bool;
                io.sockets.in(roomcode).emit('updatePlayers', rooms[roomcode]["users"]);
            }
        }
        var 
        start = true;
        for(var user in rooms[roomcode]["users"]){
            if(rooms[roomcode]["users"][user]["ready"] == false){
                start = false;
            }
        }
        if(start){
            if(rooms[roomcode]["users"].length<minimumPlayers){
                console.log("för få spelare!");
            }else{
            console.log("alla redo! startar spel...");
            rooms[roomcode]["gameRunning"] = true;
            io.sockets.in(roomcode).emit('startGame');
            }
        }
    }
    });
    socket.on('getQ', function(){
        io.sockets.in(roomcode).emit('updateQuestions', rooms[roomcode]["questions"]);
    });
    socket.on('nextQ', function(){
        try{
        //find id and set bool
        for(var user in rooms[roomcode]["users"]){
            if(rooms[roomcode]["users"][user]["id"] == socket.id){
                rooms[roomcode]["users"][user]["ready"] = true;
            }
        }
        var allReady = true;
        //look if some1 != ready
        for(var user in rooms[roomcode]["users"]){
            if(rooms[roomcode]["users"][user]["ready"] == false){
                allReady = false;
            }
        }

        if(allReady){
            //console.log("alla redo!");
            for(var user in rooms[roomcode]["users"]){
                    rooms[roomcode]["users"][user]["ready"] = false;            
            }
            rooms[roomcode]["qIndex"] += 1;
            var qnr = rooms[roomcode]["qIndex"];
            if(qnr > rooms[roomcode]["questions"].length-1){
                rooms[roomcode]["questions"] = [];
                console.log("Tillbaka till lobby!");
                rooms[roomcode]["qIndex"] = 0;
                io.sockets.in(roomcode).emit('updatePlayers', rooms[roomcode]["users"]);
                rooms[roomcode]["gameRunning"] = false;
                io.sockets.in(roomcode).emit('backToLobby');
            }else{
            io.sockets.in(roomcode).emit('klunkar', randomklunkar());
            io.sockets.in(roomcode).emit('nextQ', qnr);
            }
        }
        }catch(error){
            console.log(error);
        }
    });
    socket.on('disconnect', function() {
        if(roombool){
        try{
            for(var user in rooms[roomcode]["users"]){
                if(rooms[roomcode]["users"][user]["id"] == socket.id){
                    rooms[roomcode]["users"].splice(user, 1);
                    io.sockets.in(roomcode).emit('updatePlayers', rooms[roomcode]["users"]);
                    if(rooms[roomcode]["users"].length < 1){
                        delete rooms[roomcode];
                        console.log("tog bort ett rum, följande rum finns kvar:");
                        console.log(rooms);
                    }
                }
            }
        }catch(error){
            console.log(error);
        }
        }
        console.log(socket.id + ' disconnected!');
        delete users[socket.id];
     });

});

function shuffleQ(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }
function randomklunkar() {
    var rN = Math.floor(Math.random() * (10 - 5 + 1) + 5);
    var slutstring = "Svara på frågan eller drick " + rN + " klunkar!";
    if(rN == 10){
        var slutstring = "Svara på frågan eller SVEP!";
    }
    return slutstring;
  }