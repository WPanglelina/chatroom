var app = require('http').createServer();
var io = require('socket.io')(app);
var PORT = 8081;
/*定义用户数组*/
var users = [];
var usocket = {}; //保存每个用户对应的socket {key:value} key:用户名  value：socket

app.listen(PORT);

io.on('connection', function (socket) {
	/*是否是新用户标识*/
	var isNewPerson = true; 
	/*当前登录用户*/
    var username = null;
	/*监听登录*/
	socket.on('login',function(data){
		for(var i=0;i<users.length;i++){
	        if(users[i].username === data.username){
	          	isNewPerson = false;
	          	break;
	        }else{
	          	isNewPerson = true;
	        }
	    }
	    if(isNewPerson){
	        username = data.username;
	        users.push({
	          username:data.username
	        })
            usocket[username].s1 = socket;
	        /*登录成功*/
	        socket.emit('loginSuccess',data);
	        /*向所有连接的客户端广播add事件*/
	        io.sockets.emit('add',data);
	    }else{
	    	/*登录失败*/
	        socket.emit('loginFail','');
	    }  
	})

	//所有在线用户
	socket.on('users',function (name) {
        usocket[username].s2 = socket;
        socket.emit('receive users',users);
    });

	/*监听发送消息*/
	socket.on('sendMessage',function(data){
        io.sockets.emit('receiveMessage',data);
    })

	/*退出登录*/
	socket.on('disconnect',function(){
		/*向所有连接的客户端广播leave事件*/
      	io.sockets.emit('leave',username);
      	users.map(function(val,index){
        if(val.username === username){
          	users.splice(index,1);
        }
      })
    })

	//私聊

	socket.on("send private message",function (res) {
        console.log(res,"----------appjs---------");
        if(res.recipient in usocket){
			usocket[res.recipient].s2.emit("receive private message",res)
			// io.sockets.emit("receive private message",res)
		}
    })
})

console.log('app listen at'+PORT);