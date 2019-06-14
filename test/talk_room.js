var log = require("../utils/log");
require("./talk_room_proto.js");
var proto_man = require("../netbus/proto_man");

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
        if(session == noto_user){
            continue;
        }

        //這樣寫會浪費效能
        // session.send_cmd(1, ctype, body);
        if(session.proto_type == proto_man.PROTO_JSON){
            if(!json_encoded){
                json_encoded = proto_man.encode_cmd(proto_man.PROTO_JSON, 1, ctype, body);
            }
            session.send_encoded_cmd(json_encoded);
        }else if(session.proto_type == proto_man.PROTO_BUF){
            if(!buf_encoded){
                buf_encoded = proto_man.encode_cmd(proto_man.PROTO_BUF, 1, ctype, body);
            }
            session.send_encoded_cmd(buf_encoded);
        }
    }
}

function on_user_enter_talkroom(session, body){
    if(typeof(body.uname) == "undefined" || typeof(body.usex) == "undefined"){
        session.send_cmd(1, TalkCmd.Enter, Response.INVAILD_PARAMS);
        return;
    }

    if(room[session.session_key]){
        session.send_cmd(1, TalkCmd.Enter, Response.In_Room);
        return;
    }

    //通知該用戶他已進入
    session.send_cmd(1, TalkCmd.Enter, Response.OK);

    //廣播給其他用戶
    boardcast_cmd(TalkCmd.UserArrived, body, session);

    //把現在room內的用戶通知給這個用戶
    for(var key in room){
        session.send_cmd(1, TalkCmd.UserArrived, room[key].uinfo);
    }

    //保存此用戶信息在room
    var talkman = {
        session: session,
        uinfo: body
    }
    room[session.session_key] = talkman;
}

function on_user_exit_talkroom(session, is_lost_connect){
    if(!room[session.session_key]){
        if(!is_lost_connect){
            session.send_cmd(1, TalkCmd.Exit, Response.Not_In_Room);
        }
        return;
    }

    //通知其他用戶該用戶已離開
    boardcast_cmd(TalkCmd.UserExit, room[session.session_key].uinfo, session);

    //刪除room內該用戶資料
    room[session.session_key] = null;
    delete room[session.session_key];

    //通知該用戶他已離開
    if(!is_lost_connect){
        session.send_cmd(1, TalkCmd.Exit, Response.OK);
    }
}

function on_user_send_msg(session, msg){
    if(!room[session.session_key]){
        session.send_cmd(1, TalkCmd.SendMsg, {
            0: Response.INVAILD,
            1: null,
            2: null,
            3: null
        });
        return;
    }

    //通知該用戶成功發送消息
    session.send_cmd(1, TalkCmd.SendMsg, {
        0: Response.OK,
        1: room[session.session_key].uinfo.uname,
        2: room[session.session_key].uinfo.usex,
        3: msg
    })

    //廣播所有用戶該用戶消息
    boardcast_cmd(TalkCmd.UserMsg, {
        0: room[session.session_key].uinfo.uname,
        1: room[session.session_key].uinfo.usex,
        2: msg
    }, session);
}

var service = {
    stype: 1,
    name: "TalkRoom",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, raw_cmd){
        log.info("player recv cmd: ", ctype, body);
        switch (ctype){
            case TalkCmd.Enter:
                on_user_enter_talkroom(session, body);
            break;
            case TalkCmd.Exit: //主動離開
                on_user_exit_talkroom(session, false);
            break;
            case TalkCmd.SendMsg:
                on_user_send_msg(session, body);
            break;
        }
    },

    on_server_recv_cmd: function(session, stype, ctype, body, raw_cmd){
        log.info("server recv cmd: ", ctype, body);
    },

    on_player_disconnect: function(session){
        log.info("player disconnect, session key: ", session.session_key);
        on_user_exit_talkroom(session, true);
    }
}

module.exports = service;