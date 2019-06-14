var log = require("../../utils/log");
var Stype = require("../Stype");
var Cmd = require("../Cmd");
var Response = require("../Response");
var proto_man = require("../../netbus/proto_man");
var State = require("./State");
var mysql_game = require("../../database/mysql_game");
var redis_game = require("../../database/redis_game");

function five_chess_player(uid){
    this.uid = uid;
    this.uchip = 0;
    this.uexp = 0;
    this.uvip = 0;

    this.unick = "";
    this.usex = -1;
    this.uface = -1;

    this.zid = -1; // 玩家当前所在的区间
    this.room_id = -1; // 玩家当前所在的房间
    this.seat_id = -1; // 玩家当前所在的座位

    this.session = null;
    this.proto_type = -1;
    this.state = State.InView;
}

five_chess_player.prototype.init_ugame_info = function(ugame_info){
    this.uchip = ugame_info.uchip;
    this.uexp = ugame_info.uexp;
    this.uvip = ugame_info.uvip;
}

five_chess_player.prototype.init_uinfo = function(uinfo){
    this.unick = uinfo.unick;
    this.usex = uinfo.usex;
    this.uface = uinfo.uface;
}

five_chess_player.prototype.enter_room = function(room){
    this.state = State.InView;
}

five_chess_player.prototype.exit_room = function(room){
    this.state = State.InView;
}

five_chess_player.prototype.sitdown = function(room){

}

five_chess_player.prototype.standup = function(room){

}

five_chess_player.prototype.do_ready = function(room){
    this.state = State.Ready;
}

five_chess_player.prototype.on_round_start = function(){
    this.state = State.Playing;
}

// 如果要做机器人，那么机器人就可以继承这个chess_player, 
// 重载这个turn_to_player, 能够在这里自己思考来下棋
five_chess_player.prototype.turn_to_player = function(){

}

five_chess_player.prototype.check_out_game = function(room, ret, is_winner){
    this.state = State.Checkout;

    if(ret === 2){
        return;
    }
    var one_round_chip = room.one_round_chip;

    //更新數據庫 & redis
    mysql_game.update_game_info_uchip_by_uid(this.uid, one_round_chip, is_winner, function(status){
        if(status != Response.OK){
            log.warn("update_game_info_uchip_by_uid fail, Response: ", status);
        }
    });
    redis_game.add_ugame_info_uchip(this.uid, one_round_chip, is_winner);

    //更新內存player 數據
    if(!is_winner){
        this.uchip -= one_round_chip;
    }else{
        this.uchip += one_round_chip;
    }
}

five_chess_player.prototype.check_out_game_over = function(){
    this.state = State.InView;
}

five_chess_player.prototype.init_session = function(session, proto_type){
    this.session = session;
    this.proto_type = proto_type;
}

five_chess_player.prototype.send_cmd = function(stype, ctype, body){
    if(!this.session){
        log.warn("session is null, send_cmd failed");
        return;
    }

    this.session.send_cmd(stype, ctype, body, this.uid, this.proto_type);
}

module.exports = five_chess_player;