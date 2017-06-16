/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, util = require('util');

function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function isStr(x, no) { return (((typeof x) === 'string') || no); }


EX.censorLogin = (function () {
  var r = /\b(LOGIN "\S+" ")[!#-~]+/, w = '$1_%%censored%%_', c;
  c = function censorLogin(x) {
    if (ifFun(x)) { return function (y) { return x(c(y)); }; }
    if (isStr(x)) { return x.replace(r, w); }
    return x;
  };
  return c;
}());


EX.makeLoggerFactory = function (pfx) {
  return function makeLogger(topic) {
    topic = pfx + ' <' + topic + '>';
    function log(msg) {
      var details = Array.prototype.slice.call(arguments, 1);
      if (!isStr(msg)) { msg = EX.dump2str(msg); }
      console.log.apply(console, [topic, msg].concat(details));
    }
    return log;
  };
};


EX.imapEventNames = {
  conn: [
    'alert',
    'close',
    'end',
    'error',
    'expunge',
    'mail',
    'ready',
    'uidvalidity',
    'update',
  ],
  fetch: [ 'message', 'error', 'end' ],
  msg: [ 'attributes', 'body', 'end' ],
};


EX.onMulti = function (emitter, eventNames, makeLogger) {
  if (!eventNames.forEach) { eventNames = String(eventNames).split(/\s+/); }
  eventNames.forEach(function (evt) { emitter.on(evt, makeLogger(evt)); });
  return emitter;
};


EX.dump2str = function (x) {
  return util.inspect(x, { depth: null }).replace(/\s+(\n|$)/g, '$1');
};













/*scroll*/
