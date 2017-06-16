/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

try { require('usnam-pmb'); } catch (ignore) {}

function makeNew(Cls) { return new Cls(); }
function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function isStr(x, no) { return (((typeof x) === 'string') || no); }
function filterThen(f) { return function (x, n) { return (n || x)(f(x)); }; }
function copyUpdObj(pt, upd) { return Object.assign(Object.create(pt), upd); }
function ignoreResult() { return arguments[arguments.length - 1](); }
function numSubtract(a, b) { return a - b; }
function numSortAscInplace(arr) { return arr.sort(numSubtract); }
function ifUndef(x, d) { return (x === undefined ? d : x); }

function expectFunc(x, descr) {
  if (ifFun(x)) { return; }
  throw new TypeError(descr + ': expected a Function, not ' + String(x));
}

var EX = module.exports, ignVar = Boolean.bind(null, false),
  ImapConnection = require('imap'),
  imapFetchCollect = require('imapfetch-collect'),
  splitCb = require('splitcb'),
  storeAsync = require('objput').cb,
  methodByName = require('method-by-name'),
  logUtil = require('./src/log-util'),
  util = require('util'),
  posInf = Number.POSITIVE_INFINITY,
  async = require('async'),
  tkwPt = makeNew(function Thekwane() { return; });



EX.takeoff = function (cfg) {
  cfg = EX.convertConfig(cfg);
  var imapConn, imapMtd, mkLogr = logUtil.makeLoggerFactory(cfg.profileName),
    dbg = (cfg.debug === true),   // could also be false-y or a function
    tkw = copyUpdObj(tkwPt, {
      profileName: cfg.profileName,
      makeLogger: mkLogr,
      imapImpl: function () { return imapConn; },
    });

  function checkDump(opt, x) { if (cfg[opt]) { mkLogr(opt)(x); } }

  if (dbg) { cfg.debug = logUtil.censorLogin(mkLogr('.debug')); }
  imapConn = new ImapConnection(cfg);
  if (dbg) { logUtil.onMulti(imapConn, logUtil.imapEventNames.conn, mkLogr); }
  tkw.imapMtd = imapMtd = methodByName.binder(imapConn);
  tkw.scanMail = EX.makeMailScanner(tkw, cfg, mkLogr('scanMail'));

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
      setTimeout(function () { imapConn.end(); }, 2000);
      then();
    },
  ], splitCb());
  imapConn.connect();
  return tkw;
};


EX.convertConfig = function (cfg) {
  cfg = Object.assign({}, cfg);
  if (!cfg.profileName) {
    cfg.profileName = (cfg.user || '?user?') + '@' + (cfg.host || '?host?');
  }
  if (isStr(cfg.host) && (cfg.host.slice(-1) === '@')) {
    cfg.host = cfg.host.slice(0, -1) + cfg.user.split(/@/)[1];
  }
  function cfgDflt(k, v) { if (!cfg[k]) { cfg[k] = v; } }
  cfgDflt('autotls', 'required');
  if ((!cfg.password) && isStr(cfg.pass)) { cfg.password = cfg.pass; }
  return cfg;
};


EX.msecPerDay = 864e5;


EX.makeDateback = function (cfg) {
  var days = { cur: 0,
      max:  (+cfg.daysRangeMax || 365),
      mult: (+cfg.daysRangeMult || 1),
      step: (+cfg.daysRangeStep || 1),
      };
  days.inc = function () {
    if (days.cur < days.max) {
      days.cur = Math.min(days.max, (days.cur * days.mult) + days.step);
    }
    return days;
  };
  days.criterion = function (name) {
    return [ name, new Date(Date.now() - (days.cur * EX.msecPerDay)) ];
  };
  return days;
};


EX.defaultScanCriteria = [ 'UNSEEN' ];

EX.defaultFetchOpts = {
  markSeen: false,
  struct: true,
  envelope: true,
  size: true,
  bodies: [ 'HEADER', 'TEXT' ],
};


EX.makeMailScanner = function (tkw, cfg, log) {
  var imapMtd = tkw.imapMtd, days = EX.makeDateback(cfg),
    maxMailsPerScan = (+cfg.maxMailsPerScan || posInf),
    //concurrencyLimit = (+cfg.mailProcConcurrencyLimit || 1),
    baseCriteria = (cfg.baseCriteria || EX.defaultScanCriteria),
    fetchOpts = (cfg.fetchOpts || EX.defaultFetchOpts),
    collectOpts = {
      translateHeaderNames: ifUndef(cfg.translateHeaderNames, 'dash2camel'),
      maxDecodeBytes: cfg.maxDecodeBytes,
      simpleUniqueHeaders: true,
    };

  function scanMail(whenScanned) {
    expectFunc(whenScanned, 'arg "whenScanned" to <Thekwane>.scanMail');
    var stats = { n_found: 0 };
    days.inc();
    log('Scan mail up to' + days.cur + ' days old:');
    async.waterfall([
      imapMtd('search', baseCriteria.concat([ days.criterion('SINCE') ])),
      function startFetchFoundMails(foundUIDs, then) {
        numSortAscInplace(foundUIDs);
        var nMails = foundUIDs.length, fetcher;
        stats.n_found = nMails;
        if (nMails > maxMailsPerScan) {
          nMails = maxMailsPerScan;
          foundUIDs = foundUIDs.slice(0, nMails);
        }
        log('Start fetching ' + nMails + ' email(s).');
        fetcher = imapMtd('fetch', foundUIDs, fetchOpts)();
        fetcher.on('message',
          function (m, n) { log('fetch msg #' + (m && n)); });
        imapFetchCollect(fetcher, collectOpts, then);
      },
      function (msgs, then) {
        tkw.fetchedMessages = msgs.slice();
        then();
      }
      //function processFoundMails(mails, then) {
      //  log('Finished fetching email(s).');
      //  async.eachLimit(mails, concurrencyLimit,
      //    EX.processOneMail.bind(tkw, cfg, stats));
      //},
    ], function (err) {
      scanMail.latestScanStats = stats;
      whenScanned(err, stats);
    });
  }

  scanMail.daysRange = days;
  scanMail.latestScanStats = false;
  return scanMail;
};


EX.processOneMail = function (cfg, stats, mail, whenProcessed) {
  var tkw = this, imapMtd = tkw.imapMtd,
    log = tkw.makeLogger('mail#');
  log(mail || cfg || stats || imapMtd);
  async.waterfall([
  ], whenProcessed);
};





























/*scroll*/
