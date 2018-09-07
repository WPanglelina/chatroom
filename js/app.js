var app = require('http').createServer();
var io = require('socket.io')(app);
var PORT = 8081;
/*定义用户数组*/
var users = [];
var usocket = {}; //保存每个用户对应的socket {key:value} key:用户名  value：socket
var catchMessage = [];  //某一个未打开单聊页面的人的消息
var catchMsgObj = {};  //所有没有打开单聊页面的人的消息

app.listen(PORT);

io.on('connection', function (socket) {
    /*是否是新用户标识*/
    var isNewPerson = true;
    /*当前登录用户*/
    var username = null;
    var username2 = null; //当前进入单聊页面的用户
    /*监听登录*/
    socket.on('login', function (data) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].username === data.username) {
                isNewPerson = false;
                break;
            } else {
                isNewPerson = true;
            }
        }
        if (isNewPerson) {
            username = data.username;
            users.push({
                username: data.username
            })

            usocket[username] = socket;
            /*登录成功*/
            socket.emit('loginSuccess', data);
            /*向所有连接的客户端广播add事件*/
            socket.broadcast.emit('add', data);

            socket.emit('users',users); //新登录进入的用户显示当前所有在线的用户

        } else {
            /*登录失败*/
            socket.emit('loginFail', '');
        }
    })


    /*监听发送消息*/
    socket.on('sendMessage', function (data) {
        io.sockets.emit('receiveMessage', data);  //不回存在一对一私聊的socket接收到群聊的消息，因为单聊的socket没有监听这个事件
    })

    /*退出登录*/
    socket.on('disconnect', function () {
        /*向所有连接的客户端广播leave事件*/
        io.sockets.emit('leave', username);

        delete usocket[username];  //删除离开的用户的usocket
        catchMsgObj[username2] && delete catchMsgObj[username2];

        users.map(function (val, index) {
            if (val.username === username) {
                users.splice(index, 1);
            }
        })
    })

    //私聊

    socket.on("send private message", function (res) {
        console.log(res);
        if (res.recipient in usocket) {
            // var data={username:res.recipient,message:res.body};
            usocket[res.recipient].emit("receive private message", res);
            // data.username=res.addresser;
            socket.emit("receive private message", res);
        }
    })
})

console.log('app listen at' + PORT);