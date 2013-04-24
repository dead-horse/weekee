/*!
 * weekee - lib/server.js 
 * Copyright(c) 2014
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var http = require('http');
var path = require('path');
var fs = require('fs');

var server = http.createServer(function (req, res) {
  if (req.url === '/') {
    return fs.readFile(path.join(__dirname, '..', 'view', 'index.html'), 'utf-8', function (err, data) {
      if (err) {
        return res.end(err.message);
      }
      return res.end(data);
    });
  }
  // res.statusCode = 404;
  // res.end('can not get ' + req.url);
});

module.exports = function (port, address) {
  server.listen(port, address);
  return server;
};
