function timestamp(){
    var date = new Date();
    var time = Date.parse(date);
    // var time = Date.now();

    return (time / 1000);
}

function timestamp2date(time){
    var date = new Date();
    date.setTime(time * 1000);
    // var date = new Date(time * 1000);
    
    return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
}

// date = string, "2019-03-28 00:00:00"
function date2timestamp(strtime){
    var date = new Date(strtime.replace(/-/g, '/'));
    var time = Date.parse(date);

    return (time / 1000);
}

function timestamp_today(){
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    // date.setHours(0, 0, 0);

    var time = Date.parse(date);
    return (time / 1000);
}

function timestamp_yesterday(){
    var time = timestamp_today();
    time = time - (24 * 60 * 60);
    return time;
}

console.log(timestamp());
console.log(timestamp2date(timestamp()));
console.log(date2timestamp("2019-03-28 00:00:00"));
console.log(timestamp_today());

console.log(date2timestamp("2019-03-27 00:00:00"));
console.log(timestamp_yesterday());