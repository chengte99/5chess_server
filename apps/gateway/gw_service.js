var netbus = require("../../netbus/netbus");
var proto_tool = require("../../netbus/proto_tool");
var proto_man = require("../../netbus/proto_man");
var Cmd = require("../Cmd");
var Stype = require("../Stype");
var Response = require("../Response");
var log = require("../../utils/log");
require("./login_gw_proto");

function is_login_cmd(stype, ctype){
    if(stype != Stype.Auth){
        return false;
    }

    if(ctype == Cmd.Auth.GUEST_LOGIN || ctype == Cmd.Auth.UNAME_LOGIN){
        return true;
    }
    return false;
}

function is_before_login_cmd(stype, ctype){
    if(stype != Stype.Auth){
        return false;
    }

    var ctype_set = [Cmd.Auth.GUEST_LOGIN, Cmd.Auth.UNAME_LOGIN, 
        Cmd.Auth.GET_VERIFY_VIA_REG, Cmd.Auth.REG_PHONE_ACC,
        Cmd.Auth.GET_VERIFY_VIA_FORGET_PWD, Cmd.Auth.RESET_PWD_ACC];
        
    for(var i = 0; i < ctype_set.length; i ++){
        if(ctype == ctype_set[i]){
            return true;
        }
    }

    return false;
}

var session_uid_map = {};

function save_session_with_uid(uid, session, proto_type){
    session_uid_map[uid] = session;
    session.proto_type = proto_type;
}

function get_session_by_uid(uid){
    return session_uid_map[uid];
}

function clear_session_by_uid(uid){
    session_uid_map[uid] = null;
    delete session_uid_map[uid];
}

var service = {
    name: "gw_service",
    is_transfer: true,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(raw_cmd);
        
        var server_session = netbus.get_server_session(stype);
        if(!server_session){
            return;
        }

        if(is_before_login_cmd(stype, ctype)){
            utag = session.session_key;
        }else{
            // utag = session.uid
            if(session.uid === 0){
                // 沒有登入，非法命令
                return;
            }
            utag = session.uid;
        }
        
        proto_tool.write_utag_inbuf(raw_cmd, utag);
        server_session.send_encoded_cmd(raw_cmd);
    },

    on_server_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(raw_cmd);

        var client_session;
        if(is_before_login_cmd(stype, ctype)){
            client_session = netbus.get_client_session(utag);
            if(!client_session){
                return;
            }

            if(is_login_cmd(stype, ctype)){
                var cmd = proto_man.decode_cmd(proto_type, stype, ctype, raw_cmd);
                body = cmd[2];
                if(body.status === Response.OK){
                    var prev_client_session = get_session_by_uid(body.uid);
                    if(prev_client_session){
                        prev_client_session.send_cmd(stype, Cmd.Auth.RELOGIN, null, 0, prev_client_session.proto_type);
                        prev_client_session.uid = 0; // 可能會有隐患，是否通知其它的服务，目前設置為不通知斷線。呼應service_manager.js 的 on_client_lost_connection
                        netbus.session_close(prev_client_session);
                    }

                    client_session.uid = body.uid;
                    save_session_with_uid(body.uid, client_session, proto_type);// uid相同，覆蓋舊的session
                    body.uid = 0;
                    raw_cmd = proto_man.encode_cmd(utag, proto_type, stype, ctype, body);
                }
            }
        }else{
            client_session = get_session_by_uid(utag);
            if(!client_session){
                return;
            }
        }

        proto_tool.clear_utag_inbuf(raw_cmd);
        client_session.send_encoded_cmd(raw_cmd);
    },

    on_player_disconnect: function(session, stype, uid){
        if(stype == Stype.Auth){
            clear_session_by_uid(uid);
        }

        var server_session = netbus.get_server_session(stype);
        if(!server_session){
            return;
        }

        // var utag = session.session_key;
        var utag = uid;
        server_session.send_cmd(stype, Cmd.USER_DISCONNECT, null, utag, proto_man.PROTO_JSON);
    }
}

service.get_session_by_uid = get_session_by_uid;
module.exports = service;