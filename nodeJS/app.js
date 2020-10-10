//모듈을 추출합니다.
var socketio = require('socket.io');
var express = require('express');
var http = require('http');
var ejs = require('ejs');
var fs = require('fs');

//웹 서버를 생성합니다.
var app = express();
app.use(express.static('public'));

//웹 서버를 실행합니다.
var server = http.createServer(app);
server.listen(9797, function () {
    console.log('서버 시작');
});

//각 방의 정보를 모읍니다.
var roomData = [];

//roomData를 가지고 있는 배열을 만듭니다.
//이를 동적으로 생성해서 roomData에 저장합니다.
function Room(RoomName) {
    this.RoomName = RoomName;           // public
    this.data = [];       // public
    this.nameSetting = function () { // public
        console.log('Hi! My name is ' + this.name);
    };
}

//라우트를 실행합니다.
app.get('/', function (req, res) {
    fs.readFile('lobby.html', function (err, data) {
        res.send(data.toString());
    });
});

app.get('/canvas/:room', function (req, res) {
    fs.readFile('canvas.html', 'utf8', function (err, data) {
        res.send(ejs.render(data, {
            room: req.params.room
        }));
    });
    //만들어진 방 데이터가 없으면 새로 만듭니다.
    if (roomData.findIndex(x => x.RoomName == req.params.room) < 0) {
        var dd = new Room(req.params.room);
        roomData.push(dd);
        console.log(roomData);
    }
});

app.get('/room', function (req, res) {
    var rooms = Object.keys(io.sockets.adapter.rooms).filter(function (item) {
        return item.indexOf('/') < 0;
    });
    res.send(rooms);
});

function drawPicter(roomId) {
    roomData[roomData.findIndex(x=>x.RoomName == roomId)].data.forEach(element => {
        io.sockets.in(roomId).emit('line', element);
    });
}

//소켓 서버를 생성합니다.
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
    var roomId = "";

    socket.on('join', function (data) {
        socket.join(data);
        roomId = data;

        //다른 사람이 미리 그린 그림을 가져옵니다.
        drawPicter(roomId);
    });

    socket.on('draw', function (data) {
        io.sockets.in(roomId).emit('line', data);
        //Room의 data에 그린 선들의 데이터를 저장합니다.
        roomData[roomData.findIndex(x=>x.RoomName == roomId)].data.push(data);
    });

    socket.on('create_room', function (data) {
        io.sockets.emit('create_room', data.toString());
    });

    //여기서부터 진행을 하면 된다.
    socket.on('clearRect',function (roomId) {
        roomData[roomData.findIndex(x=>x.RoomName == roomId)].data = [];
    })
});