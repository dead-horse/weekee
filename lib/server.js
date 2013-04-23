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
var connect = require('connect');
var fs = require('fs');

var assetsPath = path.join(__dirname, '..', 'assets');

var app = connect();
app.use('/assets', connect.static(assetsPath));
app.use('/', function (req, res, next) {
  fs.readFile(path.join(assetsPath, 'index.html'), 'utf-8', function (err, data) {
    if (err) {
      return next(err);
    }
    res.end(data);
  });
});

var server = http.createServer(app);

module.exports = function (port, address) {
  server.listen(port, address);
  return server;
};
