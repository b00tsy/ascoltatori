'use strict'

var SubsCounter = require('./subs_counter')
var util = require('./util')

/**
 * You can require any Ascolatore through this module.
 *
 * @api public
 */
module.exports.RedisAscoltatore = require('./redis_ascoltatore')
/**
 *
 * @api private
 */
var classes = {
  'redis': module.exports.RedisAscoltatore
}

/**
 * Builds an ascolatore based on the proper type.
 * It will encapsulate it in a PrefixAscolatore if a prefix key is
 * present.
 * The other options are passed through the constructor of the
 * Ascoltatore
 * 
 * Options:
 *  - `type`, it can be "amqp", "trie", "eventemitter2", "redis", "zmq", or just a class
 *    that will be instantiated (i.e. with `new`).
 *  - `prefix`, will be passed to the PrefixAscoltatore.
 *  - `json`, it can be setted to false if you do not want your messages
 *    to be wrapped inside JSON.
 *  - any other option that the ascolatore constructor may need.
 *
 *  @api public
 *  @param {Object} opts The options
 *  @param {Function} done The callback that will be called when the
 *  ascoltatore will be ready
 */
module.exports.build = function build (opts, done) {
  opts = opts || {}

  if (typeof opts === 'function') {
    done = opts
    opts = {}
  }

  var Klass = null,
    result = null

  Klass = (typeof opts.type === 'function') ? opts.type :
    (classes[opts.type] || module.exports.TrieAscoltatore)

  result = new Klass(opts, module.exports)

  if (opts.prefix) {
    result = new module.exports.PrefixAscoltatore(opts.prefix, result)
      .once('error', done)
  }

  if (opts.json !== false) {
    result = new module.exports.JSONAscoltatore(result)
      .once('error', done)
  }

  if (done) {
    setImmediate(function () {
      result.once('ready', function () {
        result.removeListener('error', done)
        done(null, result)
      })
    })
  }

  return result
}

/**
 * These are just utilities
 *
 * @api private
 */
module.exports.SubsCounter = SubsCounter
module.exports.util = util

/**
 * You can require a shared mocha test to you if you want to develop
 * a custom Ascoltatore inside your app.
 *
 * @api public
 */
module.exports.behaveLikeAnAscoltatore = require('./behave_like_an_ascoltatore')
