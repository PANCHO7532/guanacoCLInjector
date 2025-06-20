/*
 * /=======================================================\
 * | GuanacoCLInjector v1.3.0                              |
 * | Copyright (c) P7COMunications LLC 2021 - PANCHO7532   |
 * |=======================================================/
 * |-> Purpose: SSH/TLS Injection module
 * ---------------------------------------------------------
 */
"use strict";
const tls = require("tls");
const payloadParser = require("./payloadParser");
const sshModule = require("./sshModule");
const net = require("net");
const fs = require("fs");
let configFile = {};
try {
    configFile = JSON.parse(fs.readFileSync("./config.json").toString());
} catch(err) {
    console.log("[ERROR] " + err);
    process.exit(1);
}
const sslHost = configFile["host"];
const sslPort = configFile["port"];
const sslSni = configFile["sni"];
const sshUser = configFile["username"];
const sshPass = configFile["password"];
const payload = configFile["payload"];
let firstResponse = false;
if(configFile["maxTLSVersion"] != "auto") {
    switch(parseInt(configFile["maxTLSVersion"])) {
        case 0:
            console.log("[TLS] Maximum TLS Version: TLSv1");
            tls.DEFAULT_MAX_VERSION = "TLSv1";
            break;
        case 1:
            console.log("[TLS] Maximum TLS Version: TLSv1.1");
            tls.DEFAULT_MAX_VERSION = "TLSv1.1";
            break;
        case 2:
            console.log("[TLS] Maximum TLS Version: TLSv1.2");
            tls.DEFAULT_MAX_VERSION = "TLSv1.2";
            break;
        case 3:
            console.log("[TLS] Maximum TLS Version: TLSv1.3");
            tls.DEFAULT_MAX_VERSION = "TLSv1.3";
            break;
    }
}
const server = net.createServer().listen(configFile["backendPort"], () => {
    console.log("[INFO] Backend server started on port " + configFile["backendPort"]);
});
const tlsSocket = tls.connect({
    host: sslHost,
    port: sslPort,
    allowHalfOpen: true,
    rejectUnauthorized: false,
    servername: sslSni,
    checkServerIdentity: () => {
        return null;
    }
}, () => { console.log("[TLS] Connected to " + sslHost + ":" + sslPort)});
tlsSocket.on("secureConnect", () => {
    console.log("[TLS] Using peer host: " + sslSni);
    console.log("[TLS] Protocol: " + tlsSocket.getProtocol());
    console.log("[TLS] Peer Certificate: " + JSON.stringify(tlsSocket.getPeerCertificate()["subject"]));
    console.log("[TLS] Using cipher: " + tlsSocket.getCipher()["standardName"] + " [" + tlsSocket.getCipher()["version"] + "]");
    //at this point we should have a fully working server so we uuh, proxy i guess?
    sshModule.connectSSH(sshUser, sshPass, configFile["backendPort"]);
    server.on("connection", (socket) => {
        console.log("[TLS] Sending payload...");
        console.log("[TLS] " + payload.replace(/[\r]/g, "\\r").replace(/[\n]/g, "\\n"));
        payloadParser.writePayload(tlsSocket, payload, sslHost, sslPort, 1);
        // tlsSocket.write(payload);
        socket.on("data", function(data) {
            tlsSocket.write(data);
        });
        socket.on("error", function(error) {
            console.log("[CLSOCK-ERR] " + error);
        });
        tlsSocket.on("data", function(data) {
            if(!firstResponse && data.toString().indexOf("SSH-") == -1) { console.log("[TLS] " + data.toString().substring(0, data.toString().indexOf("\n"))); firstResponse = true;}
            socket.write(data);
        });
        tlsSocket.on("error", function(error) {
            console.log("[TLS-ERR] " + error);
        });
    });
    server.on("error", (err) => {
        console.log("[CLSV-ERR] " + err);
    });
});
tlsSocket.on("error", function(error) {
    //it is necessary? It may duplicate the error message
    console.log("[TLS-ERR] " + error);
});
