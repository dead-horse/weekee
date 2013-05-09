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

var rootName = path.dirname(__dirname);

describe('test/utils.test.js', function () {
  describe('isMarkdown()', function () {
    it('should get true', function () {
      utils.isMarkdown('test.md').should.be.ok;
      utils.isMarkdown('test.mdown').should.be.ok;
      utils.isMarkdown('test.markdown').should.be.ok;
      utils.isMarkdown('test.mkdn').should.be.ok;
      utils.isMarkdown('test.text').should.be.ok;
    });

    it('should get false', function () {
      utils.isMarkdown('test.js').should.not.be.ok;
      utils.isMarkdown('test').should.not.be.ok;
      utils.isMarkdown('test.').should.not.be.ok;
    });
  });

  describe('getAbsPath()', function () {
    it('should get absPath ok', function () {
      utils.getAbsPath('test', '/dir').should.equal('/dir/test');
      utils.getAbsPath('test/../a.js', '/dir').should.equal('/dir/a.js');
      utils.getAbsPath('../dir/b.js', '/dir').should.equal('/dir/b.js');
    });

    it('should return empty', function () {
      utils.getAbsPath('test/../../a', '/dir').should.be.empty;
      utils.getAbsPath('../a', '/dir').should.be.empty;
    });
  });

  describe('isSubDir()', function () {
    it('should return ok', function () {
      utils.isSubDir('test', rootName).should.be.ok;
      utils.isSubDir('test/a.js', rootName).should.be.ok;
    });

    it('should return false', function () {
      utils.isSubDir('test', rootName + '/test/a').should.not.be.ok;
      utils.isSubDir('../test', rootName).should.not.be.ok;
    });
  });

  describe('isSameDir()', function () {
    it('should return ok', function () {
      utils.isSameDir('.', rootName).should.be.ok;
      utils.isSameDir(rootName, rootName).should.be.ok;
      utils.isSameDir('test/../', rootName).should.be.ok;
    });

    it('should return false', function () {
      utils.isSameDir('..', rootName).should.not.be.ok;
      utils.isSameDir('../test', rootName).should.not.be.ok;
      utils.isSameDir('test', rootName).should.not.be.ok;
      utils.isSameDir('../test/a', rootName).should.not.be.ok;
    });
  });
});