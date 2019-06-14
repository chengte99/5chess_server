var express = require("express");
var path = require("path");
var app = express();

if(process.argv.length < 3){
    console.log("start webserver need port");
    return;
}

var port = parseInt(process.argv[2])
// console.log(port);
process.chdir("./apps/webserver/")
// console.log(process.cwd());
app.use(express.static(path.join(process.cwd() + "/www_root")));

app.listen(port);
