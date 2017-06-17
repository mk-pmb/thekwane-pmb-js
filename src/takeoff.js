/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, async = require('async'),
  splitCb = require('splitcb'),
  objPut = require('objput'),
  asyU = require('async-util-pmb');


EX = function (tkw) {
  var imapMtd = tkw.imapMtd, mkLogr = tkw.makeLogger;
  function checkDump(opt, x) { if (tkw.cfg[opt]) { mkLogr(opt)(x); } }
  async.waterfall([
    imapMtd('once', 'ready'),
    imapMtd('getBoxes'),
    objPut.cb(tkw, 'boxes'),
    imapMtd('openBox', 'INBOX'),
    objPut.cb(tkw, 'currentBox'),
    tkw.scanMail, asyU.wfDropArgs,
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
