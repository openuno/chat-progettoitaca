#!/bin/env node
var express = require('express');
var fs      = require('fs');
var WebSocketServer = require('websocket').server;
var http=require('http');
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
var cclients=[];
var cclientnum=0
var SampleApp = function() {
    var self = this;
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
			self.zcache = { 'user.html': '' };
			self.zcache = { 'operator.html': '' };
        }
        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
		self.zcache['user.html'] = fs.readFileSync('./user.html');
		self.zcache['operator.html'] = fs.readFileSync('./operator.html');
    };
    self.cache_get = function(key) { return self.zcache[key]; };
    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });
        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };
    self.createRoutes = function() {
        self.routes = { };
        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };
        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };
    self.initializeServer=function(){self.createRoutes();self.app=express.createServer();for(var r in self.routes){self.app.get(r,self.routes[r]);}};
    self.initialize=function(){self.setupVariables();self.populateCache();self.setupTerminationHandlers();self.initializeServer();};
    self.start = function() {
       var HSERVER=self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now() ), self.ipaddress, self.port);
        });
        wsServer=new WebSocketServer({httpServer:HSERVER,autoAcceptConnections:false});
        wsServer.on('request', function(request) {
            if(!originIsAllowed(request.origin)){request.reject();return;}
            var cidx=cclients.length;cclients[cidx]=request.accept(null, request.origin);cclientnum++;
            cclients[cidx].on('message',function(message){var cc;
                if(message.type==='utf8'){
                    if(message.utf8Data.indexOf('#!howmany')==0){cclients[cidx].sendUTF(cclientnum.toString())}
                    else{for(cc=0;cc<cclients.length;cc++){cclients[cc].sendUTF(message.utf8Data);}}
                }else if(message.type==='binary'){for(cc=0;cc<cclients.length;cc++){cclients[cc].sendBytes(message.binaryData);}}
            });
            cclients[cidx].on('close',function(rcode,desc){var cc;for(cc=0;cc<cclients.length;cc++){cclients[cc].sendUTF('one user left.');}cclientnum--;});
        });
    };
};
var zapp = new SampleApp();
zapp.initialize();
zapp.start();