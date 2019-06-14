var http = require("http");
var util = require("util");

function send_phone_code(phone, content){
    var acc = "chengte99";
    var pwd = "461834555";

    var url = "http://api.twsms.com/json/sms_send.php?username=%s&password=%s&mobile=%s&message=%s";
    content = encodeURI(content);
    var cmd_url = util.format(url, acc, pwd, phone, content);

    http.get(cmd_url, function(incomingMsg){
        console.log("response status: " + incomingMsg.statusCode);
        incomingMsg.on("data", function(data){
            if(incomingMsg.statusCode == 200){
                console.log("send success, data = ", data);
            }else{
                console.log("send fail, data = ", data);
            }
        })
    })
}

send_phone_code("0929049751", "妳好，測試用，驗證碼為54321");