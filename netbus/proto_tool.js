
function read_int8(cmd_buf, offset){
    return cmd_buf.readInt8(offset);
}

function write_int8(cmd_buf, value, offset){
    cmd_buf.writeInt8(value, offset);
}

function read_int16(cmd_buf, offset){
    return cmd_buf.readInt16LE(offset);
}

function write_int16(cmd_buf, value, offset){
    cmd_buf.writeInt16LE(value, offset);
}

function read_int32(cmd_buf, offset){
    return cmd_buf.readInt32LE(offset);
}

function write_int32(cmd_buf, value, offset){
    cmd_buf.writeInt32LE(value, offset);
}

function read_uint32(cmd_buf, offset){
    return cmd_buf.readUInt32LE(offset);
}

function write_uint32(cmd_buf, value, offset){
    cmd_buf.writeUInt32LE(value, offset);
}

function read_str(cmd_buf, offset, byte_len){
    return cmd_buf.toString("utf8", offset, offset + byte_len);
}

function write_str(cmd_buf, value, offset){
    cmd_buf.write(value, offset);
}

function read_float(cmd_buf, offset){
    return cmd_buf.readFloatLE(offset);
}

function write_float(cmd_buf, value, offset){
    cmd_buf.writeFloatLE(value, offset);
}

function alloc_buffer(total_len){
    return Buffer.allocUnsafe(total_len);
}

function write_head_inbuf(cmd_buf, stype, ctype){
    write_int16(cmd_buf, stype, 0);
    write_int16(cmd_buf, ctype, 2);

    write_uint32(cmd_buf, 0, 4);

    return proto_tool.header_size;
}

function write_prototype_inbuf(cmd_buf, proto_type){
    write_int16(cmd_buf, proto_type, 8);
}

function write_utag_inbuf(cmd_buf, utag){
    write_uint32(cmd_buf, utag, 4);
}

function clear_utag_inbuf(cmd_buf){
    write_uint32(cmd_buf, 0, 4);
}

function read_head_inbuf(cmd_buf){
    var cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);

    var ret = [cmd, proto_tool.header_size];
    return ret;
}

function write_str_inbuf(cmd_buf, offset, byte_len, str){
    write_int16(cmd_buf, byte_len, offset);
    offset += 2;
    write_str(cmd_buf, str, offset);
    offset += byte_len;
    return offset;
}

function read_str_inbuf(cmd_buf, offset){
    var byte_len = read_int16(cmd_buf, offset);
    offset += 2;
    var str = read_str(cmd_buf, offset, byte_len);
    offset += byte_len;

    return [str, offset];
}

function encode_empty_cmd(stype, ctype, body){
    var cmd_buf = alloc_buffer(proto_tool.header_size);
    write_head_inbuf(cmd_buf, stype, ctype);
    return cmd_buf;
}

function decode_empty_cmd(cmd_buf){
    var cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = null;
    return cmd;
}

function encode_status_cmd(stype, ctype, status){
    var cmd_buf = alloc_buffer(proto_tool.header_size + 2);
    var offset = write_head_inbuf(cmd_buf, stype, ctype);
    write_int16(cmd_buf, status, offset);
    return cmd_buf;
}

function decode_status_cmd(cmd_buf){
    var cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = read_int16(cmd_buf, proto_tool.header_size);
    return cmd;
}

function encode_int32_cmd(stype, ctype, value){
    var cmd_buf = alloc_buffer(proto_tool.header_size + 4);
    var offset = write_head_inbuf(cmd_buf, stype, ctype);
    write_int32(cmd_buf, value, offset);
    return cmd_buf;
}

function decode_int32_cmd(cmd_buf){
    var cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = read_int32(cmd_buf, proto_tool.header_size);
    return cmd;
}

function encode_str_cmd(stype, ctype, str){
    var byte_len = str.utf8_byte_len();
    var total_len = proto_tool.header_size + 2 + byte_len;
    var cmd_buf = alloc_buffer(total_len);
    var offset = write_head_inbuf(cmd_buf, stype, ctype);
    write_str_inbuf(cmd_buf, offset, byte_len, str);
    return cmd_buf;
}

function decode_str_cmd(cmd_buf){
    var cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    var offset = proto_tool.header_size;
    var ret = read_str_inbuf(cmd_buf, offset);
    cmd[2] = ret[0];
    return cmd;
}

var proto_tool = {
    header_size: 10, // 2(stype) + 2(ctype) + 4(utag) + 2(proto_man.BUF of JSON)
    //源操作
    read_int8: read_int8,
    write_int8: write_int8,

    read_int16: read_int16,
    write_int16: write_int16,

    read_int32: read_int32,
    write_int32: write_int32,

    read_uint32: read_uint32,
    write_uint32: write_uint32,

    read_float: read_float,
    write_float: write_float,

    alloc_buffer: alloc_buffer,

    //通用
    write_head_inbuf: write_head_inbuf,
    write_str_inbuf: write_str_inbuf,
    read_str_inbuf: read_str_inbuf,

    write_prototype_inbuf: write_prototype_inbuf,
    write_utag_inbuf: write_utag_inbuf,
    clear_utag_inbuf: clear_utag_inbuf,

    //編碼解碼
    encode_str_cmd: encode_str_cmd,
    encode_status_cmd: encode_status_cmd,
    encode_empty_cmd: encode_empty_cmd,

    decode_str_cmd: decode_str_cmd,
    decode_status_cmd: decode_status_cmd,
    decode_empty_cmd: decode_empty_cmd,

    encode_int32_cmd: encode_int32_cmd,
    decode_int32_cmd: decode_int32_cmd,
}

module.exports = proto_tool;
