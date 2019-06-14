var Stype = require("../Stype");
var Cmd = require("../Cmd")
var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");
var Response = require("../Response");

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
function decode_guest_login(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    body.status = proto_tool.read_int16(cmd_buf, offset);
    if(body.status != Response.OK){
        return cmd;
    }
    offset += 2;
    body.uid = proto_tool.read_uint32(cmd_buf, offset);
    offset += 4;

    var ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body.unick = ret[0];
    offset = ret[1];

    body.usex = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    body.uface = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;
    body.uvip = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;

    ret = proto_tool.read_str_inbuf(cmd_buf, offset);
    body.guest_key = ret[0];
    offset = ret[1];

    return cmd;
}

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

proto_man.reg_buf_decoder(Stype.Auth, Cmd.Auth.GUEST_LOGIN, decode_guest_login);
proto_man.reg_buf_encoder(Stype.Auth, Cmd.Auth.GUEST_LOGIN, encode_guest_login);

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
    unick:
    usex:
    uface:
    uvip:
}
*/
function decode_uname_login(dataview){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(dataview, 0);
    cmd[1] = proto_tool.read_int16(dataview, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    body.status = proto_tool.read_int16(dataview, offset);
    if(body.status != Response.OK){
        return cmd;
    }
    offset += 2;

    body.uid = proto_tool.read_uint32(dataview, offset);
    offset += 4;

    var ret = proto_tool.read_str_inbuf(dataview, offset);
    body.unick = ret[0];
    offset = ret[1];

    body.usex = proto_tool.read_int16(dataview, offset);
    offset += 2;
    body.uface = proto_tool.read_int16(dataview, offset);
    offset += 2;
    body.uvip = proto_tool.read_int16(dataview, offset);
    offset += 2;

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
