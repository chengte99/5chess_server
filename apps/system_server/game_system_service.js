var log = require("../../utils/log");
var Stype = require("../Stype");
var Cmd = require("../Cmd");
var Response = require("../Response");
var game_system_model = require("./game_system_model");
require("./game_system_proto");

function get_game_info(session, stype, ctype, body, utag, proto_type){
    game_system_model.get_game_info_by_uid(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function get_login_bonus_info(session, stype, ctype, body, utag, proto_type){
    game_system_model.get_login_bonus_info_by_uid(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function recv_login_bonus(session, stype, ctype, body, utag, proto_type){
    if(!body){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    game_system_model.recv_login_bonus(utag, body, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function get_world_rank_info(session, stype, ctype, body, utag, proto_type){
    game_system_model.get_world_rank_info(utag, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

var service = {
    name: "game_system_service",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(stype, ctype, body);
        switch (ctype) {
            case Cmd.GameSystem.GET_GAME_INFO:
                get_game_info(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.GameSystem.GET_LOGIN_BONUS_INFO:
                get_login_bonus_info(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.GameSystem.RECV_LOGIN_BONUS:
                recv_login_bonus(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.GameSystem.GET_WORLD_RANK_INFO:
                get_world_rank_info(session, stype, ctype, body, utag, proto_type);
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