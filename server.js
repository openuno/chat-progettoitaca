#!/bin/env node
var http=require('http'),fs=require('fs'),url=require('url'),path=require("path");var WebSocketServer = require('websocket').server;
var mime={mp3:'audio/mpeg',wav:'audio/x-wav',html:'text/html',htm:'text/html',xml:'text/xml',txt:'text/plain',js:'text/javascript'};
var unode={};
function load($,undefined){$.config={html404:'index.html',portnum:80,rootfolder:process.cwd()};
    $.action={ping:{

    }};
    $.process=function(req,res){var ctx=new $.context(req,res);
        var act=url.parse(req.url).pathname;
        var fn=path.join($.config.rootfolder,act);
        fs.exists(fn,function(ee1){
            if(!ee1){fn=path.join($.config.rootfolder,$.config.html404);
                fs.exists(fn,function(ee2){if(!ee2){res.writeHeader(404,{"Content-Type":"text/plain"});res.write("404 Not Found\n");res.end();}else{ctx.streamfile(fn);}}); 
            }else{ctx.streamfile(fn);}});},
    $.context=function(req,res){this.req=req;this.res=res;};
    $.context.prototype={
        streamfile:function(fn){var ctx=this;
            fs.readFile(fn,"binary",function(err,file){    
                if(err){ctx.res.writeHeader(500,{"Content-Type": "text/plain"});ctx.res.write(err + "\n");ctx.res.end();}
                else{var hh={'Content-Length':fs.statSync(fn)["size"]};
                    var ext=path.extname(fn);if(mime[ext]){hh['Content-Type']=mime[ext];}
                    ctx.res.writeHeader(200,hh);ctx.res.write(file, "binary");ctx.res.end();}});},};
    if(process.argv[2]){$.config.rootfolder=process.argv[2];if(process.argv[3]){$.config.portnum=process.argv[3]}};
    return $;
};
unode=load(unode);

var HSERVER=http.createServer(unode.process);HSERVER.listen(unode.config.portnum);
console.log("Server Running on "+unode.config.portnum); 
console.log("folder: "+unode.config.rootfolder); 
wsServer = new WebSocketServer({
    httpServer: HSERVER,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});