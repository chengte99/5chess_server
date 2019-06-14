var http = require("http");
var util = require("util");
var log = require("../utils/log");

function send_phone_content(phone, content){
    var acc = "chengte99";
    var pwd = "461834555";

    content = encodeURI(content);
    var url = "http://api.twsms.com/json/sms_send.php?username=%s&password=%s&mobile=%s&message=%s";
    var cmd_url = util.format(url, acc, pwd, phone, content);

    // http.get(cmd_url, function(incomingMsg){
    //     log.info("response status: " + incomingMsg.statusCode);
    //     incomingMsg.on("data", function(data){
    //         if(incomingMsg.statusCode == 200){
    //             log.info("send success, data = ", data);
    //         }else{
    //             log.info("send fail, data = ", data);
    //         }
    //     })
    // })
}

function send_identify_code(phone, code){
    var content = "您好，歡迎註冊我的開發站，註冊驗證碼: %s";
    content = util.format(content, code);
    send_phone_content(phone, content);
}

module.exports = {
    send_identify_code: send_identify_code,
}