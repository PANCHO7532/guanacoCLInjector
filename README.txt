How to use:
0) Execute install-dep correspondent to your system for install dependencies (a few)
1) Fill and modify config.json with your SSH provider data
2) Run injectTCP for inject directly, run injectTLS for inject through TLS (sni field required in config.json)
3) Once connected, set up your machine proxy to use 127.0.0.1:7788 in mode SocksV5
4) Happy browsing :v

While making an issue think first that this is a beta project, it may change at anytime.
This project don't support placeholders in the payload yet ([crlf], [split], [host_port], etc)