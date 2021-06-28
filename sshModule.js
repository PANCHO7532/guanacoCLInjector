/*
* /=======================================================\
* | GuanacoCLInjector v0.0.2a                             |
* | Copyright (c) P7COMunications LLC 2021 - PANCHO7532   |
* |=======================================================/
* |-> Purpose: Main SSH Module
* ---------------------------------------------------------
*/
const {inspect} = require("util");
const sv5 = require("socksv5");
const ssh2 = require("ssh2");
const crypto = require("crypto");
const net = require("net");
const fs = require("fs");
let sshReady = false;
let configFile = {};
try {
    configFile = JSON.parse(fs.readFileSync("./config.json").toString());
} catch(err) {
    console.log("[ERROR] " + err);
    process.exit(1);
}
const sshConnection = new ssh2.Client();
sshConnection.on("banner", (message) => {
    console.log("[SSH] Server Message:\r\n" + message);
});
sshConnection.on("handshake", (handshake) => {
    //handshake event
    //console.log(handshake.hostVerifier());
    console.log("[SSH] Key exchange algorithm: " + handshake["kex"]);
    console.log("[SSH] Using client algorithm: " + handshake["cs"]["cipher"] + " " + handshake["cs"]["mac"]);
});
sshConnection.on("error", (error) => {
    //some error
    console.log("[SSH-ERR] " + error);
    sshReady = false;
});
sshConnection.on("end", () => {
    //connection was terminated by an foreign force
    console.log("[SSH-END] Remote host ended communication.");
    sshReady = false;
    //sshConnection.connect(sshcfg);
});
sshConnection.on("close", () => {
    //connection was terminated by the server
    console.log("[SSH-CLOSE] Connection terminated");
    sshReady = false;
})
sshConnection.on("ready", () => {
    console.log("[SSH] Connection established!");
    sshReady = true;
})
const server = sv5.createServer((connectionInfo, accept, deny) => {
    if(!sshReady) {
        return deny();
    }
    try {
        sshConnection.forwardOut(connectionInfo.srcAddr, connectionInfo.srcPort, connectionInfo.dstAddr, connectionInfo.dstPort, function(err, incomingStream) {
            if(err) {
                console.log("[SSH-FWDERR] " + err);
                if(err.toString().indexOf("No response") != -1) {
                    sshReady = false;
                }
                return deny();
            }
            console.log("[DEBUG] Forwarding " + connectionInfo.srcAddr + ":" + connectionInfo.srcPort + " to " + connectionInfo.dstAddr + ":" + connectionInfo.dstPort);
            const clientStream = accept(true);
            //clientStream.pipe(incomingStream).pipe(clientStream); //pipe sucks, lemme tell ya.
            if(clientStream) {
                try {
                    clientStream.pipe(incomingStream);
                    incomingStream.pipe(clientStream);
                } catch(err) {
                    console.log("[SSH-PIPEERR] " + err);
                } 
                clientStream.on("error", function(err) { console.log("[CSTREAM] " + err) });
                incomingStream.on("error", function(err) { console.log("[ISTREAM] " + err)});
            }
        });
    } catch(error) {
        console.log("[SSH-TRYERR] " + error);
        sshReady = false;
        return deny();
    }
    
});
server.listen(configFile["socksPort"], () => {
    console.log("[INFO] Socks server started!");
});
server.useAuth(sv5.auth.None());
module.exports.connectSSH = (user = "username", pass = "password", backendPort = 20000) => {
    //config model
    const configModel = {
        host: "127.0.0.1",
        port: backendPort,
        username: user,
        password: pass,
        keepaliveInterval: 2500,
        keepaliveCountMax: 10000,
        hostVerifier: (hashedkey) => {
            //raw key in buffer that we convert to an md5 fingerprint
            //console.log(this.remoteIdentRaw);
            let fingerprint = crypto.createHash("md5").update(hashedkey).digest("hex").split(/(.{2})/g).filter(Boolean).join(":"); //lol
            console.log("[SSH] Server FingerPrint: " + fingerprint);
            return true;
        },
        debug: (messages) => {
            if(messages.indexOf("Remote ident:") != -1) {
                //ladies and gentelemans, we got 'em
                let sshVer = "";
                sshVer += messages.replace("Remote ident: ", "").replace(/[']/g, "");
                console.log("[SSH] " + sshVer);
            }
        }
    };
    sshConnection.connect(configModel);
}
module.exports.sshReady = sshReady;