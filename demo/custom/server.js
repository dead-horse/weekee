var weekee = require('../../');

var http = require('http');
var path = require('path');
var fs = require('fs');
var marked = require('marked');

var server = http.createServer(function (req, res) {
  if (req.url === '/') {
    return fs.readFile(path.join(__dirname, 'index.html'), 'utf-8', function (err, data) {
      if (err) {
        return res.end(err.message);
      }
      return res.end(data);
    });
  }
  res.statusCode = 404;
  res.end('can not get ' + req.url);
});

// Set default options
marked.setOptions({
  gfm: false
});

weekee.create({
  server: server,
  directory: __dirname + '/wiki',
  git: {
    url: 'git@github.com:dead-horse/weekeewiki.git'
  },
  enableStatic: true,
  markdown: marked
});

server.listen(8080);