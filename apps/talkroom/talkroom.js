var log = require("../../utils/log");
require("./talkroom_proto.js");
var proto_man = require("../../netbus/proto_man");
var Cmd = require("../Cmd");

var TalkCmd = {
    Enter: 1, //用戶進來
    Exit: 2, //用戶離開
    UserArrived: 3, //別人進來
    UserExit: 4, //別人離開

    SendMsg: 5, //自己發送消息
    UserMsg: 6 //收到別人消息
}

var Response = {
    OK: 200,
    Fail: 201,
    In_Room: -100,
    Not_In_Room: -101,
    INVAILD: -102,
    INVAILD_PARAMS: -103
}

var room = {};
function boardcast_cmd(ctype, body, noto_user){
    var json_encoded = null;
    var buf_encoded = null;
    for(var key in room){
        var session = room[key].session;
        var utag = room[key].utag;
        var proto_type = room[key].proto_type;
        if(utag == noto_user){
            continue;
        }

        //這樣寫會浪費效能
        // session.send_cmd(1, ctype, body);
        if(proto_type == proto_man.PROTO_JSON){
            if(!json_encoded){
                json_encoded = proto_man.encode_cmd(utag, proto_type, 1, ctype, body);
            }
            session.send_encoded_cmd(json_encoded);
        }else if(proto_type == proto_man.PROTO_BUF){
            if(!buf_encoded){
                buf_encoded = proto_man.encode_cmd(utag, proto_type, 1, ctype, body);
            }
            session.send_encoded_cmd(buf_encoded);
        }
    }
}

function on_user_enter_talkroom(session, body, utag, proto_type){
    if(typeof(body.uname) == "undefined" || typeof(body.usex) == "undefined"){
        session.send_cmd(1, TalkCmd.Enter, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    if(room[utag]){
        session.send_cmd(1, TalkCmd.Enter, Response.In_Room, utag, proto_type);
        return;
    }

    //通知該用戶他已進入
    session.send_cmd(1, TalkCmd.Enter, Response.OK, utag, proto_type);

    //廣播給其他用戶
    boardcast_cmd(TalkCmd.UserArrived, body, utag);

    //把現在room內的用戶通知給這個用戶
    for(var key in room){
        session.send_cmd(1, TalkCmd.UserArrived, room[key].uinfo, utag, proto_type);
    }

    //保存此用戶信息在room
    var talkman = {
        session: session,
        utag: utag,
        proto_type: proto_type,
        uinfo: body
    }
    room[utag] = talkman;
}

function on_user_exit_talkroom(session, is_lost_connect, utag, proto_type){
    if(!room[utag]){
        if(!is_lost_connect){
            session.send_cmd(1, TalkCmd.Exit, Response.Not_In_Room, utag, proto_type);
        }
        return;
    }

    //通知其他用戶該用戶已離開
    boardcast_cmd(TalkCmd.UserExit, room[utag].uinfo, utag);

    //刪除room內該用戶資料
    room[utag] = null;
    delete room[utag];

    //通知該用戶他已離開
    if(!is_lost_connect){
        session.send_cmd(1, TalkCmd.Exit, Response.OK, utag, proto_type);
    }
}

function on_user_send_msg(session, msg, utag, proto_type){
    if(!room[utag]){
        session.send_cmd(1, TalkCmd.SendMsg, {
            0: Response.INVAILD,
            1: null,
            2: null,
            3: null
        }, utag, proto_type);
        return;
    }

    //通知該用戶成功發送消息
    session.send_cmd(1, TalkCmd.SendMsg, {
        0: Response.OK,
        1: room[utag].uinfo.uname,
        2: room[utag].uinfo.usex,
        3: msg
    }, utag, proto_type)

    //廣播所有用戶該用戶消息
    boardcast_cmd(TalkCmd.UserMsg, {
        0: room[utag].uinfo.uname,
        1: room[utag].uinfo.usex,
        2: msg
    }, utag);
}

var service = {
    name: "TalkRoom",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info("player recv cmd: ", ctype, body);
        switch (ctype){
            case TalkCmd.Enter:
                on_user_enter_talkroom(session, body, utag, proto_type);
            break;
            case TalkCmd.Exit: //主動離開
                on_user_exit_talkroom(session, false, utag, proto_type);
            break;
            case TalkCmd.SendMsg:
                on_user_send_msg(session, body, utag, proto_type);
            break;
            case Cmd.USER_DISCONNECT:
                on_user_exit_talkroom(session, true, utag, proto_type);
            break;
        }
    },

    on_player_disconnect: function(session, stype){
        log.warn("lost connect with gateway...:", stype);
        // log.info("player disconnect, session key: ", session.session_key);
        // on_user_exit_talkroom(session, true);
    }
}

module.exports = service;