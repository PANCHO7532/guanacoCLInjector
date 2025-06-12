/*
 * /=======================================================\
 * | GuanacoCLInjector v1.3.0                              |
 * | Copyright (c) P7COMunications LLC 2021 - PANCHO7532   |
 * |=======================================================/
 * |-> Purpose: Payload parsing and stuff
 * ---------------------------------------------------------
 */
"use strict";
const os = require("os");
function sleep(time) {
    // well then
    const stop = new Date().getTime() + time;
    while(new Date().getTime() < stop);       
}
function writePayload(externalConnection, payload, host, port, cType) {
    let newPayload = "";
    const splits = ["\\[split\\]", "\\[instant_split\\]", "\\[delay\\]", "\\[delay_split\\]"];
    const delayMS = 1000; //1 second
    newPayload = payload.replace(/\[crlf\]/g, "\r\n");
    newPayload = newPayload.replace(/\[cr\]/g, "\r");
    newPayload = newPayload.replace(/\[lf\]/g, "\n");
    newPayload = newPayload.replace(/\[raw\]/g, `CONNECT ${host}:${port} HTTP/1.0\r\n\r\n`);
    newPayload = newPayload.replace(/\[real_raw\]/g, `CONNECT ${host}:${port} HTTP/1.0\r\n\r\n`);
    newPayload = newPayload.replace(/\[netData\]/g, `CONNECT ${host}:${port} HTTP/1.0`);
    newPayload = newPayload.replace(/\[realData\]/g, `CONNECT ${host}:${port} HTTP/1.0`);
    newPayload = newPayload.replace(/\[method\]/g, `CONNECT`);
    newPayload = newPayload.replace(/\[host\]/g, `${host}`);
    newPayload = newPayload.replace(/\[port\]/g, `${port}`);
    newPayload = newPayload.replace(/\[host_port\]/g, `${host}:${port}`);
    newPayload = newPayload.replace(/\[protocol\]/g, `HTTP/1.0`);
    newPayload = newPayload.replace(/\[ua\]/g, `Mozilla/5.0 (${os.type()}_${os.arch}; ${os.release()}) guanacoCLInjector/1.2`);
    //splits
    newPayload = newPayload.split(new RegExp(`(?:${splits.join("|")})`, "g"));
    for(let c = 0; c < newPayload.length; c++) {
        console.log(`[${cType == 0 ? "TCP" : "TLS"}] Writing chunk (${c+1}/${newPayload.length})`);
        externalConnection.write(newPayload[c]);
        sleep(delayMS);
    }
    return;
}
module.exports = {
    writePayload
};
