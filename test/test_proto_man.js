var log = require("../utils/log");
var proto_man = require("../netbus/proto_man");

var data = {
    "uname": "kevin",
    "upwd": "12345"
}

var str = proto_man.encode_cmd(proto_man.PROTO_JSON, 1, 1, data);
log.info(str);
log.error("json_str length: ", str.length);
var cmd = proto_man.decode_cmd(proto_man.PROTO_JSON, str);
log.info(cmd);


function buf_encode1_1(body){
    var total_len = 2 + 2 + 2 + body.uname.length + 2 + body.upwd.length;
    var buf = Buffer.allocUnsafe(total_len);
    var stype = 1;
    var ctype = 1;

    buf.writeUInt16LE(stype, 0);
    buf.writeUInt16LE(ctype, 2);
    buf.writeUInt16LE(body.uname.length, 4);
    buf.write(body.uname, 6, body.uname.length, "utf8");

    var offset = 6 + body.uname.length;
    buf.writeUInt16LE(body.upwd.length, offset);
    buf.write(body.upwd, offset + 2, body.upwd.length, "utf8");

    return buf;
}

function buf_decode1_1(buf){
    var cmd = null;
    var stype = buf.readUInt16LE(0);
    var ctype = buf.readUInt16LE(2);
    var uname_len = buf.readUInt16LE(4);
    if((2 + 2 + 2 + uname_len) > buf.length){
        log.error("buf decode failed");
        return null;
    }
    var uname = buf.toString("utf8", 6, 6 + uname_len);

    var offset = 6 + uname_len;
    var upwd_len = buf.readUInt16LE(offset);
    if((2 + 2 + 2 + uname_len + 2 + upwd_len) > buf.length){
        log.error("buf decode failed");
        return null;
    }
    var upwd = buf.toString("utf8", offset + 2, offset + 2 + upwd_len);
    cmd = {
        0: stype,
        1: ctype,
        2: {
            "uname": uname,
            "upwd": upwd
        }
    }

    return cmd;
}

proto_man.reg_buf_encoder(1, 1, buf_encode1_1);
proto_man.reg_buf_decoder(1, 1, buf_decode1_1);

var buf = proto_man.encode_cmd(proto_man.PROTO_BUF, 1, 1, data);
log.info(buf);
log.error("buf length: ", buf.length);
cmd = proto_man.decode_cmd(proto_man.PROTO_BUF, buf);
log.info(cmd);
