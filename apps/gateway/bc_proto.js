var Stype = require("../Stype");
var Cmd = require("../Cmd")
var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");
var Response = require("../Response");

/*
Stype.Broadcast, Cmd.BROADCAST, body = {
    cmd_buf: <Buffer> //要傳送的數據包
    users: [uid, uid, ...] //要廣播的用戶ID
}
*/

function encode_broadcast(stype, ctype, body){
    var cmd_buf_len = body.cmd_buf.length;
    var users_num = body.users.length;

    var total_len = proto_tool.header_size + (2 + cmd_buf_len) + (2 + users_num * 4);
    var cmd_buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(cmd_buf, stype, ctype);
    proto_tool.write_int16(cmd_buf, cmd_buf_len, offset);
    offset += 2;

    body.cmd_buf.copy(cmd_buf, offset, 0, cmd_buf_len);
    offset += cmd_buf_len;

    proto_tool.write_int16(cmd_buf, users_num, offset);
    offset += 2;

    for(var i in body.users){
        proto_tool.write_uint32(cmd_buf, body.users[i], offset);
        offset += 4;
    }

    return cmd_buf;
}

function decode_broadcast(cmd_buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    var body = {};
    cmd[2] = body;

    var offset = proto_tool.header_size;
    var buf_len = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;

    body.cmd_buf = proto_tool.alloc_buffer(buf_len);
    cmd_buf.copy(body.cmd_buf, 0, offset, offset + buf_len);
    offset += buf_len;

    var users_num = proto_tool.read_int16(cmd_buf, offset);
    offset += 2;

    body.users = [];
    for(var i = 0; i < users_num; i ++){
        var uid = proto_tool.read_uint32(cmd_buf, offset);
        offset += 4;
        body.users.push(uid);
    }

    return cmd;
}

proto_man.reg_buf_encoder(Stype.Broadcast, Cmd.BROADCAST, encode_broadcast);
proto_man.reg_buf_decoder(Stype.Broadcast, Cmd.BROADCAST, decode_broadcast);
