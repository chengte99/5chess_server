var log = require("../../utils/log");
var Stype = require("../Stype");
var Cmd = require("../Cmd");
var Response = require("../Response");
var five_chess_model = require("./five_chess_model");
require("./five_chess_proto");
require("../gateway/bc_proto");

function enter_zone(session, stype, ctype, body, utag, proto_type){
    if(!body){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    five_chess_model.enter_zone(utag, body, session, proto_type, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function user_quit(session, stype, ctype, body, utag, proto_type){
    five_chess_model.user_quit(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function send_prop(session, stype, ctype, body, utag, proto_type){
    if(!body){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    var prop_id = body[0];
    var to_seat_id = body[1];

    five_chess_model.send_prop(utag, prop_id, to_seat_id, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function do_ready(session, stype, ctype, body, utag, proto_type){
    five_chess_model.do_ready(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function put_chess(session, stype, ctype, body, utag, proto_type){
    if(!body){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    var block_x = body[0];
    var block_y = body[1];

    five_chess_model.put_chess(utag, block_x, block_y, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type)
    })
}

function get_prev_round(session, stype, ctype, body, utag, proto_type){
    five_chess_model.get_prev_round(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type)
    })
}

var service = {
    name: "five_chess_service",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(stype, ctype, body);
        switch(ctype){
            case Cmd.Game5Chess.ENTER_ZONE:
                enter_zone(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.Game5Chess.USER_QUIT:
                user_quit(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.Game5Chess.SEND_PROP:
                send_prop(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.Game5Chess.DO_READY:
                do_ready(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.Game5Chess.PUT_CHESS:
                put_chess(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.Game5Chess.GET_PREV_ROUND_DATA:
                get_prev_round(session, stype, ctype, body, utag, proto_type);
            break;
            case Cmd.USER_DISCONNECT:
                five_chess_model.user_disconnect(utag);
            break;
            
        }
    },

    on_server_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info("server recv cmd: ", ctype, body);
    },

    on_player_disconnect: function(session, stype){

    }
}

module.exports = service;