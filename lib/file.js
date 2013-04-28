/*!
 * weekee - lib/weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var git = require('./git');
var EventProxy = require('eventproxy');
var ndir = require('ndir');

exports.readFile = function (file, directory, callback) {
  var filePath = utils.getAbsPath(file, directory);
  if (!filePath) {
    return process.nextTick(function () {
      callback(new Error('read file not allowed'));
    });
  }
  fs.readFile(filePath, 'utf-8', function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
};

exports.saveFile = function (file, directory, content, callback) {
  var filePath = utils.getAbsPath(file, directory);
  if (!filePath || typeof content !== 'string') {
    return process.nextTick(function () {
      callback(new Error('save file not allowed'));
    });
  }
  fs.writeFile(filePath, content, function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
};

exports.createFile = function (file, directory, content, callback) {
  var filePath = utils.getAbsPath(file, directory);
  if (!filePath || typeof content !== 'string') {
    return process.nextTick(function () {
      callback(new Error('save file not allowed'));
    });
  }
  fs.exists(filePath, function (exist) {
    if (exist) {
      return callback(new Error('file exist'));
    }
    fs.writeFile(filePath, content, function (err, data) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });    
  });
};

exports.readFolder = function (folderName, directory, callback) {
  var folderPath;
  if (typeof directory === 'function') {
    folderPath = folderName;
    callback = directory;
  } else {
    folderPath = utils.getAbsPath(folderName, directory);
  }
  if (!folderPath) {
    return process.nextTick(function () {
      callback(new Error('read file not allowed'));
    });
  }
  var ep = EventProxy.create();
  ep.fail(callback);
  var files = [];
  function handleFile() {
    files.sort(function (a, b) {
      //sort by alphebetical and dir first
      if ((a.isDir && b.isDir) || (!a.isDir && !b.isDir)) {
        return [a.name, b.name].sort()[0] === a.name ? -1 : 1;
      } else {
        return b.isDir ? 1 : -1;
      }
    });
    callback(null, files);
  }
  ep.once('readdir', function (fileNames) {
    ep.after('getFile', fileNames.length, handleFile);
    fileNames.forEach(function (fileName) {
      if (fileName === '.git') {
        return ep.emit('getFile');
      }
      fs.stat(path.join(folderPath, fileName), function (err, stat) {
        if (err) {
          return ep.emit('getFile');
        }
        if (stat.isDirectory()) {
          files.push({
            name: fileName,
            isDir: true
          });
          return ep.emit('getFile');
        }
        if (stat.isFile()) {
          fileName[0] !== '.' && files.push({name: fileName});
          return ep.emit('getFile');
        }
        ep.emit('getFile');
      });  
    });    
  });
  fs.readdir(folderPath, ep.done('readdir'));
};

exports.createFolder = function (folderName, directory, callback) {
  var folderPath = utils.getAbsPath(folderName, directory);
  if (!folderPath) {
    return process.nextTick(function () {
      callback(new Error('create folder not allowed'));
    });
  }
  fs.mkdir(folderPath, function (err) {
    callback(err);
  });
};

exports.remove = function (fileName, directory, type, callback) {
  var filePath = utils.getAbsPath(fileName, directory);
  if (!filePath) {
    return process.nextTick(function () {
      callback(new Error('remove file not allowed'));
    });
  }
  var _action = type === 'file' ? fs.unlink : fs.rmdir;
  _action(filePath, function (err) {
    callback(err);
  });
};