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

            var s1 = {s1: socket}; //s1 群聊时用户对应的socket
            usocket[username] = s1;
            console.log(usocket, "组装usocket");
            /*登录成功*/
            socket.emit('loginSuccess', data);
            /*向所有连接的客户端广播add事件*/
            io.sockets.emit('add', data);

            socket.broadcast.emit("receive users", users);  //某一个用户登录进入时，要在其他用户的单聊页面加入该用户
        } else {
            /*登录失败*/
            socket.emit('loginFail', '');
        }
    })

    console.log(usocket, "私聊 connection");

    console.log(catchMsgObj, "catch 消息");

    //所有在线用户
    socket.on('users', function (name) {
        console.log(usocket, "------一对一聊天-----");
        console.log(name, " 用户名 ------一对一聊天-----");
        username2 = name;
        usocket[name].s2 = socket;  //s2 一对一私聊时用户对应的socket   （存在一个问题，王佩进入单聊，但是董强没有进入单聊时，董强的socket对象中不存在s2，会导致服务器给董强发送消息时报错 ）
        socket.emit('receive users', users);
        for (var key in catchMsgObj) {
            if (key === name) {
                catchMsgObj[key].forEach(function (res) {
                    usocket[name].s2.emit("receive private message", res);
                })
            }
        }
    });

    /*监听发送消息*/
    socket.on('sendMessage', function (data) {
        io.sockets.emit('receiveMessage', data);  //不回存在一对一私聊的socket接收到群聊的消息，因为单聊的socket没有监听这个事件
    })

    /*退出登录*/
    socket.on('disconnect', function () {
        /*向所有连接的客户端广播leave事件*/
        io.sockets.emit('leave', username);

        delete usocket[username];  //删除离开的用户的usocket
        usocket[username2] && usocket[username2].s2 && delete usocket[username2].s2; //关闭某一个用户的单聊页面时，删除该用户的usocket的s2
        catchMsgObj[username2] && delete catchMsgObj[username2];

        users.map(function (val, index) {
            if (val.username === username) {
                users.splice(index, 1);
            }

            socket.broadcast.emit("receive users", users);  //某一个用户离开时要在其他用户的单聊页面删除该用户
        })
    })

    //私聊

    socket.on("send private message", function (res) {
        console.log(res, "----------appjs---------");
        if (res.recipient in usocket) {
            if (usocket[res.recipient].s2) {
                usocket[res.recipient].s2.emit("receive private message", res)  //（存在一个问题，王佩进入单聊，但是董强没有进入单聊时，董强的socket对象中不存在s2，会导致服务器给董强发送消息时报错 ）
            } else {
                catchMessage.push(res);
                catchMsgObj[res.recipient] = catchMessage;
            }

        }
    })
})

console.log('app listen at' + PORT);