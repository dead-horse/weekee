var weekee = require('../');
var options = {
  directory: __dirname + '/wiki',
  git: {
    url: 'git@github.com:dead-horse/weekeewiki.git'
  },
  configSocketIO: function (io) {
    io.set('log level', 1);
  }
};

weekee.create(options);
