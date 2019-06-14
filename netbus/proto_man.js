/*
1. 服務號、命令號、數據
2. 服務號、命令號，都以兩個字節存放
*/
var log = require("../utils/log");
var proto_tool = require("../netbus/proto_tool");

var proto_man = {
    PROTO_JSON: 1,
    PROTO_BUF: 2,

    encode_cmd: encode_cmd,
    decode_cmd: decode_cmd,
    reg_buf_encoder: reg_buf_encoder,
    reg_buf_decoder: reg_buf_decoder,

    decrypt_cmd: decrypt_cmd,
    encrypt_cmd: encrypt_cmd,

    decode_cmd_header: decode_cmd_header,
};

function encrypt_cmd(str_or_buf){
    return str_or_buf;
}

function decrypt_cmd(str_or_buf){
    return str_or_buf;
}

function _json_encode(stype, ctype, body){
    var cmd = {};
    cmd[0] = body;

    var str = JSON.stringify(cmd);
    var cmd_buf = proto_tool.encode_str_cmd(stype, ctype, str);
    
    return cmd_buf;
}

function _json_decode(cmd_buf){
    var cmd = proto_tool.decode_str_cmd(cmd_buf);
    var cmd_json = cmd[2];

    try {
        var body_set = JSON.parse(cmd_json);
        cmd[2] = body_set[0];
    } catch (e) {
        return null;
    }

    if(!cmd ||
        typeof(cmd[0])=="undefined" ||
        typeof(cmd[1])=="undefined" ||
        typeof(cmd[2])=="undefined"){
        return null;
    }

    return cmd;
}

/*
proto_type: json, buf
stype
ctype
body
return str_or_buf
*/
function encode_cmd(utag, proto_type, stype, ctype, body){
    var cmd_buf = null;
    if(proto_type == proto_man.PROTO_JSON){
        cmd_buf = _json_encode(stype, ctype, body);
    }else{
        var key = get_key(stype, ctype);
        if(!encoder[key]){
            log.warn("encoder's " + key + " is null");
            return null
        }

        // str_or_buf = encoder[key](body);
        cmd_buf = encoder[key](stype, ctype, body);
    }

    proto_tool.write_utag_inbuf(cmd_buf, utag);
    proto_tool.write_prototype_inbuf(cmd_buf, proto_type);

    // str_or_buf = encrypt_cmd(str_or_buf);

    return cmd_buf;
}

function decode_cmd_header(cmd_buf){
    var cmd = {};

    if(cmd_buf.length < proto_tool.header_size){
        return null;
    }

    cmd[0] = proto_tool.read_int16(cmd_buf, 0);
    cmd[1] = proto_tool.read_int16(cmd_buf, 2);
    cmd[2] = proto_tool.read_uint32(cmd_buf, 4);
    cmd[3] = proto_tool.read_int16(cmd_buf, 8);
    
    return cmd;
}

/*
proto_type: json, buf
str_or_buf
return cmd: {0: stype, 1: ctype, 2: body}
*/
function decode_cmd(proto_type, stype, ctype, cmd_buf){
    // str_or_buf = decrypt_cmd(str_or_buf);

    if(cmd_buf.length < proto_tool.header_size){
        return null;
    }

    var cmd = null;
    if(proto_type == proto_man.PROTO_JSON){
        cmd = _json_decode(cmd_buf);
    }else{
        // var stype = proto_tool.read_int16(cmd_buf, 0);
        // var ctype = proto_tool.read_int16(cmd_buf, 2);
        var key = get_key(stype, ctype);
        if(!decoder[key]){
            log.warn("decoder's " + key + " is null");
            return null;
        }

        cmd = decoder[key](cmd_buf);
    }
    
    return cmd;
}

var encoder = {};
var decoder = {};

function get_key(stype, ctype){
    var key = stype * 65536 + ctype;
    return key;
}

/*
encode_func(body)
*/
function reg_buf_encoder(stype, ctype, encode_func){
    var key = get_key(stype, ctype);
    if(encoder[key]){
        log.warn("encoder, stype: " + stype + ", ctype: " + ctype + " is reged");
        return null
    }

    encoder[key] = encode_func;
}

/*
decode_func(buf)
*/
function reg_buf_decoder(stype, ctype, decode_func){
    var key = get_key(stype, ctype);
    if(decoder[key]){
        log.warn("decoder, stype: " + stype + ", ctype: " + ctype + " is reged");
        return null
    }

    decoder[key] = decode_func;
}

module.exports = proto_man;