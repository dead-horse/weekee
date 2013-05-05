/*!
 * weekee - test/git.test.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var utils = require('../').utils;
var mm = require('mm');
var git = require('../').git;
var constant = require('./constant');
var should = require('should');
var child_process = require('child_process');
var fs = require('fs');

describe('test/git.test.js', function () {
  describe('commit()', function () {
    afterEach(mm.restore);
    it('should response error by spawn', function (done) {
      git.commit('test.js', 'wiki', function (err) {
        err.message.should.equal('git add test.js error');
        done();
      });
    });

    it('should commit ok', function (done) {
      mm.spawn(0);
      mm.empty(child_process, 'exec');
      git.commit('test.js', 'wiki', done);
    });
  });

  describe('push()', function () {
    afterEach(mm.restore);
    it('should push ok', function (done) {
      mm.empty(child_process,'exec');
      git.push('wiki', function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('remove', function () {
    afterEach(mm.restore);
    it('should remove error', function (done) {
      git.remove('test.js', 'wiki', function (err) {
        err.message.should.equal('git remove test.js error');
        done();
      });
    });

    it('should remove ok', function (done) {
      mm.empty(child_process, 'exec');
      mm.spawn(0);
      git.remove('test.js', 'wiki', done);
    });
  });

  describe('init()', function () {
    afterEach(mm.restore);

    it('should already init', function (done) {
      mm(fs, 'existsSync', function () {
        return true;
      });
      git.init({}, 'wiki', function (err, msg) {
        msg.should.equal('already inited');
        done();
      });
    });

    it('should error', function (done) {
      mm.error(child_process, 'exec', 'mock error');
      git.init({}, 'wiki__', function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });

    it('should init ok', function (done) {
      mm.empty(child_process, 'exec');
      git.init({
        name: 'dead-horse',
        email: 'dead_horse@qq.com',
        url: 'git@github.com:dead-horse/weekee.git'
      }, 'wiki', done);
    });
  });
});