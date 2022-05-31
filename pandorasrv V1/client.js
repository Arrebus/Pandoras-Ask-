'use strict';
const socket = io();
var roomcode = 0;
var roombool = false;
var players = [];
var questions = [];
var klunkar = "";
let readyClient = false;
var username = "";
window.addEventListener('load', ()=> {
    
    var roomcode = "";
    
    var lobbymain = document.getElementById('lobbymain');
    var joinAlt = document.getElementById('joinAlt');
    var joinForm = document.getElementById('joinForm');
    var backbtn = document.getElementById('back');
    var joinBtn = document.getElementById('joinBtn');
    var roomInput = document.getElementById('join');
    var subnick = document.getElementById('subnick');
    var nickInput = document.getElementById('nickname');

    var ready = document.getElementById('ready');
    var uready = document.getElementById('uready');
    var qbox = document.getElementById('questionBox');
    var sendQ = document.getElementById('sendQ');
    var qInput = document.getElementById('qInput');
    var selectPlayer = document.getElementById('selectPlayer');
    var nextQ = document.getElementById('nextQ');
    var backBtn = document.getElementById('backBtn');
    console.log("hej!")
    document.addEventListener('click', (e) => {
        
        if(e.target == subnick){
            e.preventDefault();
            console.log("jq funkar");
            username = nickInput.value;
            if(nickInput.value.length<3){
                alert("ditt namn ska vara minst tre bokstäver elr siffror elr vad fan som helst... nyktra till nu... dömböter! ta 5 klunkar");
            }else{
                socket.emit('joinsrv', username);
                $('#nickmain').toggleClass('d-none');
                $('#lobbymain').toggleClass('d-none');
            }
        }

        if(e.target == joinAlt){
            joinForm.classList.toggle("d-none");
            joinAlt.classList.toggle("d-none");
            //emit checkforRoom typ
            //sessionStorage rummet
        }
        if(e.target == joinBtn){
            e.preventDefault();
            roomcode = roomInput.value;
            roomInput.value = "";
            if(roomcode != ""){
                socket.emit('joinRoom', roomcode);

            }
            console.log(roomcode);
            
        }
        if(e.target == ready || e.target == uready){
            e.preventDefault();
            ready.classList.toggle("d-none");
            uready.classList.toggle("d-none");
            readyClient = !readyClient;
            socket.emit('clientReady', readyClient);
            
        }
        if(e.target == sendQ){
            if(qInput.value != "" && selectPlayer.value != ""){
                var question = qInput.value;
                var receiver = selectPlayer.value;
                var payload = {"question" : question, "receiver" : receiver};
                socket.emit('postQuestion', payload);
                var qmain = $('#questionBox');
                qmain.toggleClass('d-none');
                var wait = $('#waitRoom');
                wait.toggleClass('d-none');

            }else{
                alert("Du måste välja en spelare och skriv en fråga")
            }

        }
        if(e.target == nextQ){
            socket.emit('nextQ');
            var nextBtn = $('#nextQ');
            nextBtn.toggleClass('d-none');
        }
        if(e.target == backBtn){
            socket.emit('leaveRoom');
        }
        
     });

});

/*socket.on('checkRoom', function(bool){
    roombool = bool;
});*/
socket.on('joinAcc', function(){
    $('#lobbymain').toggleClass('d-none');
    $('#gamemain').toggleClass('d-none');
})
socket.on('joinRoom', function(roomId) {
    console.log("går med rum: " + roomId);
});
socket.on('leaveRoom', function(roomId) {
    $('#lobbymain').toggleClass('d-none');
    $('#gamemain').toggleClass('d-none');
});
socket.on('upptaget', function(){
    alert("Upptaget!");
});

socket.on('updatePlayers', function(users){
    players = users;
    updateTable();
});
socket.on('updateQuestions', function(fragor){
    questions = fragor;
});

socket.on('startGame', function(){
    var gameroom = $('#gamemain');
    gameroom.toggleClass('d-none');
    var qmain = $('#questionBox');
    qmain.toggleClass('d-none');
    var nQ = $('#nextQ');
    nQ.toggleClass('d-none');

});
socket.on('startDisplay', function(qIndex){
    console.log(questions);
    var wait = $('#waitRoom');
    wait.toggleClass('d-none');
    socket.emit('getQ');
    presentQuestion(qIndex);
    var qDisp = $('#qDisp');
    qDisp.toggleClass('d-none');
});
socket.on('backToLobby', function(){
    var qDisp = $('#qDisp');
    qDisp.toggleClass('d-none');
    $('#gamemain').toggleClass('d-none');
});
socket.on('nextQ', function(qIndex){
    var nextBtn = $('#nextQ');
    nextBtn.toggleClass('d-none');
    presentQuestion(qIndex);
});
socket.on('klunkar', function(string) {
    klunkar = string;
});
function updateTable(){
    $("#tablebody tr").remove();
    $("#selectPlayer option").remove();
    var currentUsers = players;
    for(var user in currentUsers){
        var un = currentUsers[user]["username"];
        var redo = currentUsers[user]["ready"];
        //console.log(un + "gick nyss med!");
        var samename = false;
        var dubblett = 1;
        var table = document.getElementById("table");
        for (var i = 0, row; row = table.rows[i]; i++) {
           if(table.rows[i].id == un){
               dubblett++;
               samename = true;
           }
        }

            var tabell = $('tbody');
            var rad = $("<tr></tr>");
            rad.attr("id", un);
            if(samename){
                rad.append("<td>" + un + "#" + dubblett + "</td>");
            }else{
            rad.append("<td>" + un + "</td>");
            }
            var redotxt = $("<td></td>");
            if(redo){
                redotxt.text('\uD83D\uDE0D');
            }else{
                redotxt.text('\uD83D\uDC80');
            }
        
            rad.append(redotxt);
            
            tabell.append(rad);
        //select
        samename = false;
        dubblett = 1;
        var select = document.getElementById("selectPlayer");
        for (var i = 0; i < select.length; i++){
            var option = select.options[i];
            if(option == un){
                samename = true;
                dubblett++;
            }
        }
        if(un != username){
        var s = $('#selectPlayer');
        var opt = $("<option>" + un + "</option>");
        opt.attr('value', un);
        s.append(opt);
        }
        
    }
}

function getNickName(){
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${"nickName"}=`);
    //console.log(parts)
    if (parts.length === 2){ 
        return parts.pop().split(';').shift()
    }else{
        return -1;
    }
}
function presentQuestion(index){
    console.log(index);
    var receiver = $('#Qres');
    var content = $('#Qcont');
    var punishment = $('#Qpun');

    receiver.text("Fråga till " + questions[index]["receiver"] + ":");
    content.text(questions[index]["question"]);
    punishment.text(klunkar);

}