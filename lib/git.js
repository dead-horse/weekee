/*!
 * weekee - lib/weekee.js
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var child_process = require("child_process");
var fs = require('fs');
var path = require('path');
var EventProxy = require('eventproxy');
var utility = require('utility');

exports.commit = function (file, directory, message, callback) {
  if (typeof message === 'function') {
    callback = message;
    message = 'weekee auto commit';
  }
  var add = child_process.spawn('git', ['add', file], {cwd: directory});
  add.on('close', function (code) {
    if (code !== 0) {
      return callback(new Error('git add ' + file + ' error'));
    }
    child_process.exec('git commit -m "' + message + '"', {cwd: directory}, callback);
  });
  add.on('error', utility.noop);
};

exports.push = function (directory, callback) {
  child_process.exec('git push origin master', {cwd: directory}, callback);
};

exports.remove = function (file, directory, callback) {
  var rm = child_process.spawn('git', ['rm', '-f', file], {cwd: directory});
  rm.on('close', function (code) {
    if (code !== 0) {
      return callback(new Error('git remove ' + file + ' error'));
    }
    child_process.exec('git commit -m "weekee auto remove"', {cwd: directory}, callback);
  });
  rm.on('error', function (err) {});
};

/**
 * init git at directory use
 * @param {Object} git
 *   - {String} url            git remote url
 *   - {String} name           git user.name
 *   - {String} email          git user.email
 * @param {String} directory   directory path
 */
exports.init = function (git, directory, callback) {
  git = git || {};
  var url = git.url;
  var name = git.name || 'Weekee';
  var email = git.email || 'node-weekee@nodejs.org';
  if (fs.existsSync(path.join(directory, '.git'))) {
    process.nextTick(function () {
      callback && callback(null, 'already inited');
    });
  } else {
    var proxy = EventProxy.create();
    proxy.fail(function (err) {
      callback && callback(err);
    });
    proxy.once('init', function () {
      child_process.exec('git config user.name "' + name + '" && git config user.email "' + email + '"',
        {cwd: directory}, proxy.done('config'));
    });
    proxy.once('config', function () {
      child_process.exec('git pull origin master', {cwd: directory}, function (err, data) {
        callback && callback(null, err && err.message);
      });
    });
    if (fs.existsSync(directory)) {
      child_process.exec('git init && git remote add origin ' + url,
        {cwd: directory}, proxy.done('init'));
    } else {
      child_process.exec('git clone ' + url + ' ' + directory,
        {cwd: path.dirname(directory), maxBuffer: 2000 * 1024}, proxy.done('init'));
    }
  }
  exports.push(directory, utility.noop);
  setInterval(function () {
    exports.push(directory, utility.noop);
  }, 60 * 60 * 1000);
};
