/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX,
  imapFetchCollect = require('imapfetch-collect'),
  async = require('async'),
  makeDateback = require('./dateback'),
  posInf = Number.POSITIVE_INFINITY;


function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function ifUndef(x, d) { return (x === undefined ? d : x); }
function numSubtract(a, b) { return a - b; }
function numSortAscInplace(arr) { return arr.sort(numSubtract); }

function expectFunc(x, descr) {
  if (ifFun(x)) { return; }
  throw new TypeError(descr + ': expected a Function, not ' + String(x));
}



EX = function makeMailScanner(tkw, cfg, log) {
  var imapMtd = tkw.imapMtd, days = makeDateback(cfg),
    maxMailsPerScan = (+cfg.maxMailsPerScan || posInf),
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
      function (msgs, then) {
        msgs.forEach(function (msg) {
          msg.text = msg.text.split(/\r?\n/);
        });
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





























module.exports = EX;
