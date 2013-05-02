/*!
 * weekee - test/file.test.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');
var utils = require('../').utils;
var mm = require('mm');
var file = require('../').file;
var constant = require('./constant');

describe('test/lib/file.test.js', function () {
  describe('readFIle()', function () {
    afterEach(mm.restore);

    it('should readFile error by path', function (done) {
      file.readFile('../out.js', constant.directory, function (err) {
        err.message.should.equal('read file not allowed');
        done();
      });
    });
  });
});