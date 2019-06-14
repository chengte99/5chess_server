var Stype = require("../Stype");
var Cmd = require("../Cmd")
var Response = require("../Response");
var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");

/*
取得用戶遊戲數據
客戶端發送：
3, 1, null
服務端返回: 
3, 1, body = {
    0: status
    1: uexp (int32)
    2: uchip (int32)
    3: uvip
}
*/

function encode_get_ugame_info(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 4 + 4 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;

    proto_tool.write_int32(cmd_buf, body[1], offset);
    offset += 4;

    proto_tool.write_int32(cmd_buf, body[2], offset);
    offset += 4;

    proto_tool.write_int16(cmd_buf, body[3], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.GameSystem, Cmd.GameSystem.GET_GAME_INFO, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.GameSystem, Cmd.GameSystem.GET_GAME_INFO, encode_get_ugame_info);

/*
獲取登入獎勵
客戶端發送：
3, 2, null
服務端返回: 
3, 2, body = {
    0: status
    1: bonus_status, 0: 沒有獎勵，1: 有獎勵
    2: id (int32)
    3: bonus (int32)
    4: days
}
*/

function encode_get_login_bonus_info(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 2 + 4 + 4 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;

    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;

    proto_tool.write_int32(cmd_buf, body[2], offset);
    offset += 4;

    proto_tool.write_int32(cmd_buf, body[3], offset);
    offset += 4;

    proto_tool.write_int16(cmd_buf, body[4], offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.GameSystem, Cmd.GameSystem.GET_LOGIN_BONUS_INFO, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.GameSystem, Cmd.GameSystem.GET_LOGIN_BONUS_INFO, encode_get_login_bonus_info);

/*
領取登入獎勵
客戶端發送：
3, 3, body = bonus_id (int32)
服務端返回: 
3, 3, body = {
    0: status
    1: bonus (int32)
}
*/

function encode_recv_login_bonus(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var total_len = proto_tool.header_size + 2 + 4;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;

    proto_tool.write_int32(cmd_buf, body[1], offset);
    offset += 4;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.GameSystem, Cmd.GameSystem.RECV_LOGIN_BONUS, proto_tool.decode_int32_cmd);
proto_man.reg_buf_encoder(Stype.GameSystem, Cmd.GameSystem.RECV_LOGIN_BONUS, encode_recv_login_bonus);

/*
獲取全局排行榜(以金幣排名)
客戶端發送：
3, 4, null
服務端返回: 
3, 4, body = {
    0: status
    1: array.length (int16)
    2: 
    [
        [unick, usex, uface, uchip(int32)],
        [unick, usex, uface, uchip],
        [],
        ...
    ]
    3: my_rank (int16)
}
*/

function encode_get_world_rank_info(stype, ctype, body){
    if(body[0] != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body[0]);
    }

    var array_len = body[1];
    var uinfo_list = body[2];

    var uinfo_list_len = 0;

    for(var i = 0; i < array_len; i ++){
        var uinfo = uinfo_list[i];
        var unick_len = uinfo[0].utf8_byte_len();
        uinfo_list_len += (2 + unick_len) + 2 + 2 + 4;
    }

    var total_len = proto_tool.header_size + 2 + 2 + uinfo_list_len + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body[0], offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body[1], offset);
    offset += 2;

    for(var i = 0; i < array_len; i ++){
        var uinfo = uinfo_list[i];
        var unick_len = uinfo[0].utf8_byte_len();

        offset = proto_tool.write_str_inbuf(cmd_buf, offset, unick_len, uinfo[0]);

        proto_tool.write_int16(cmd_buf, uinfo[1], offset);
        offset += 2;
        proto_tool.write_int16(cmd_buf, uinfo[2], offset);
        offset += 2;
        proto_tool.write_int32(cmd_buf, uinfo[3], offset);
        offset += 4;
    }

    proto_tool.write_int16(cmd_buf, body[3], offset);
    offset += 2;
    
    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.GameSystem, Cmd.GameSystem.GET_WORLD_RANK_INFO, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(Stype.GameSystem, Cmd.GameSystem.GET_WORLD_RANK_INFO, encode_get_world_rank_info);