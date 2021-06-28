This project uses Node.JS, install it from here: https://nodejs.org/en/download/

How to use:
0) Execute install-dep correspondent to your system for install dependencies (a few)
1) Fill and modify config.json with your SSH provider data
2) Run injectTCP for inject directly, run injectTLS for inject through TLS (sni field required in config.json)
3) Once connected, set up your machine proxy to use 127.0.0.1:1080 in mode SocksV5
4) Happy browsing :v

What are config.json options?
- host: The remote host where the script should connect
- port: The remote port where the script should bind
- username: The SSH username for authenticate in the remote SSH server
- password: The SSH password for authentication
- sni: Server Name Indication that will be used during the SSL handshake
- payload: Text/Query sequence that will be sent as soon as the socket establishes a connection
- backendPort: Port for the socket bridge, anyone, even you shouldn't attempt ever connect to this port manually by any means.
- socksPort: Port for the SocksV5 server, this is the port where you can communicate through the established tunnel
- maxTLSVersion: TLS Version for TLS Connection method, this goes on a range of 0 to 3, where 0 is TLSv1.0 and 3 is TLSv1.3, by default, the script will attempt to connect with the most up-to-date TLS Protocol (auto).

While making an issue think first that this is a beta project, it may change at anytime.
This project don't support placeholders in the payload yet ([crlf], [split], [host_port], etc)