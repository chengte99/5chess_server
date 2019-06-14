var Stype = require("../Stype");
var Cmd = require("../Cmd")
var Response = require("../Response");
var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");

/*
進入房間區間
客戶端發送：
4, 1, body = zid (int16)
服務端返回: 
4, 1, body = status
*/

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.ENTER_ZONE, proto_tool.decode_status_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.ENTER_ZONE, proto_tool.encode_status_cmd);

/*
用戶主動離開
客戶端發送：
4, 2, null
服務端返回:
4, 2, body = status
*/

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.USER_QUIT, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.USER_QUIT, proto_tool.encode_status_cmd);

/*
用戶進入房間
客戶端發送：
4, 3, body = room_id (32)
服務端返回:
4, 3, body = {
    0: status (16)
    1: zid (16)
    2: room_id (32)
}
*/

function encode_enter_room(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 2 + 4;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;
    proto_tool.write_int32(cmd_buf, body[2], offset);
    offset += 4;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.ENTER_ROOM, proto_tool.decode_int32_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.ENTER_ROOM, encode_enter_room);

/*
用戶離開房間
客戶端發送：
4, 4, null
服務端返回:
4, 4, body = status
*/

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.EXIT_ROOM, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.EXIT_ROOM, proto_tool.encode_status_cmd);

/*
用戶坐下座位
客戶端發送：
4, 5, body = seat_id (16)
服務端返回:
4, 5, body = {
    0: status (16)
    1: seat_id (16)
}
*/

function encode_user_sitdown(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.USER_SITDOWN, proto_tool.decode_status_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.USER_SITDOWN, encode_user_sitdown);

/*
用戶抵達
服務器發送：
4, 7, body = {
    0: sv_seat, (16)

    1: player.unick, 
    2: player.usex, (16)
    3: player.uface, (16)

    4: player.uchip, (32)
    5: player.uexp, (32)
    6: player.uvip (16)
}
*/

function encode_user_arrived(stype, ctype, body){
    var unick_len = body[1].utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + (2 + unick_len) + 2 + 2 + 4 + 4 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;

    offset = proto_tool.write_str_inbuf(cmd_buf, offset, unick_len, body[1]);

    proto_tool.write_int16(cmd_buf, body[2], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[3], offset);
    offset += 2;
    proto_tool.write_int32(cmd_buf, body[4], offset);
    offset += 4;
    proto_tool.write_int32(cmd_buf, body[5], offset);
    offset += 4;
    proto_tool.write_int16(cmd_buf, body[6], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.USER_ARRIVED, encode_user_arrived);

/*
用戶站起座位
客戶端發送：
4, 6, null
服務端返回:
4, 6, body = {
    0: status (16)
    1: sv_seat (16)
}
*/

function encode_user_standup(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }
    var total_len = proto_tool.header_size + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;
    
    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.USER_STANDUP, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.USER_STANDUP, encode_user_standup);

/*
用戶發送道具
客戶端發送：
4, 8, body = {
    0: prop_id,
    1: to_seat_id
}
服務器返回：
4, 8, body = {
    0: status,
    1: from_seat_id,
    2: to_seat_id,
    3: prop_id
}
*/

function decode_send_prop(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;
    var offset = proto_tool.header_size;
    body[0] = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    body[1] = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;

    return cmd;
}

function encode_send_prop(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }
    var total_len = proto_tool.header_size + 2 + 2 + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[2], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[3], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.SEND_PROP, decode_send_prop);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.SEND_PROP, encode_send_prop);

/*
用戶按下準備
客戶端發送：
4, 9, null
服務器返回：
4, 9, body = {
    0: status, (16)
    1: seat_id, (16)
}
*/

function encode_do_ready(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Game5Chess, Cmd.Game5Chess.DO_READY, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.DO_READY, encode_do_ready);

/*
遊戲開始
服務器主動發送
4, 10, body = {
    0: think_time, //玩家思考時間 (16)
    1: wait_time, //幾秒後遊戲開始，播動畫時間 (16)
    2: black_seat_id, //執黑棋座位 (16)
}
*/

function encode_round_game_start(stype, ctype, body){
    var total_len = proto_tool.header_size + 2 + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[2], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_encoder(Stype.Game5Chess, Cmd.Game5Chess.ROUND_GAME_START, encode_round_game_start);

/*
輪到玩家
服務器主動發送
4, 11, body = {
    0: think_time, //玩家思考時間 (16)
    1: seat_id, //輪到哪位玩家 (16)
    2: [operation], //可執行操作，這邊暫時不做忽略
}
*/

/*
玩家下棋
客戶端發送
4, 12, body = {
    0: block_x, //x座標
    1: block_y, //y座標
}
服務器返回
4, 12, body = {
    0: status
    1: block_x, //x座標
    2: block_y, //y座標
    3: chess_type, //棋子顏色
}
*/

/*
結算遊戲
服務器主動發送
4, 13, body = {
    0: winner_seatid, //贏家座位號碼， -1 等於 平局
    1: winner_score, //輸贏分數
}
*/

/*
結算遊戲完成
服務器主動發送
4, 14, null
*/

/*
遊戲中斷線重連
服務器主動發送
4, 15, body = {
    0: seat_id, 
    1: arrived_data, 已抵達的座位數據 []
    2: game_round_data, 房間開局數據 {}
    3: disk, 棋盤數據 []
    4: game_ctl, 遊戲進度數據 []
}
*/

/*
獲取上局回放
客戶端發送
4, 16, null
服務器返回
4, 16, body = {
    0: status, (int)
    1: round_data ([])
}
*/

