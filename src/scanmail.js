/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX,
  imapFetchCollect = require('imapfetch-collect'),
  async = require('async'),
  asyU = require('async-util-pmb'),
  makeDateback = require('./dateback'),
  dumpMsg = require('./dumpmsg'),
  posInf = Number.POSITIVE_INFINITY;


function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function ifUndef(x, d) { return (x === undefined ? d : x); }
function numSubtract(a, b) { return a - b; }
function numSortAscInplace(arr) { return arr.sort(numSubtract); }


function expectFunc(x, descr) {
  if (ifFun(x)) { return; }
  throw new TypeError(descr + ': expected a Function, not ' + String(x));
}



EX = function makeMailScanner(tkw) {
  var cfg = tkw.cfg, imapMtd = tkw.imapMtd,
    days = makeDateback(cfg),
    log = tkw.makeLogger('scanMail'),
    maxMailsPerScan = (+cfg.maxMailsPerScan || posInf),
    collectOpts = {
      translateHeaderNames: 'dash2camel',
      maxDecodeBytes: cfg.maxDecodeBytes,
      simpleUniqueHeaders: true,
    };

  function scanMail(whenScanned) {
    expectFunc(whenScanned, 'arg "whenScanned" to <Thekwane>.scanMail');
    var stats = { n_found: 0 };
    days.inc();
    log('Scan mail up to' + days.cur + ' days old:');
    async.waterfall([

      imapMtd('search', cfg.scanCriteria.concat([ days.criterion('SINCE') ])),

      function startFetchFoundMails(foundUIDs, then) {
        numSortAscInplace(foundUIDs);
        var nMails = foundUIDs.length, fetcher;
        stats.n_found = nMails;
        if (nMails > maxMailsPerScan) {
          nMails = maxMailsPerScan;
          foundUIDs = foundUIDs.slice(0, nMails);
        }
        log('Start fetching ' + nMails + ' email(s).');
        fetcher = imapMtd('fetch', foundUIDs, cfg.fetchOpts)();
        fetcher.on('message',
          function (m, n) { log('fetch msg #' + (m && n)); });
        imapFetchCollect(fetcher, collectOpts, then);
      },

      (cfg.mailDumpPath && asyU.wfTap(function (msgs, whenAllDumped) {
        var dumpCfg = Object.assign({ log: log }, tkw.cfg),
          dumpOne = dumpMsg.toFile.bind(null, dumpCfg);
        async.each(msgs, dumpOne, whenAllDumped);
      })),

    ].filter(Boolean), function (err) {
      scanMail.latestScanStats = stats;
      whenScanned(err, stats);
    });
  }

  scanMail.daysRange = days;
  scanMail.latestScanStats = false;
  return scanMail;
};





























module.exports = EX;
