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
var should = require('should');

describe('test/lib/file.test.js', function () {
  describe('readFIle()', function () {
    afterEach(mm.restore);

    it('should error by path', function (done) {
      file.readFile('../out.js', constant.directory, function (err) {
        err.message.should.equal('read file not allowed');
        done();
      });
    });

    it('should error by fs', function (done) {
      mm.error(fs, 'readFile', 'mock error');
      file.readFile('in.js', constant.directory, function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });

    it('should ok', function (done) {
      file.readFile('in.js', constant.directory, function (err, data) {
        should.not.exist(err);
        data.should.equal('var in = 2;');
        done();
      });
    });
  });

  describe('saveFile()', function () {
    afterEach(mm.restore);

    it('should error by path', function (done) {
      file.saveFile('../out.js', constant.directory, 'haha', function (err) {
        err.message.should.equal('save file not allowed');
        done();
      });      
    });

    it('should error by write', function (done) {
      mm.error(fs, 'writeFile', 'mock error');
      file.saveFile('in.js', constant.directory, 'hehe', function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });

    it('should ok', function (done) {
      mm.empty(fs, 'writeFile');
      file.saveFile('in.js', constant.directory, 'gaga', function (err, data) {
        should.not.exist(err);
        done();
      });      
    });
  });

  describe('readFolder()', function () {
    afterEach(mm.restore);

    it('should error by path', function (done) {
      file.readFolder('../other_wiki', constant.directory, function (err) {
        err.message.should.equal('read folder not allowed');
        done();
      });
    });

    it('should error by readdir', function (done) {
      mm.error(fs, 'readdir', 'mock error');
      file.readFolder('infolder', constant.directory, function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });

    it('should ok', function (done) {
      file.readFolder('infolder', constant.directory, function (err, data) {
        should.not.exist(err);
        data.should.eql([ { name: 'inner.js' } ]);
        done();
      });
    });

    it('should read folder ok', function (done) {
      file.readFolder(path.join(constant.directory, 'infolder'), function (err, data) {
        should.not.exist(err);
        data.should.eql([ { name: 'inner.js' } ]);
        done();
      });
    });
  });

  describe('createFolder()', function () {
    afterEach(mm.restore);

    it('should create name error', function (done) {
      file.createFolder('infolder', constant.directory, function (err) {
        err.code.should.equal('EEXIST');
        done();
      });
    });

    it('should create error by fs', function (done) {
      mm.error(fs, 'mkdir', 'mock error');
      file.createFolder('infolder1', constant.directory, function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });

    it('should ok', function (done) {
      mm.empty(fs, 'mkdir');
      file.createFolder('infolder1', constant.directory, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('remove()', function () {
    afterEach(mm.restore);

    it('shoul error of path', function (done) {
      file.remove('../out.js', constant.directory, 'file', function (err) {
        err.message.should.equal('remove file not allowed');
        done();
      });
    });

    it('should ok', function (done) {
      mm.empty(fs, 'unlink');
      file.remove('in.js', constant.directory, 'file', function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});