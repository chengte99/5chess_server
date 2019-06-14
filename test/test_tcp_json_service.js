var net = require("net");
var netpkg = require("./netpkg");
var proto_man = require("../netbus/proto_man");

var sock = net.connect({
	port: 6080,
	host: "127.0.0.1",
}, function() {
	console.log('connected to server!');
});

sock.on("connect",function() {
    console.log("connect success");
    
    var cmd = proto_man.encode_cmd(proto_man.PROTO_JSON, 1, 2, "Hello talk room !");
    cmd = netpkg.package_data(cmd);
    sock.write(cmd);
});



sock.on("error", function(e) {
	console.log("error", e);
});


sock.on("close", function() {
	console.log("close");
});


sock.on("end", function() {
	console.log("end event");
});

sock.on("data", function(data) {
	console.log(data);
});