var Stype = require("../Stype");
var Cmd = require("../Cmd")
var Response = require("../Response");
var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");


/*
遊客註冊
客戶端發送：
2, 1, ukey
服務端返回: 
2, 1, body = {
    status: 
    uid
    unick:
    usex:
    uface:
    uvip:
    guest_key:
}
*/
function encode_guest_login(stype, ctype, body){
    if(body.status != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body.status);
    }

    var unick_len = body.unick.utf8_byte_len();
    var guest_key_len = body.guest_key.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + 4 + (2 + unick_len) + 2 + 2 + 2 + (2 + guest_key_len);
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body.status, offset);
    offset += 2;
    proto_tool.write_uint32(cmd_buf, body.uid, offset);
    offset += 4;

    offset = proto_tool.write_str_inbuf(cmd_buf, offset, unick_len, body.unick);
    proto_tool.write_int16(cmd_buf, body.usex, offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body.uface, offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body.uvip, offset);
    offset += 2;

    offset = proto_tool.write_str_inbuf(cmd_buf, offset, guest_key_len, body.guest_key);
    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.GUEST_LOGIN, proto_tool.decode_str_cmd);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.GUEST_LOGIN, encode_guest_login);

/*
重複登入
服務端主動發送：
2, 2, null
*/

proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.RELOGIN, proto_tool.encode_empty_cmd);

/*
修改資料
客戶端發送：
2, 3, body ={
    unick:
    usex:
}
服務端返回：
2, 3, body = {
    status
    unick
    usex
}
*/

function decode_edit_profile(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body.unick = ret[0];
    offset = ret[1];

    body.usex = proto_tool.read_int16(cmd_buf, offset);

    return cmd;
}

function encode_edit_profile(stype, ctype, body){
    if(body.status != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body.status);
    }

    var unick_len = body.unick.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + (2 + unick_len) + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body.status, offset);
    offset += 2;
    offset = proto_tool.write_str_inbuf(cmd_buf, offset, unick_len, body.unick);
    proto_tool.write_int16(cmd_buf, body.usex, offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.EDIT_PROFILE, decode_edit_profile);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.EDIT_PROFILE, encode_edit_profile);

/*
遊客升級獲取驗證碼
客戶端發送：
2, 4, body = {
    0: 0, // 0-遊客升級，1-手機註冊，2-修改密碼
    1: phone
    2: ukey
}
服務端返回：
2, 4, body = status
*/

function decode_get_verify_via_upgrade(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    body[0] = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[2] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_UPGRADE, decode_get_verify_via_upgrade);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_UPGRADE, proto_tool.encode_status_cmd);

/*
帳號升級綁定手機
客戶端發送：
2, 5, body = {
    0: phone,
    1: pwd,
    2: code
}
服務端返回：
2, 5, body = status
*/

function decode_bind_phone_num(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[0] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[2] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.BIND_PHONE_NUM, decode_bind_phone_num);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.BIND_PHONE_NUM, proto_tool.encode_status_cmd);

/*
帳號登入
客戶端發送：
2, 6, body = {
    0: uname,
    1: upwd
}
服務端返回：
2, 6, body = {
    status:
    uid:
    unick:
    usex:
    uface:
    uvip:
}
*/

function decode_uname_login(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[0] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    return cmd;
}

function encode_uname_login(stype, ctype, body){
    if(body.status != Response.OK){
        return proto_tool.encode_status_cmd(stype, ctype, body.status);
    }

    var unick_len = body.unick.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + 4 + (2 + unick_len) + 2 + 2 + 2;
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, body.status, offset);
    offset += 2;
    proto_tool.write_uint32(cmd_buf, body.uid, offset);
    offset += 4;
    offset = proto_tool.write_str_inbuf(cmd_buf, offset, unick_len, body.unick);
    proto_tool.write_int16(cmd_buf, body.usex, offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body.uface, offset);
    offset += 2;
    proto_tool.write_int16(cmd_buf, body.uvip, offset);
    offset += 2;

    return cmd_buf;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.UNAME_LOGIN, decode_uname_login);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.UNAME_LOGIN, encode_uname_login);

/*
手機註冊獲取驗證碼
客戶端發送：
2, 7, body = {
    0: 1, // 0-遊客升級，1-手機註冊，2-修改密碼
    1: phone
}
服務端返回：
2, 7, body = status
*/

function decode_get_verify_via_reg(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    body[0] = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_REG, decode_get_verify_via_reg);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_REG, proto_tool.encode_status_cmd);

/*
手機註冊
客戶端發送：
2, 8, body = {
    0: phone,
    1: pwd,
    2: code,
    3: unick
}
服務端返回：
2, 8, body = status
*/

function decode_reg_phone_acc(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[0] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[2] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[3] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.REG_PHONE_ACC, decode_reg_phone_acc);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.REG_PHONE_ACC, proto_tool.encode_status_cmd);

/*
忘記密碼獲取驗證碼
客戶端發送：
2, 9, body = {
    0: 2, // 0-遊客升級，1-手機註冊，2-修改密碼
    1: phone
}
服務端返回：
2, 9, body = status
*/

function decode_get_verify_via_forget_pwd(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    body[0] = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_FORGET_PWD, decode_get_verify_via_forget_pwd);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.GET_VERIFY_VIA_FORGET_PWD, proto_tool.encode_status_cmd);

/*
忘記密碼
客戶端發送：
2, 10, body = {
    0: phone,
    1: pwd,
    2: code,
}
服務端返回：
2, 10, body = status
*/
function decode_reset_pwd_acc(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[0] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[1] = ret[0];
    offset = ret[1];

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body[2] = ret[0];
    offset = ret[1];

    return cmd;
}

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.RESET_PWD_ACC, decode_reset_pwd_acc);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.RESET_PWD_ACC, proto_tool.encode_status_cmd);

