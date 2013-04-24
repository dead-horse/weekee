/*!
 * weekee - weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var sio = require('socket.io');
var ioHandler = require('./lib/io');
var nodeStatic = require('node-static');

/**
 * Init a weekee
 * @param {Object} options 
 *   - {HttpServer} server         a http server or use connect/express
 *   - {Number} port               if use the defualt server, the default server will listen this port, defualt is 8080
 *   - {Function} configSocketIO   a function that set socketIO's config
 *   - {String} directory          the root directory of wiki
 * @return {[type]} [description]
 */
module.exports = function weekee(options) {
  options = options || {};
  var server = options.server;
  var enableStatic;
  //http server
  if (server) {
    enableStatic = options.enableStatic || true;
  } else {
    //default http server. pathname = `/`
    server = require('./lib/server')(options.port || 8080);
    enableStatic = true;
  }

  //enable static file, pathname in `/weekee/assets/`
  enableStatic && require('./lib/static')(server);

  var io = sio.listen(server);

  var directory = options.directory || process.cwd();
  options.configSocketIO && options.configSocketIO(io);
  ioHandler.bind(io, directory);
};


