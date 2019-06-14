var proto_man = require("../../netbus/proto_man");
var proto_tool = require("../../netbus/proto_tool");
var log = require("../../utils/log");
/*
客戶端：
Enter:
1, 1, body = {
    uname: "名字",
    usex: 1 or 0, 性別
};
返回: 
1, 1, response

Exit:
1, 2, body = null
返回:
1, 2, response

UserArrived: 伺服器主動發送
1, 3, body = uinfo

UserExit: 伺服器主動發送
1, 4, body = uinfo

SendMsg:
1, 5, body = "msg"
返回:
1, 5 body = {
    0: response,
    1: uname,
    2: usex,
    3: msg
}

UserMsg: 伺服器主動發送
1, 6, body = {
    0: uname,
    1: usex,
    2: msg
}
*/

function decode_enter_talkroom(buf){
    var cmd = {};
    cmd[0] = proto_tool.read_int16(buf, 0);
    cmd[1] = proto_tool.read_int16(buf, 2);
    var body = {};
    var ret = proto_tool.read_str_inbuf(buf, proto_tool.header_size);
    body.uname = ret[0];
    var offset = ret[1];
    body.usex = proto_tool.read_int16(buf, offset);
    cmd[2] = body;

    return cmd;
}

function encode_user_arrived(stype, ctype, body){
    var uname_len = body.uname.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + uname_len + 2;
    var buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(buf, stype, ctype);
    offset = proto_tool.write_str_inbuf(buf, offset, uname_len, body.uname);
    proto_tool.write_int16(buf, body.usex, offset);

    return buf;
}

function encode_user_exit(stype, ctype, body){
    var uname_len = body.uname.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + uname_len + 2;
    var buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(buf, stype, ctype);
    offset = proto_tool.write_str_inbuf(buf, offset, uname_len, body.uname);
    proto_tool.write_int16(buf, body.usex, offset);

    return buf;
}

function encode_send_msg(stype, ctype, body){
    var uname_len = body[1].utf8_byte_len();
    var msg_len = body[3].utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + 2 + uname_len + 2 + 2 + msg_len;
    var buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(buf, stype, ctype);
    proto_tool.write_int16(buf, body[0], offset);
    offset += 2;
    offset = proto_tool.write_str_inbuf(buf, offset, uname_len, body[1]);
    proto_tool.write_int16(buf, body[2], offset);
    offset += 2;
    offset = proto_tool.write_str_inbuf(buf, offset, msg_len, body[3]);

    return buf
}

function encode_user_msg(stype, ctype, body){
    var uname_len = body[0].utf8_byte_len();
    var msg_len = body[2].utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + uname_len + 2 + 2 + msg_len;
    var buf = proto_tool.alloc_buffer(total_len);
    var offset = proto_tool.write_head_inbuf(buf, stype, ctype);
    offset = proto_tool.write_str_inbuf(buf, offset, uname_len, body[0]);
    proto_tool.write_int16(buf, body[1], offset);
    offset += 2;
    offset = proto_tool.write_str_inbuf(buf, offset, msg_len, body[2]);

    return buf
}


proto_man.reg_buf_decoder(1, 1, decode_enter_talkroom);
proto_man.reg_buf_encoder(1, 1, proto_tool.encode_status_cmd);

proto_man.reg_buf_decoder(1, 2, proto_tool.decode_empty_cmd);
proto_man.reg_buf_encoder(1, 2, proto_tool.encode_status_cmd);

proto_man.reg_buf_encoder(1, 3, encode_user_arrived);
proto_man.reg_buf_encoder(1, 4, encode_user_exit);

proto_man.reg_buf_decoder(1, 5, proto_tool.decode_str_cmd);
proto_man.reg_buf_encoder(1, 5, encode_send_msg);

proto_man.reg_buf_encoder(1, 6, encode_user_msg);

