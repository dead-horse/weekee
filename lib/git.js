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

exports.commit = function (file, directory, callback){
  child_process.exec('git add' + file, {cwd: directory}, function (err) {
    if (err) {
      return callback(err);
    }
    child_process.exec('git commit -m "weekee auto commit', {cwd: directory}, callback);
  });
};

exports.push = function (directory, callback) {
  child_process.exec('git push origin master', {cwd: directory}, callback);
};

exports.remove = function (file, directory, callback) {
  child_process.exec('git rm -r' + file, {cwd: directory}, function (err) {
    if (err) {
      return callback(err);
    }
    child_process.exec('git commit -m "weekee auto remove"', {cwd: directory}, callback);
  });
};