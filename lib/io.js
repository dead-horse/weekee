/*!
 * weekee - lib/io.js 
 * Copyright(c) 2013 
 * Author: dead-horse <dead_horse@qq.com>
 */

"use strict";

/**
 * Module dependencies.
 */
var File = require('./file');
var gitActions = require('./git');
var marked = require('marked');
var path = require('path');
var utils = require('./utils');
var fs = require('fs');

marked.setOptions({
  gfm: true,
  pedantic: true,
  sanitize: false,
  tables: true
});

/**
 * Hander for socket.io connections
 * @param {Socket} socket     socket.io's socket
 * @param {String} directory  wiki root directory
 */
function Handler(socket, directory, git) {
  this.rootDirectory = path.resolve(directory);
  this.git = git;
  this.socket = socket;
  this.bind();
}

/**
 * listen all the event that emit by front end
 */
Handler.prototype.bind = function () {
  var socket = this.socket;
  socket.on('readFolderAndFile', this.readFolderAndFile.bind(this));
  socket.on('readFile', this.readFile.bind(this));
  socket.on('readFolder', this.readFolder.bind(this));
  socket.on('goBack', this.goBack.bind(this));
  socket.on('saveFile', this.saveFile.bind(this));
  socket.on('createFile', this.createFile.bind(this));
  socket.on('createFolder', this.createFolder.bind(this));
  socket.on('removeFile', this.removeFile.bind(this));
  socket.on('removeFolder', this.removeFolder.bind(this));
};

Handler.prototype.readFolderAndFile = function (fileName) {
  var folderName = path.dirname(fileName);
  this.readFolder({
    directory: path.dirname(folderName),
    folderName: path.basename(folderName)
  });
  this.readFile({
    directory: path.dirname(fileName),
    fileName: path.basename(fileName)
  });
};

/**
 * read file, and use marked to parse it. emit 'readFileReplay'
 * @param {String} fileName     fileName in this.currentDirectory
 */
Handler.prototype.readFile = function (input) {
  input = input || {};
  var fileName = input.fileName || '';
  var directory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;
  var socket = this.socket;
  // check permission
  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return socket.emit('error', 'no permission to operate this directory');
  }
  File.readFile(fileName, directory, function (err, data) {
    if (err) {
      return socket.emit('error', err.message);
    }
    socket.emit('readFileReply', {
      originContent: data,
      htmlContent: utils.isMarkdown(fileName) ? marked(data || '') : marked('```\n' + data + '\n```'),
      fileName: fileName
    });
  });
};

/**
 * read folder. emit 'readfolderReplay'
 * @param {String} folderName     folderName in this.currentDirectory
 */
Handler.prototype.readFolder = function (input) {
  input = input || {};
  var folderName = input.folderName || '';
  var directory = input.directory || '';
  var absDirectory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;
  var absFolderPath = path.join(absDirectory, folderName);
  if (!utils.isSubDir(absFolderPath, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }
  var self = this;
  File.readFolder(folderName, absDirectory, function (err, files) {
    if (err) {
      return self.socket.emit('error', err.message);
    }
    var isRoot = utils.isSameDir(absFolderPath, self.rootDirectory);
    directory = folderName ? path.join(directory, folderName) : directory;
    self.socket.emit('readFolderReply', {
      isRoot: isRoot,
      directory: directory,
      files: files,
      folderName: directory && directory !== '.' ? path.basename(directory) : ''
    });
  });
};

/**
 * go back (cd ..). Ant it will emit 'readFolderReply'
 */
Handler.prototype.goBack = function(directory) {
  if (!directory) {
    return this.socket.emit('error', 'no permission to go back');
  }

  var absDirectory = path.join(this.rootDirectory,  directory);
  
  var currentDirectory = path.dirname(absDirectory);
  if (!utils.isSubDir(currentDirectory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }
  var self = this;
  File.readFolder(currentDirectory, function (err, files) {
    if (err) {
      if (err.code === 'ENOENT') {
        return self.goBack(path.dirname(directory));
      }
      return self.socket.emit('error', err.message);
    }
    var isRoot = utils.isSameDir(currentDirectory, self.rootDirectory);
    directory = path.dirname(directory);
    self.socket.emit('readFolderReply', {
      isRoot: isRoot,
      directory: directory,
      files: files,
      folderName: isRoot ? 'ROOT_DIR' : path.basename(directory)
    });
  });  
};

/**
 * Save input.content into input.fileName. And `fileName` must be exists.
 * @param {Object} input 
 *   - {String} fileName
 *   - {String} content
 */
Handler.prototype.saveFile = function(input) {
  input = input || {};
  var fileName = input.fileName || '';
  var content = input.content || '';
  var directory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;

  if (!fileName) {
    return this.socket.emit('error', 'must have file name!');
  }

  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }

  var self = this;
  File.saveFile(fileName, directory, content, function (err) {
    if (err) {
      return self.socket.emit('error', err.message);
    }

    self.git && gitActions.commit(fileName, directory, function (err, data) {
      console.log(err, data);
    });

    return self.socket.emit('saveFileReply', {
      originContent: content,
      htmlContent: utils.isMarkdown(fileName) ? marked(content || '') : marked('```\n' + (content || '') + '\n```'),
      fileName: fileName      
    });
  });
};

/**
 * create input.fileName use input.content. And `fileName` must be not exists.
 * @param {Object} input 
 *   - {String} fileName
 *   - {String} content
 */
Handler.prototype.createFile = function (input) {
  input = input || {};
  var fileName = input.fileName.trim() || '';
  var content = input.content || '';
  var directory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;
  if (!fileName) {
    return this.socket.emit('error', 'must have file name!');
  }

  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }  

  var self = this;
  File.createFile(fileName, directory, content, function (err) {
    if (err) {
      return self.socket.emit('error', err.message);
    }
    
    self.git && gitActions.commit(fileName, directory, function (err, data) {
      console.log(err, data);
    });

    return self.socket.emit('createFileReply', {
      originContent: content,
      htmlContent: marked(content || ''),
      fileName: fileName      
    });
  });  
};

Handler.prototype.createFolder = function(input) {
  input = input || {};
  var folderName = input.folderName;
  var directory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;
  if (!folderName) {
    return this.socket.emit('error', 'must have folder name!');
  }

  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }  

  var self = this;
  File.createFolder(folderName, directory, function (err) {
    if (err) {
      return self.socket.emit('error', err.message);
    }
    self.socket.emit('createFolderReply');
  });
};

Handler.prototype.removeFile = function(input) {
  input = input || {};
  var fileName = input.fileName;
  var directory = input.directory ? 
    path.join(this.rootDirectory,  input.directory) : this.rootDirectory;
  if (!fileName) {
    return this.socket.emit('error', 'removeFile must have file name');
  }
  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }  

  var self = this;
  if (self.git) {
    var absPath = utils.getAbsPath(fileName, directory);
    if (!absPath) {
      return self.socket.emit('error', 'remove file not allowed');
    }

    gitActions.remove(absPath, self.rootDirectory, function (err, data) {
      if (err) {
        return self.socket.emit('error', err.message);
      }
      fs.exists(directory, function (exist) {
        exist ? self.socket.emit('removeFileReply') : self.goBack(path.dirname(directory));
      });
    });    
  } else {
    File.remove(fileName, directory, 'file', function (err) {
      if (err) {
        return self.socket.emit('error', err.message);
      }
      self.socket.emit('removeFileReply');
    });    
  }

};

Handler.prototype.removeFolder = function(directory) {
  if (!directory) {
    return this.socket.emit('error', 'remove need directory');
  }
  directory = path.join(this.rootDirectory, directory);
  if (!utils.isSubDir(directory, this.rootDirectory)) {
    return this.socket.emit('error', 'no permission to operate this directory');
  }  

  var self = this;
  File.remove(path.basename(directory), path.dirname(directory), 'folder', function (err) {
    if (err) {
      return self.socket.emit('error', err.message);
    }
    self.socket.emit('removeFolderReply');
  });
};

exports.bind = function (io, directory, git) {
  io.on('connection', function (socket) {
    new Handler(socket, directory, git);
  });
};
