/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, async = require('async'),
  splitCb = require('splitcb'),
  storeAsync = require('objput').cb;

function ignoreResult() { return arguments[arguments.length - 1](); }


EX = function (tkw) {
  var imapMtd = tkw.imapMtd, mkLogr = tkw.makeLogger;
  function checkDump(opt, x) { if (tkw.cfg[opt]) { mkLogr(opt)(x); } }
  async.waterfall([
    imapMtd('once', 'ready'),
    imapMtd('getBoxes'),
    storeAsync(tkw, 'boxes'),
    imapMtd('openBox', 'INBOX'),
    storeAsync(tkw, 'currentBox'),
    tkw.scanMail, ignoreResult,
    function (then) {
      checkDump('dump:boxes', tkw.boxes);
      mkLogr('tkw')(tkw);
      setTimeout(imapMtd('end'), 2000);
      then();
    },
  ], splitCb());
  imapMtd('connect')();
  return tkw;
};






























module.exports = EX;
