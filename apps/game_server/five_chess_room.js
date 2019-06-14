var log = require("../../utils/log");
var Stype = require("../Stype");
var Cmd = require("../Cmd");
var Response = require("../Response");
var proto_man = require("../../netbus/proto_man");
var State = require("./State");
var utils = require("../../utils/utils");

var five_chess_model = require("./five_chess_model");
var QuitReason = require("./QuitReason");

var INVIEW_SEAT = 20;
var GAME_SEAT = 2;

var DISK_SIZE = 15;
var CHESS_TYPE = {
    NONE: 0,
    BLACK: 1,
    WHITE: 2,
}

function write_err(status, ret_func){
    var ret = {};
    ret[0] = status;
    ret_func(ret);
}

function five_chess_room(room_id, conf){
    this.zid = conf.zid;
    this.room_id = room_id;
    this.enter_vip = conf.enter_vip;
    this.min_chip = conf.chip;
    this.one_round_chip = conf.one_round_chip;
    this.think_time = conf.think_time;
    this.state = State.Ready;

    this.black_rand = true;
    this.black_seat_id = -1;
    this.cur_seat_id = -1;

    //創建15*15棋盤
    this.chess_disk = [];
    for(var i = 0; i < DISK_SIZE * DISK_SIZE; i ++){
        this.chess_disk.push(CHESS_TYPE.NONE);
    }

    this.inview_players = [];
    for(var i = 0; i < INVIEW_SEAT; i ++){
        this.inview_players.push(null);
    }

    this.game_seats = [];
    for(var i = 0; i < GAME_SEAT; i ++){
        this.game_seats.push(null);
    }

    //創建timer對象
    this.action_timer = null;
    this.action_timeout_timestamp = 0;

    //上局回访数据
    this.prev_round_data = null;
    this.round_data = {};
}

five_chess_room.prototype.reset_chess_disk = function(){
    for(var i = 0; i < DISK_SIZE * DISK_SIZE; i ++){
        this.chess_disk[i] = CHESS_TYPE.NONE;
    }
}

five_chess_room.prototype.search_empty_seat_inview_players = function(){
    for(var i = 0; i < INVIEW_SEAT; i ++){
    // for(var i in this.inview_players){
        if(!this.inview_players[i]){
            return i;
        }
    }

    return -1;
}

five_chess_room.prototype.search_empty_seat = function(){
    for(var i = 0; i < GAME_SEAT; i ++){
    // for(var i in this.game_seats){
        if(!this.game_seats[i]){
            return i;
        }
    }

    return -1;
}

five_chess_room.prototype.get_user_arrived = function(other){
    var body = {
        0: other.seat_id,

        1: other.unick,
        2: other.usex,
        3: other.uface,

        4: other.uchip,
        5: other.uexp,
        6: other.uvip,
        7: other.state,
    }
    return body;
}

five_chess_room.prototype.player_enter_room = function(player){
    var inview_seat = this.search_empty_seat_inview_players();
    if(inview_seat < 0){
        log.warn("inview_seat all full .");
        return;
    }
    
    player.room_id = this.room_id;
    this.inview_players[inview_seat] = player;
    player.enter_room(this);

    //進入房間，廣播給房間內的人(包括旁觀者)，如果有必要的話
    //

    log.info("player uid:", player.uid, ", enter_room:", player.room_id);
    var body = {
        0: Response.OK,
        1: this.zid,
        2: this.room_id,
    }
    player.send_cmd(Stype.Game5Chess, Cmd.Game5Chess.ENTER_ROOM, body);

    //將已經在座位上的人通知該用戶
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i]){
            continue;
        }
        var other = this.game_seats[i];
        var body = this.get_user_arrived(other);
        player.send_cmd(Stype.Game5Chess, Cmd.Game5Chess.USER_ARRIVED, body);
    }

    //自動配座 或是 手點點座位(由客戶端送seat_id，server驗證後坐下)
    //這邊使用自動
    this.do_sitdown(player);
}

five_chess_room.prototype.player_exit_room = function(player, quit_reason){
    if(quit_reason == QuitReason.UserLostConn && this.state == State.Playing && player.state == State.Playing){
        return false
    }

    if(player.seat_id != -1){
        if(player.state == State.Playing){
            var winner_seat_id = GAME_SEAT - player.seat_id - 1; //對家贏
            var winner = this.game_seats[winner_seat_id];
            this.check_out_game(1, winner);
        }

        this.do_standup(player);
    }

    player.room_id = -1;
    for(var i in this.inview_players){
        if(this.inview_players[i] == player){
            this.inview_players[i] = null;
        }
    }
    player.exit_room(this);

    log.info("player uid:", player.uid, ", exit_room");
    var status = Response.OK
    player.send_cmd(Stype.Game5Chess, Cmd.Game5Chess.EXIT_ROOM, status);

    //離開房間，廣播給房間內的人（包括旁觀者），有必要的話
    // 

    return true;
}

five_chess_room.prototype.do_sitdown = function(player){
    var sv_seat = this.search_empty_seat();
    if(sv_seat < 0){
        log.warn("game_seats all full .");
        return;
    }

    this.game_seats[sv_seat] = player;
    player.seat_id = sv_seat;
    player.sitdown(this);

    log.info("player uid:", player.uid, ", sitdown seat:", player.seat_id);
    var body = {
        0: Response.OK,
        1: sv_seat,
    }
    player.send_cmd(Stype.Game5Chess, Cmd.Game5Chess.USER_SITDOWN, body);

    //坐下，廣播給座位上的人（包括旁觀者）
    var body = this.get_user_arrived(player);
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.USER_ARRIVED, body, player.uid);
    // 
}

five_chess_room.prototype.do_standup = function(player){
    var sv_seat = player.seat_id;
    this.game_seats[player.seat_id] = null;
    player.seat_id = -1;
    player.standup(this);

    log.info("player uid:", player.uid, ", standup seat");
    var body = {
        0: Response.OK,
        1: sv_seat
    }
    //站起，廣播給房間內的人(包括自己)
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.USER_STANDUP, body, null);
    //
}

five_chess_room.prototype.empty_seat = function(){
    // return 1;
    var num = 0;
    for(var i in this.game_seats){
        if(this.game_seats[i] === null){
            num ++;
        }
    }
    return num;
}

//根據旁觀者列表發送
five_chess_room.prototype.room_broadcast = function(stype, ctype, body, not_to_uid){
    var json_uid = [];
    var buf_uid = [];

    var json_cmd_buf = null;
    var buf_cmd_buf = null;

    var gw_session = null;
    for(var i = 0; i < this.inview_players.length; i ++){
        if(!this.inview_players[i] || 
            this.inview_players[i].session == null || 
            this.inview_players[i].uid == not_to_uid){
            continue;
        }

        gw_session = this.inview_players[i].session;
        if(this.inview_players[i].proto_type == proto_man.PROTO_JSON){
            json_uid.push(this.inview_players[i].uid);
            if(!json_cmd_buf){
                json_cmd_buf = proto_man.encode_cmd(0, proto_man.PROTO_JSON, stype, ctype, body);
            }
        }else{
            buf_uid.push(this.inview_players[i].uid);
            if(!buf_cmd_buf){
                buf_cmd_buf = proto_man.encode_cmd(0, proto_man.PROTO_BUF, stype, ctype, body);
            }
        }
    }

    if(json_uid.length > 0){
        var ret = {
            cmd_buf: json_cmd_buf,
            users: json_uid,
        }
        gw_session.send_cmd(Stype.Broadcast, Cmd.BROADCAST, ret, 0, proto_man.PROTO_BUF);
    }

    if(buf_uid.length > 0){
        var ret = {
            cmd_buf: buf_cmd_buf,
            users: buf_uid,
        }
        gw_session.send_cmd(Stype.Broadcast, Cmd.BROADCAST, ret, 0, proto_man.PROTO_BUF);
    }
}

five_chess_room.prototype.send_prop = function(p, prop_id, to_seat, ret_func){
    if(prop_id <= 0 || prop_id > 5){
        write_err(Response.INVAILD_PARAMS, ret_func);
        return;
    }

    var body = {
        0: Response.OK,
        1: p.seat_id,
        2: to_seat,
        3: prop_id,
    }
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.SEND_PROP, body, null);
}

five_chess_room.prototype.next_black_id = function(cur){
    for(var i = cur + 1; i < GAME_SEAT; i ++){
        if(this.game_seats[i] && this.game_seats[i].state == State.Playing){
            return i;
        }
    }

    for(var i = 0; i < cur; i ++){
        if(this.game_seats[i] && this.game_seats[i].state == State.Playing){
            return i;
        }
    }

    return -1;
}

five_chess_room.prototype.get_next_seat_id = function(){
    for(var i = this.cur_seat_id + 1; i < GAME_SEAT; i ++){
        if(this.game_seats[i] && this.game_seats[i].state == State.Playing){
            return i;
        }
    }

    for(var i = 0; i < this.cur_seat_id; i ++){
        if(this.game_seats[i] && this.game_seats[i].state == State.Playing){
            return i;
        }
    }

    return -1;
}

five_chess_room.prototype.get_game_round_data = function(){
    var wait_client_time = 3000; //ms
    var body = {
        0: this.think_time,
        1: wait_client_time,
        2: this.black_seat_id
    }
    return body;
}

five_chess_room.prototype.game_start = function(){
    //改變房間狀態
    this.state = State.Playing;

    //清理棋盤
    this.reset_chess_disk();

    //改變位置上玩家的狀態
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i] || this.game_seats[i].state != State.Ready){
            continue;
        }

        this.game_seats[i].on_round_start();
    }

    //決定黑棋位置
    //第一次採用隨機，之後輪流
    if(this.black_rand){
        this.black_rand = false;
        this.black_seat_id = utils.random_int(0, 1);
    }else{
        this.black_seat_id = this.next_black_id(this.black_seat_id);
    }

    //廣播給房間所有人，遊戲開始
    /*
    var wait_client_time = 3000; //ms
    var body = {
        0: this.think_time,
        1: wait_client_time,
        2: this.black_seat_id
    }*/
    var body = this.get_game_round_data();
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.ROUND_GAME_START, body, null);

    this.cur_seat_id = -1;
    //wait_client_time 後輪到玩家動作，從執黑棋的開始，
    setTimeout(this.turn_to_player.bind(this), body[1], this.black_seat_id);

    //保存當前信息
    var seat_data = [];
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i] || this.game_seats[i].state != State.Playing){
            continue;
        }

        var uinfo = this.get_user_arrived(this.game_seats[i]);
        seat_data.push(uinfo);
    }
    this.round_data[0] = seat_data;
    var action_cmd = [utils.timestamp(), Stype.Game5Chess, Cmd.Game5Chess.ROUND_GAME_START, body];
    this.round_data[1] = [];
    this.round_data[1].push(action_cmd);
}

five_chess_room.prototype.do_player_action_timeout = function(seat_id){
    this.action_timer = null;

    /*
    //玩家超時，對家獲勝
    var winner_seat_id = GAME_SEAT - seat_id - 1;
    var winner = this.game_seats[winner_seat_id];
    this.check_out_game(1, winner);
    */

    //改回轉到下一位玩家
    var next_seat_id = this.get_next_seat_id();
    this.turn_to_player(next_seat_id);
}

five_chess_room.prototype.turn_to_player = function(seat_id){
    if(this.action_timer != null){
        clearTimeout(this.action_timer);
        this.action_timer = null;
    }

    if(!this.game_seats[seat_id] || this.game_seats[seat_id].state != State.Playing){
        log.warn("turn_to_player: ", seat_id, "seat is invalid!!!!");
        return;
    }

    var p = this.game_seats[seat_id];
    p.turn_to_player();
    
    this.cur_seat_id = seat_id;
    var body = {
        0: this.think_time,
        1: seat_id,
    }

    //計時思考時間
    this.action_timer = setTimeout(this.do_player_action_timeout.bind(this), this.think_time * 1000, seat_id);
    this.action_timeout_timestamp = utils.timestamp() + this.think_time;
    
    //廣播給房間內所有人輪到誰
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.TURN_TO_PLAYER, body, null);

    //保存當前信息
    var action_cmd = [utils.timestamp(), Stype.Game5Chess, Cmd.Game5Chess.TURN_TO_PLAYER, body];
    this.round_data[1].push(action_cmd);
}

five_chess_room.prototype.check_game_start = function(){
    var ready_num = 0;
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i] || this.game_seats[i].state != State.Ready){
            continue;
        }

        ready_num ++;
    }
    
    if(ready_num >= GAME_SEAT){
        this.game_start();
    }
}

five_chess_room.prototype.do_ready = function(p, ret_func){
    if(p != this.game_seats[p.seat_id]){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    if(p.state != State.InView || this.state != State.Ready){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    p.do_ready();
    // 廣播給房間內所有用戶
    var body = {
        0: Response.OK,
        1: p.seat_id,
    }

    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.DO_READY, body, null);

    //check ready's player number
    this.check_game_start();
}

five_chess_room.prototype.check_game_over = function(chess_type){
    // 行結算
    for(var i = 0; i < 15; i ++){
        for(j = 0; j <= (15 - 5); j ++){
            if(this.chess_disk[(i * 15 + j + 0)] == chess_type && 
               this.chess_disk[(i * 15 + j + 1)] == chess_type && 
               this.chess_disk[(i * 15 + j + 2)] == chess_type && 
               this.chess_disk[(i * 15 + j + 3)] == chess_type && 
               this.chess_disk[(i * 15 + j + 4)] == chess_type){
                return 1;
            }
        }
    }

    // 列結算
    for(var i = 0; i < 15; i ++){
        for(var j = 0; j <= (15 - 5); j ++){
            if(this.chess_disk[((j + 0) * 15 + i )] == chess_type && 
               this.chess_disk[((j + 1) * 15 + i )] == chess_type && 
               this.chess_disk[((j + 2) * 15 + i )] == chess_type && 
               this.chess_disk[((j + 3) * 15 + i )] == chess_type && 
               this.chess_disk[((j + 4) * 15 + i )] == chess_type){
                return 1;
            }
        }
    }

    //右上角 / 斜線結算
    var line_total = 15;
    for(var i = 0; i <= (15 - 5); i ++){
        for(var j = 0; j < (line_total - 4); j ++){
            if(this.chess_disk[((i + j + 0) * 15 + j + 0)] == chess_type && 
               this.chess_disk[((i + j + 1) * 15 + j + 1)] == chess_type && 
               this.chess_disk[((i + j + 2) * 15 + j + 2)] == chess_type && 
               this.chess_disk[((i + j + 3) * 15 + j + 3)] == chess_type && 
               this.chess_disk[((i + j + 4) * 15 + j + 4)] == chess_type){
                return 1;
            }
        }
        line_total --;
    }

    line_total = 15 - 1;
    for(var i = 1; i <= (15 - 5); i ++){
        for(var j = 0; j < (line_total - 4); j ++){
            if(this.chess_disk[((j + 0) * 15 + i + j + 0)] == chess_type && 
               this.chess_disk[((j + 1) * 15 + i + j + 1)] == chess_type && 
               this.chess_disk[((j + 2) * 15 + i + j + 2)] == chess_type && 
               this.chess_disk[((j + 3) * 15 + i + j + 3)] == chess_type && 
               this.chess_disk[((j + 4) * 15 + i + j + 4)] == chess_type){
                return 1;
            }
        }
        line_total --;
    }

    //左上角 \ 斜線結算
    line_total = 15;
    for(var i = 14; i >= 4; i --){
        for(var j = 0; j < (line_total - 4); j ++){
            if(this.chess_disk[((i - j - 0) * 15 + j + 0)] == chess_type && 
               this.chess_disk[((i - j - 1) * 15 + j + 1)] == chess_type && 
               this.chess_disk[((i - j - 2) * 15 + j + 2)] == chess_type && 
               this.chess_disk[((i - j - 3) * 15 + j + 3)] == chess_type && 
               this.chess_disk[((i - j - 4) * 15 + j + 4)] == chess_type){
                return 1;
            }
        }
        line_total --;
    }

    line_total = 1;
    var offset = 0;
    for(var i = 1; i <= (15 - 5); i ++){
        offset = 0;
        for(var j = 14; j >= (line_total + 4); j --){
            if(this.chess_disk[((j - 0) * 15 + i + offset + 0)] == chess_type && 
               this.chess_disk[((j - 1) * 15 + i + offset + 1)] == chess_type && 
               this.chess_disk[((j - 2) * 15 + i + offset + 2)] == chess_type && 
               this.chess_disk[((j - 3) * 15 + i + offset + 3)] == chess_type && 
               this.chess_disk[((j - 4) * 15 + i + offset + 4)] == chess_type){
                return 1;
            }
            offset ++;
        }
        line_total ++;
    }

    for(var i = 0; i < DISK_SIZE * DISK_SIZE; i ++){
        if(this.chess_disk[i] == CHESS_TYPE.NONE){
            return 0; // 還有位子沒下棋
        }
    }

    return 2; //平局
}

five_chess_room.prototype.check_out_game_over = function(){
    this.state = State.Ready;

    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i] || this.game_seats[i].state != State.Checkout){
            continue;
        }
        this.game_seats[i].check_out_game_over();
    }

    //廣播遊戲結算完成
    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.CHECKOUT_OVER, null, null);

    //移除不合要求的玩家
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i]){
            continue;
        }

        //不符合金幣要求
        if(this.game_seats[i].uchip < this.min_chip){
            //剔除
            five_chess_model.kick_user_for_chip_not_enough();
            continue;
        }

        // 超时间很多
		// end 
		// ......
    }
}

five_chess_room.prototype.check_out_game = function(ret, winner){
    if(this.action_timer != null){
        clearTimeout(this.action_timer);
        this.action_timer = null;
    }

    this.state = State.Checkout;

    //遍歷座位上的玩家，更新數據
    for(var i = 0; i < GAME_SEAT; i ++){
        if(this.game_seats[i] === null || this.game_seats[i].state != State.Playing){
            continue;
        }

        this.game_seats[i].check_out_game(this, ret, this.game_seats[i] === winner);
    }

    var winner_seat_id = winner.seat_id;
    var winner_score = this.one_round_chip;

    if(ret === 2){
        winner_seat_id = -1; //平局
    }
    //廣播所有人結算遊戲
    var body = {
        0: winner_seat_id,
        1: winner_score,
    }

    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.CHECKOUT, body, null);

    //保存當前信息
    var action_cmd = [utils.timestamp(), Stype.Game5Chess, Cmd.Game5Chess.CHECKOUT, body];
    this.round_data[1].push(action_cmd);

    this.prev_round_data = this.round_data;
    this.round_data = {};

    //移除不合要求的玩家
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i]){
            continue;
        }

        //已斷線玩家
        if(this.game_seats[i].session == null){
            five_chess_model.kick_offine_player();
            continue;
        }

        // 超时间很多
		// end 
		// ......
    }

    //等待結算動畫後，通知結算完成
    var checkout_game_over_time = 5000;
    setTimeout(this.check_out_game_over.bind(this), checkout_game_over_time);
}

five_chess_room.prototype.put_chess = function(p, block_x, block_y, ret_func){
    if(p != this.game_seats[p.seat_id]){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    if(p.state != State.Playing || this.state != State.Playing){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    if(p.seat_id != this.cur_seat_id){
        write_err(Response.NOT_YOUR_TURN, ret_func);
        return;
    }

    if(block_x < 0 || block_x > 14 || block_y < 0 || block_y > 14){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    var index = block_y * 15 + block_x;
    if(this.chess_disk[index] != CHESS_TYPE.NONE){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    if(this.action_timer != null){
        clearTimeout(this.action_timer);
        this.action_timer = null;
    }

    if(p.seat_id == this.black_seat_id){
        this.chess_disk[index] = CHESS_TYPE.BLACK;
    }else{
        this.chess_disk[index] = CHESS_TYPE.WHITE;
    }

    var body = {
        0: Response.OK,
        1: block_x,
        2: block_y,
        3: this.chess_disk[index],
    }

    this.room_broadcast(Stype.Game5Chess, Cmd.Game5Chess.PUT_CHESS, body, null);

    //保存當前信息
    var action_cmd = [utils.timestamp(), Stype.Game5Chess, Cmd.Game5Chess.PUT_CHESS, body];
    this.round_data[1].push(action_cmd);

    //遊戲結算
    var ret = this.check_game_over(this.chess_disk[index]); // 1: win, 2: 平局
    if(ret != 0){
        log.info("game over :", this.chess_disk[index], ", ret: ", ret);
        this.check_out_game(ret, p);
        return;
    }

    //輪到下位玩家
    var next_seat_id = this.get_next_seat_id();
    if(next_seat_id == -1){
        log.error("cannot find next_seat !!!!");
		return;
    }

    this.turn_to_player(next_seat_id);
}

five_chess_room.prototype.do_reconnect = function(p){
    if(p.session == null || p.state != State.Playing || this.state != State.Playing){
        return
    }

    //自己的座位號
    //p.seat_id

    //已抵達座位上的數據
    var arrived_data = [];
    for(var i = 0; i < GAME_SEAT; i ++){
        if(!this.game_seats[i] || this.game_seats[i] == p || this.game_seats[i].state != State.Playing){
            continue;
        }

        var user_info = this.get_user_arrived(this.game_seats[i]);
        arrived_data.push(user_info);
    }

    //房間開局設定數據
    var game_round_data = this.get_game_round_data();

    //棋盤數據
    //this.chess_disk;

    //遊戲進度 (目前輪到誰、玩家剩餘等待時間)
    var game_ctl = [this.cur_seat_id, this.action_timeout_timestamp - utils.timestamp()];

    var body = {
        0: p.seat_id,
        1: arrived_data,
        2: game_round_data,
        3: this.chess_disk,
        4: game_ctl,
    }

    p.send_cmd(Stype.Game5Chess, Cmd.Game5Chess.RECONNECT, body);
}

five_chess_room.prototype.get_prev_round = function(p, ret_func){
    if(!this.prev_round_data || p.state == State.Playing || this.state == State.Playing){
        write_err(Response.INVAILD_OPT, ret_func);
        return;
    }

    var body = {
        0: Response.OK,
        1: this.prev_round_data,
    }

    ret_func(body);
}

module.exports = five_chess_room;