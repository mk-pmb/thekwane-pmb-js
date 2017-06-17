/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {},
  async = require('async'),
  posInf = Number.POSITIVE_INFINITY;


EX.processOneMail = function (tkw, stats, mail, whenProcessed) {
  var cfg = tkw.cfg, imapMtd = tkw.imapMtd,
    log = tkw.makeLogger('mail#');
  log(mail || cfg || stats || imapMtd);
  async.waterfall([
  ], whenProcessed);
};






























module.exports = EX;
