/*!
 * weekee - lib/weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */

"use strict";

/**
 * Module dependencies.
 */
var path = require('path');

var MARKDOWNS = {
  '.md': true,
  '.mdown': true,
  '.markdown': true,
  '.mkd': true,
  '.mkdn': true,
  '.text': true
};


exports.checkFileName = function (fileName) {
  return true;
};

exports.isMarkdown = function (fileName) {
  var extName = path.extName(fileName);
  return !extName || MARKDOWNS[extName] ? true : false;
};

exports.getAbsPath = function (filename, directory) {
  var filePath = path.resolve(path.join(directory, filename));
  if (filePath.indexOf(path.resolve(directory)) !== 0) {
    return '';
  }
  return filePath;
};

exports.isSubDir = function (filePath, directory) {
  return path.resolve(filePath).indexOf(directory) >= 0;
};

exports.isSameDir = function (directory, rootDirectory) {
  return path.resolve(directory) === rootDirectory;
};
