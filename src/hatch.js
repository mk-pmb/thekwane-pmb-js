/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function isStr(x, no) { return (((typeof x) === 'string') || no); }
function copyUpdObj(pt, upd) { return Object.assign(Object.create(pt), upd); }


function Thekwane() { return; }

var EX, PT = new Thekwane(),
  defaultConfig = require('./default-config'),
  ImapConnection = require('imap'),
  logUtil = require('./log-util'),
  makeMailScanner = require('./scanmail'),
  takeoff = require('./takeoff'),
  objUtil = require('./obj-util'),
  methodByName = require('method-by-name');


EX = function hatchAThekwane(cfg) {
  cfg = EX.convertConfig(cfg);
  var imapConn, mkLogr = logUtil.makeLoggerFactory(cfg.profileName),
    dbg = (cfg.debug === true),   // could also be false-y or a function
    tkw = copyUpdObj(PT, {
      cfg: cfg,
      makeLogger: mkLogr,
      imapImpl: function () { return imapConn; },
    });

  if (dbg) { cfg.debug = logUtil.censorLogin(mkLogr('.debug')); }
  imapConn = new ImapConnection(cfg);
  delete cfg.pass;
  delete cfg.password;
  if (dbg) { logUtil.onMulti(imapConn, logUtil.imapEventNames.conn, mkLogr); }
  tkw.imapMtd = methodByName.binder(imapConn);
  tkw.takeoff = takeoff.bind(null, tkw);
  tkw.scanMail = makeMailScanner(tkw);
  return tkw;
};


EX.convertConfig = function (cfg) {
  cfg = Object.assign({}, cfg);
  objUtil.replaceFalseyValuesWithDeepCopy(cfg, defaultConfig);

  if (!cfg.profileName) {
    cfg.profileName = (cfg.user || '?user?') + '@' + (cfg.host || '?host?');
  }
  if (isStr(cfg.host) && (cfg.host.slice(-1) === '@')) {
    cfg.host = cfg.host.slice(0, -1) + cfg.user.split(/@/)[1];
  }
  if ((!cfg.password) && isStr(cfg.pass)) { cfg.password = cfg.pass; }

  return cfg;
};



























module.exports = EX;
