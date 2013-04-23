/*!
 * weekee - weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var sio = require('socket.io');
var defaultServer = require('./lib/server');
var ioHandler = require('./lib/io');

function weekee(options) {
  options = options || {};
  this.server = options.server || defaultServer(options.port || 7001);
  this.io = sio.listen(this.server);
  this.authorization = options.authorization;
  this.directory = options.directory || process.cwd();
  this.authorization && this.io.set('authorization', this.authorization);
  this.io.on('connection', function (socket) {
    ioHandler.create(socket, this.directory);
  }.bind(this));
}

weekee({
  directory: __dirname + '/wiki'
});