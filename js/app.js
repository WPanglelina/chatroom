var app = require('http').createServer();
var io = require('socket.io')(app);
var PORT = 8081;
/*定义用户数组*/
var users = [];
var groups=[]; //群聊数组 [{username:"群聊"+index,users:data}]  username 群聊名称，users 此群聊中的所有用户名组成的数组
var groupsObj={};//群聊对象，{key:value}  key:群聊名 value:(数组) 此群聊中的所有用户名组成的数组
var usocket = {}; //保存每个用户对应的socket {key:value} key:用户名  value：socket
// var catchMessage = [];  //某一个未打开单聊页面的人的消息
// var catchMsgObj = {};  //所有没有打开单聊页面的人的消息
var index=1; //群聊名称

app.listen(PORT);

io.on('connection', function (socket) {
    /**
     * 用户登录
     */
    /*是否是新用户标识*/
    var isNewPerson = true;
    /*当前登录用户*/
    var username = null;
    // var username2 = null; //当前进入单聊页面的用户
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
            /*向除自己以外的所有连接的客户端广播add事件*/
            socket.broadcast.emit('add', data);

            let myGroup=[];
            for(var i=0;i<groups.length;i++){
                if(groups[i].users.indexOf(username)!==-1){
                    myGroup.push(groups[i]);
                }
            }

            socket.emit('users',myGroup.concat(users)); //新登录进入的用户显示当前所有在线的用户，包括自己所在的群

        } else {
            /*登录失败*/
            socket.emit('loginFail', '');
        }
    })

    /**
     * 发送消息
     */
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

    //群聊
    socket.on("send group message",function (res) {
        console.log(res,"group message");
        console.log(groupsObj,"群聊的人");
        var group_users=groupsObj[res.recipient]; //当前群聊的用户
        for(var i=0;i<group_users.length;i++){
            if(group_users[i] in usocket){
                usocket[group_users[i]].emit("receive group message",res);
            }
        }
    })

    /**
     * 创建群聊
     */
    //创建群聊页面显示所有在线用户
    socket.on("get users",function () {
        console.log("get users");
        socket.emit("receive users",users)
    })

    //添加群
    socket.on("add group",function (data) {
        groups.push({username:"群聊"+index,users:data});
        groupsObj["群聊"+index]=data
        for(var i=0;i<data.length;i++){
            usocket[data[i]]&&usocket[data[i]].emit("add",{username:"群聊"+index,userType:"group"});
        }
        index++;
    })

    /**
     * 用户断开连接
     */
    /*退出登录*/
    socket.on('disconnect', function () {
        /*向所有连接的客户端广播leave事件*/
        io.sockets.emit('leave', username);

        delete usocket[username];  //删除离开的用户的usocket
        // catchMsgObj[username2] && delete catchMsgObj[username2];  //缓存消息

        users.map(function (val, index) {
            if (val.username === username) {
                users.splice(index, 1);
            }
        })
    })

})

console.log('app listen at' + PORT);