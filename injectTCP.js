/*
 * /=======================================================\
 * | GuanacoCLInjector v0.0.2a                             |
 * | Copyright (c) P7COMunications LLC 2021 - PANCHO7532   |
 * |=======================================================/
 * |-> Purpose: Direct SSH Injection module
 * ---------------------------------------------------------
 */
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
const sshHost = configFile["host"];
const sshPort = configFile["port"];
const sshUser = configFile["username"];
const sshPass = configFile["password"];
const payload = configFile["payload"];
let firstResponse = false;
const server = net.createServer().listen(configFile["backendPort"], () => {
    console.log("[INFO] Backend server started!")
});
let externalConnection = net.createConnection({host: sshHost, port: sshPort});
externalConnection.on("connect", () => {
    console.log("[TCP] Connected to " + sshHost + ":" + sshPort);
    console.log("[TCP] Sending payload...");
    console.log("[TCP] " + payload.replace(/[\r]/g, "\\r").replace(/[\n]/g, "\\n"));
    sshModule.connectSSH(sshUser, sshPass, configFile["backendPort"]);
    externalConnection.write(payload); //note for later, should i change position of this?
});
externalConnection.on("error", (err) => {
    console.log("[EXTCONN] " + err);
});
server.on("connection", (socket) => {
    socket.on("data", function(data) {
        externalConnection.write(data);
    });
    socket.on("error", function(err) {
        console.log("[CLSOCK-ERR] " + err);
    });
    externalConnection.on("data", function(data) {
        if(!firstResponse && data.toString().indexOf("SSH-") == -1) { console.log("[TCP] " + data.toString().substring(0, data.toString().indexOf("\n"))); firstResponse = true;} else { firstResponse = true }
        socket.write(data);
    });
});
server.on("error", (err) => {
    console.log("[CLSV-ERR] " + err);
});