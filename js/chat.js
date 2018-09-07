$(function(){
	/*建立socket连接，使用websocket协议，端口号是服务器端监听端口号*/
	var socket = io('ws://10.33.134.128:8081');
	/*定义用户名*/
	var uname = null;

	/*登录*/
	$('.login-btn').click(function(){
		uname = $.trim($('#loginName').val());
		if(uname){
			/*向服务端发送登录事件*/
			socket.emit('login',{username:uname})
		}else{
			alert('请输入昵称')
		}
	})

	/*进入私聊*/
	$('.title').click(function(){
        window.open(`../privateChat.html?from=${uname}`, "_blank");
	})

	/*发送消息*/
	$('.sendBtn').click(function(){
		sendMessage()
	});
	$(document).keydown(function(event){
		if(event.keyCode == 13){
			sendMessage()
		}
	})

	/*登录成功*/
	socket.on('loginSuccess',function(data){
		if(data.username === uname){
			checkin(data)
		}else{
			alert('用户名不匹配，请重试')
		}
	})

	/*登录失败*/
	socket.on('loginFail',function(){
		alert('昵称重复')
	})

	/*新人加入提示*/
	socket.on('add',function(data){
		/*var html = '<p>系统消息:'+data.username+'已加入群聊</p>';
		$('.chat-con').append(html);*/
		let head="../images/user/user.jpg";
		showUsers(data.username,head);
		messageBox(data.username);
	})

	/*某一个新人加入时，当前进入的人查询现在所有在线的用户*/
	socket.on('users',function(users){
        let head="../images/user/user.jpg";
		for(var i=0;i<users.length;i++){
            showUsers(users[i].username,head);
            messageBox(users[i].username);
		}
	})



	/*接收消息*/
	socket.on('receiveMessage',function(data){
		showMessage(data)
	})

	/*退出群聊提示*/
	socket.on('leave',function(name){
		if(name != null){
			/*var html = '<p>'+name+'已退出群聊</p>';
			$('.chat-con').append(html);*/
			deleteDom(name);
		}
	})
	
	function deleteDom(username) {
        $('#session')[0].removeChild($('#li'+hex_md5(username))[0]);
        $('#chat')[0].removeChild($('#'+hex_md5(username))[0]);
    }

	/*隐藏登录界面 显示聊天界面*/
	function checkin(data){
		$('.login-wrap').hide('slow');
		// $('.chat-wrap').show('slow');
		$('#app').show('slow');
	}

	/*发送消息*/
	function sendMessage(){
		var txt = $('#sendtxt').val();
		$('#sendtxt').val('');
		if(txt){
			socket.emit('sendMessage',{username:uname,message:txt});
		}
	}

	/*显示消息*/
	function showMessage(data){
		debugger
		var html;
		if(data.addresser === uname){
			html = '<div class="chat-item item-right clearfix"><span class="img fr"></span><span class="message fr">'+data.body+'</span></div>'
            $('#'+hex_md5(data.recipient)+' .chat-msg').append(html);
		}
		if(data.recipient === uname){
			html='<div class="chat-item item-left clearfix rela"><span class="abs uname">'+data.addresser+'</span><span class="img fl"></span><span class="fl message">'+data.body+'</span></div>'
            $('#'+hex_md5(data.addresser)+' .chat-msg').append(html);
		}
		// $('.chat-con').append(html);
        // $('.chat-wrap')[0].scrollTop=$('.chat-wrap')[0].scrollHeight;
        // $('#'+hex_md5(data.username)+' .chat-msg').append(html);
	}

	/*显示用户*/
	function  showUsers(tname,head) {
        $('#session').append('<li id="li' + hex_md5(tname) + '"><img src="' + head + '"><span class="nick-name">' + tname + '</span></li>');
    }

    /*消息框*/
	function messageBox(tname) {
        var html = '';
        html += '<div id="' + hex_md5(tname) + '" data-n="' + tname + '" class="chat"><div class="main">';
        html += '<div class="message"><div class="head"><p>' + tname + '</p></div>';
        html += '<div class="body"><ul class="chat-msg"></ul></div></div>';
        html += '<div class="footer"><div class="box"><div class="head">';
        html += '<svg class="icon emoji" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4692" xmlns:xlink="http://www.w3.org/1999/xlink"><defs></defs><path d="M520.76544 767.05792c-99.14368 0-180.30592-73.65632-193.78176-169.09312l-49.22368 0c13.78304 122.624 116.61312 218.29632 242.91328 218.29632S749.81376 720.5888 763.5968 597.9648l-49.0496 0C701.0816 693.4016 619.90912 767.05792 520.76544 767.05792zM512 0C229.23264 0 0 229.2224 0 512c0 282.75712 229.23264 512 512 512 282.76736 0 512-229.24288 512-512C1024 229.2224 794.76736 0 512 0zM511.95904 972.78976C257.46432 972.78976 51.1488 766.48448 51.1488 512c0-254.49472 206.30528-460.81024 460.81024-460.81024 254.48448 0 460.8 206.30528 460.8 460.81024C972.75904 766.48448 766.44352 972.78976 511.95904 972.78976zM655.57504 456.92928c31.06816 0 56.24832-25.1904 56.24832-56.24832 0-31.06816-25.18016-56.24832-56.24832-56.24832-31.06816 0-56.25856 25.18016-56.25856 56.24832C599.31648 431.73888 624.49664 456.92928 655.57504 456.92928zM362.73152 456.92928c31.06816 0 56.24832-25.1904 56.24832-56.24832 0-31.06816-25.1904-56.24832-56.24832-56.24832-31.0784 0-56.25856 25.18016-56.25856 56.24832C306.47296 431.73888 331.65312 456.92928 362.73152 456.92928z" p-id="4693"></path></svg>';
        html += '</div><div class="body"><input type="text" class="input" /></div>';
        html += '<div class="foot"><a class="send" href="javascript:void(0)">发送(Enter)</a></div></div></div></div></div>';
        $('#chat').append(html);
    }

    //active li
    $(document).on('click', '#session li', function () {
        $('.active').removeClass('active');
        $(this).addClass('active');
        var index = $(this).index();
        $('.chat-active').removeClass('chat-active');
        $('.chat:eq(' + index + ')').addClass('chat-active');
    });


    //sendMessage
    $(document).on('click','.chat-active .send',function(){
        toSendMessage()
    });

    $(document).keydown(function(event){
        if(event.keyCode == 13){
            toSendMessage()
        }
    })

    //sendMessage
    function toSendMessage(){
        var recipient = $('.chat-active').attr('data-n');
        var val = $('.chat-active input').val();
        if(val == '') return;
        sendMessage('../images/user/user.jpg',val);
        //call
        var req = {
            'addresser':uname,
            'recipient':recipient,
            'type':'plain',
            'body':val
        }
        socket.emit('send private message', req);
        $('.chat-active input').val('');
    }

    // 接收私聊信息
    socket.on('receive private message', function (data) {
        console.log(data);
		showMessage(data)

    });

})