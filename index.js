/*!
 * weekee - weekee.js 
 * Copyright(c) 2013
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var weekee =require('./lib/weekee');

/**
 * Init a weekee
 * @param {Object} options 
 *   - {HttpServer} server         a http server or use connect/express
 *   - {Number} port               if use the defualt server, the default server will listen this port, defualt is 8080
 *   - {Function} configSocketIO   a function that set socketIO's config
 *   - {String} directory          the root directory of wiki
 *   - {Boolean} enableStatic      enable static files from weekee, and user can use `/weekee/js/weekee.js` to got script in frontend
 * @param {Object} git
 *   - {String} url            git remote url
 *   - {String} name           git user.name
 *   - {String} email          git user.email
 */
exports.create = weekee.create;
exports.RedisStore = require('socket.io/lib/stores/redis');
exports.redis = require('socket.io/node_modules/redis');