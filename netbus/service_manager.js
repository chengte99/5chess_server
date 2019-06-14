var log = require("../utils/log");
var proto_man = require("./proto_man");

var service_manager = {
    on_client_lost_connection: on_client_lost_connection,
    on_client_recv_cmd: on_client_recv_cmd,
    register_service: register_service,

    server_return_recv_cmd: server_return_recv_cmd,
};

var service_modules = {};

function register_service(stype, service){
    if(service_modules[stype]){
        log.warn(service_modules[stype].name + "is registered !");
    }

    service_modules[stype] = service;
}

function on_client_recv_cmd(session, cmd_buf){
    if(session.is_encrypt){
        cmd_buf = proto_man.decrypt_cmd(cmd_buf);
    }

    var stype, ctype, body, utag, proto_type;
    var cmd = proto_man.decode_cmd_header(cmd_buf);
    if(!cmd){
        return false;
    }
    stype = cmd[0];
    ctype = cmd[1];
    utag = cmd[2];
    proto_type = cmd[3];

    if(!service_modules[stype]){
        return false;
    }
    if(service_modules[stype].is_transfer){
        service_modules[stype].on_player_recv_cmd(session, stype, ctype, null, utag, proto_type, cmd_buf);
        return true;
    }

    cmd = proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
    if(!cmd){
        return false;
    }

    body = cmd[2];
    // log.info(stype, ctype, body);
    service_modules[stype].on_player_recv_cmd(session, stype, ctype, body, utag, proto_type, null);
    return true;
}

function on_client_lost_connection(session){
    var uid = session.uid;
    if(uid === 0){
        return;
    }
    
    for(var key in service_modules){
        if(service_modules[key]){
            service_modules[key].on_player_disconnect(session, key, uid);
        }
    }
}

// ------------------------------------------------------------------------

function server_return_recv_cmd(session, cmd_buf){
    if(session.is_encrypt){
        cmd_buf = proto_man.decrypt_cmd(cmd_buf);
    }

    var stype, ctype, body, utag, proto_type;
    var cmd = proto_man.decode_cmd_header(cmd_buf);
    if(!cmd){
        return false;
    }
    stype = cmd[0];
    ctype = cmd[1];
    utag = cmd[2];
    proto_type = cmd[3];

    if(!service_modules[stype]){
        return false;
    }
    if(service_modules[stype].is_transfer){
        service_modules[stype].on_server_recv_cmd(session, stype, ctype, null, utag, proto_type, cmd_buf);
        return true;
    }

    cmd = proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
    if(!cmd){
        return false;
    }

    body = cmd[2];
    // log.info(stype, ctype, body);
    service_modules[stype].on_server_recv_cmd(session, stype, ctype, body, utag, proto_type, null);
    return true;
}

module.exports = service_manager;