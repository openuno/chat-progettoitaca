#!/bin/env node

var express = require('express');
var fs = require('fs');
var WebSocketServer = require('websocket').server;
var http = require('http');

function originIsAllowed(origin) {
    return true;
}
var cclients = [];
var cclientnum = 0;
var _uid = -1;

function uid() {
    _uid++;
    return 'uid' + _uid;
}
//STATUS:0=Unassigned
//STATUS:1=Enqueued
//STATUS:2=Chatting
chatclient = function (request) {
    this.conn = null;
    this.sid = uid();
    this.alias = 'Anon' + _uid;
    this.init(request);
    this.status = 0;
};
chatclient.prototype = {
    init: function (request) {
        this.conn = requst.accept(null, request.origin);

    },
    process: function (msg) {
        if (this.status == 0) {} else if (this.status == 1) {} else if (this.status == 2) {}
    },
}

var SampleApp = function () {
    var self = this;
    self.setupVariables = function () {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };
    self.populateCache = function () {
        if (typeof self.zcache === "undefined") {
            self.zcache = {
                'index.html': ''
            };
        }
        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };
    self.cache_get = function (key) {
        return self.zcache[key];
    };
    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };
    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });
        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };
    self.createRoutes = function () {
        self.routes = {};
        self.routes['/'] = function (req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html'));
        };
        self.routes['/shutdown'] = function (req, res) {
            process.exit();
        };
    };
    self.initializeServer = function () {
        self.createRoutes();
        self.app = express.createServer();
        self.app.use(express.static(__dirname));
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };
    self.initialize = function () {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();
        self.initializeServer();
    };
    self.start = function () {
        var HSERVER = self.app.listen(self.port, self.ipaddress, function () {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddress, self.port);
        });
        wsServer = new WebSocketServer({
            httpServer: HSERVER,
            autoAcceptConnections: false
        });
        wsServer.on('request', function (request) {
            if (!originIsAllowed(request.origin)) {
                request.reject();
                return;
            }
            var cidx = cclients.length;
            cclients[cidx] = request.accept(null, request.origin);
            cclients[cidx].Ostatus = 'initial';
            cclients[cidx].Otype = 'unknown';
            cclients[cidx].on('message', function (message) {
                var cc;
                var cn;
                if (message.type === 'utf8') {
                    var jdata;
                    console.log(message.utf8Data);
                    try {
                        jdata = JSON.parse(message.utf8Data)
                    } catch (ex) {

                    }
                    console.log(this.Ostatus);
                    if (true) {
                        for (cc = 0; cc < cclients.length; cc++) {
                            cn = cclients[cc];
                            if (cn.connected) cn.sendUTF(message.utf8Data+'ciao');
                        }
                    }
                } else if (message.type === 'binary') {
                    for (cc = 0; cc < cclients.length; cc++) {
                        cn = cclients[cc];
                        if (cn.connected) cn.sendBytes(message.binaryData+'is binary');
                    }
                }
            });
            cclients[cidx].on('close', function (rcode, desc) {
                var cc;
                cclientnum = 0;
                for (cc = 0; cc < cclients.length; cc++) {
                    cn = cclients[cc];
                    if (cn.connected) {
                        cn.sendUTF('one user left.');
                        cclientnum++;
                    }
                }
            });
        });
    };
};
//jdata={message:string,uid:string,uname,socialid}
var zapp = new SampleApp();
zapp.initialize();
zapp.start();