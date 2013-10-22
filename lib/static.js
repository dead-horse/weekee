/*!
 * weekee - lib/server.js 
 * Copyright(c) 2014
 * Author: dead-horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var nodeStatic = require('node-static');

var assetsPath = path.join(__dirname, '..', 'assets');
var file = new (nodeStatic.Server)(assetsPath);


module.exports = function (server) {
  var oldListeners = server.listeners('request').splice(0);
  server.removeAllListeners('request');

  server.on('request', function (req, res) {
    if (req.url.indexOf('/weekee/') === 0) {
      req.url = req.url.slice(7);
      return req.on('end', function () {
        file.serve(req, res);
      }).resume();
    }
    for (var i = 0, l = oldListeners.length; i < l; i++) {
      oldListeners[i].call(server, req, res);
    }
  });
};