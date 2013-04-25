/*!
 * weekee - lib/weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var sio = require('socket.io');
var ioHandler = require('./io');
var gitActions = require('./git');

function Weekee(options) {
  options = options || {};
  this.server = options.server;
  this.git = options.git || {};  
  this.directory = options.directory;
  if (this.git) {
    gitActions.init(this.git, this.directory, function (err, message) {
      if (err) {
        console.error('[INIT GIT ERROR]' + err.message);
      }
      if (message) {
        console.warn('[INIT GIT WARN]' + message);
      }
    });    
  }
  //http server
  if (this.server) {
    this.enableStatic = options.enableStatic || true;
  } else {
    //default http server. pathname = `/`
    this.server = require('./server')(options.port || 8080);
    this.enableStatic = true;
  }
  //enable static file, pathname in `/weekee/assets/`
  this.enableStatic && require('./static')(this.server);
  this.io = sio.listen(this.server);
  options.configSocketIO && options.configSocketIO(this.io);
  ioHandler.bind(this.io, this.directory, this.git);  
}

Weekee.prototype.configSocketIO = function(fn) {
  fn.call(this, this.io);
};

exports.create = function (options) {
  return new Weekee(options);
}