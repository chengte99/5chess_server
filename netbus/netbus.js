var net = require("net");
var ws = require("ws");

var log = require("../utils/log");
var tcppkg = require("./tcppkg");
var proto_man = require("./proto_man");
var service_manager = require("./service_manager");

var netbus = {
    start_tcp_server : start_tcp_server,
    // session_send: session_send,
    session_close: session_close,
    start_ws_server: start_ws_server,
    get_client_session: get_client_session,

    start_tcp_client_to_connect_server: start_tcp_client_to_connect_server,
    get_server_session: get_server_session,
}

var global_session_list = {};
var global_session_key = 1;

function get_client_session(session_key){
    return global_session_list[session_key];
}

function on_session_enter(session, is_ws, is_encrypt){
    if(is_ws){
        log.info("session enter...", session._socket.remoteAddress, session._socket.remotePort);
    }else{
        log.info("session enter...", session.remoteAddress, session.remotePort);
    }

    session.is_ws = is_ws;
    session.last_pkg = null;
    session.is_connected = true;
    session.is_encrypt = is_encrypt;

    session.uid = 0;

    //擴展session 方法
    session.send_encoded_cmd = session_send_encoded_cmd;
    session.send_cmd = session_send_cmd;

    global_session_list[global_session_key] = session;
    session.session_key = global_session_key;
    global_session_key ++;
}

function on_session_exit(session){
    session.is_connected = false;
    service_manager.on_client_lost_connection(session);

    session.last_pkg = null;
    if(global_session_list[session.session_key]){
        global_session_list[session.session_key] = null;
        delete global_session_list[session.session_key];
        session.session_key = null;
    }
}

function on_session_recv_cmd(session, cmd_buf){
    if(!service_manager.on_client_recv_cmd(session, cmd_buf)){
        session_close(session);
    }
}

function session_send_cmd(stype, ctype, body, utag, proto_type){
    if(!this.is_connected){
        return;
    }
    var cmd = null;
    cmd = proto_man.encode_cmd(utag, proto_type, stype, ctype, body);
    if(cmd){
        this.send_encoded_cmd(cmd);
    }
}

function session_send_encoded_cmd(cmd){
    if(this.is_encrypt){
        cmd = proto_man.encrypt_cmd(cmd);
    }

    if(!this.is_connected){
        return;
    }
    if(!this.is_ws){
        var data = tcppkg.package_data(cmd);
        this.write(data);
        return;
    }else{
        this.send(cmd);
    }
}

function session_close(session){
    if(!session.is_ws){
        session.end();
        return;
    }else{
        session.close();
    }
}
// ------------------------------------------------------------------------

function add_client_session_event(session, is_encrypt){
    on_session_enter(session, false, is_encrypt);

    session.on("close", function() {
        on_session_exit(session);
    });

    session.on("error", function(err) {
        log.info("session error...: ", err);
    });

    session.on("data", function(data) {
        if(!Buffer.isBuffer(data)){
            session_close(session);
            return;
        }

        var last_pkg = session.last_pkg;
        if (last_pkg != null) { // 上一次剩余没有处理完的半包;
			var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
			last_pkg = buf;
		}
		else {
			last_pkg = data;	
		}

		var offset = 0;
		var pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
		if (pkg_len < 0) {
			return;
		}

		while(offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
			// 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
            var cmd_buf;

            // if(session.proto_type == proto_man.PROTO_JSON){
            //     var json_str = last_pkg.toString("utf8", offset + 2, offset + pkg_len);
            //     if(!json_str){
            //         session_close(session);
            //         return;
            //     }
            //     on_session_recv_cmd(session, json_str);
            // }else{
                cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
			    last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
                on_session_recv_cmd(session, cmd_buf);
            // }

			offset += pkg_len;
			if (offset >= last_pkg.length) { // 正好我们的包处理完了;
				break;
			}

			pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
			if (pkg_len < 0) {
				break;
			}
		}

		// 能处理的数据包已经处理完成了,保存 0.几个包的数据
		if (offset >= last_pkg.length) {
			last_pkg = null;
		}
		else { // offset, length这段数据拷贝到新的Buffer里面
			var buf = Buffer.allocUnsafe(last_pkg.length - offset);
			last_pkg.copy(buf, 0, offset, last_pkg.length);
			last_pkg = buf;
        }
        
        session.last_pkg = last_pkg;
    });
}

function start_tcp_server(ip, port, is_encrypt){
    log.info("start tcp server...", ip, port);

    var server = net.createServer(function(client_sock) { 
        add_client_session_event(client_sock, is_encrypt);
    });

    server.on("error", function() {
        log.error("server listen error");
    });
    
    server.on("close", function() {
        log.error("server listen close");
    });

    server.listen({
        port: port,
        // host: ip, 如果部署了遠程會導致連接不上
        exclusive: true,
    });
}
// ------------------------------------------------------------------------

function isString(obj){ //判断对象是否是字符串  
	return Object.prototype.toString.call(obj) === "[object String]";  
} 

function ws_add_client_session_event(session, is_encrypt) {
    on_session_enter(session, true, is_encrypt);

    session.on("close", function() {
        on_session_exit(session);
    });

    session.on("error", function(err) {
        log.error("session error: ", err);
    });

    session.on("message", function(data) {
        // if(session.proto_type == proto_man.PROTO_JSON){
        //     if(!isString(data)){
        //         session_close(session);
        //         return;
        //     }
        //     on_session_recv_cmd(session, data);
        // }else{
            if(!Buffer.isBuffer(data)){
                session_close(session);
                return;
            }
            on_session_recv_cmd(session, data);
        // }
    });
}

function start_ws_server(ip, port, is_encrypt){
    log.info("start ws server...", ip, port);
    var server = new ws.Server({
        // host: ip, 如果部署了遠程會導致連接不上
        port: port,
    });

    server.on("connection", function(client_sock) {
        ws_add_client_session_event(client_sock, is_encrypt);
    });

    server.on("error", function(err) {
        log.error("ws server listen error: ", err);
    });

    server.on("headers", function(data) {
        log.info("ws server listen headers: ", data);
    });
}

// ------------------------------------------------------------------------

var server_session_list = {};

function get_server_session(stype){
    return server_session_list[stype];
}

function on_server_session_connect(stype, session, is_ws, is_encrypt){
    if(is_ws){
        log.info("session connect...", session._socket.remoteAddress, session._socket.remotePort);
    }else{
        log.info("session connect...", session.remoteAddress, session.remotePort);
    }

    session.is_ws = is_ws;
    session.last_pkg = null;
    session.is_connected = true;
    session.is_encrypt = is_encrypt;

    //擴展session 方法
    session.send_encoded_cmd = session_send_encoded_cmd;
    session.send_cmd = session_send_cmd;

    server_session_list[stype] = session;
    session.session_key = stype;
}

function on_server_session_exit(session){
    session.is_connected = false;

    session.last_pkg = null;
    if(server_session_list[session.session_key]){
        server_session_list[session.session_key] = null;
        delete server_session_list[session.session_key];
        session.session_key = null;
    }
}

function on_server_session_recv_cmd(session, cmd_buf){
    if(!service_manager.server_return_recv_cmd(session, cmd_buf)){
        session_close(session);
    }
}

function start_tcp_client_to_connect_server(stype, ip, port, is_encrypt){
    var session = net.connect({
        port: port,
        host: ip,
    });

    session.is_connected = false;
    session.on("connect",function() {
        on_server_session_connect(stype, session, false, is_encrypt);
    });

    session.on("close", function() {
        if(session.is_connected){
            on_server_session_exit(session);
        }

        //5s reconnect...
        setTimeout(function() {
            log.warn("reconnect: ", stype, ip, port, is_encrypt);
            start_tcp_client_to_connect_server(stype, ip, port, is_encrypt);
        }, 5000);
    });

    session.on("error", function(err) {
        // log.info("session error...: ", err);
    });

    session.on("data", function(data) {
        if(!Buffer.isBuffer(data)){
            session_close(session);
            return;
        }

        var last_pkg = session.last_pkg;
        if (last_pkg != null) { // 上一次剩余没有处理完的半包;
			var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
			last_pkg = buf;
		}
		else {
			last_pkg = data;	
		}

		var offset = 0;
		var pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
		if (pkg_len < 0) {
			return;
		}

		while(offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
			// 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
            var cmd_buf;

            // if(session.proto_type == proto_man.PROTO_JSON){
            //     var json_str = last_pkg.toString("utf8", offset + 2, offset + pkg_len);
            //     if(!json_str){
            //         session_close(session);
            //         return;
            //     }
            //     on_session_recv_cmd(session, json_str);
            // }else{
                cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
			    last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
                on_server_session_recv_cmd(session, cmd_buf);
            // }

			offset += pkg_len;
			if (offset >= last_pkg.length) { // 正好我们的包处理完了;
				break;
			}

			pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
			if (pkg_len < 0) {
				break;
			}
		}

		// 能处理的数据包已经处理完成了,保存 0.几个包的数据
		if (offset >= last_pkg.length) {
			last_pkg = null;
		}
		else { // offset, length这段数据拷贝到新的Buffer里面
			var buf = Buffer.allocUnsafe(last_pkg.length - offset);
			last_pkg.copy(buf, 0, offset, last_pkg.length);
			last_pkg = buf;
        }
        
        session.last_pkg = last_pkg;
    });
}

module.exports = netbus;