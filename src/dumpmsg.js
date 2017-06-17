/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, utf8bom = '\uFEFF',
  deepSortObj = require('deepsortobj'),
  util = require('util'),
  fs = require('fs');


EX.toFile = function (cfg, msg, whenDumped) {
  var fn, dateDigits = msg.date.toISOString().replace(/\D/g, ''), dump,
    fmt = cfg.mailDumpFmt;
  fn = cfg.mailDumpPath + '/' +
    dateDigits.substr(2, 6) + '-' +
    dateDigits.substr(8, 6) + '-' +
    msg.seqno + '.' + fmt;
  dump = Object.assign({}, msg);
  delete dump.text;
  dump = deepSortObj(dump);

  switch (fmt) {
  case 'json':
    dump = [dump].concat(String(msg.text).split(/\n/));
    dump = utf8bom + JSON.stringify(dump, null, 2) + '\n';
    break;
  case 'txt':
    dump = utf8bom + util.inspect(dump, { depth: null }) + '\n\n' +
      String(msg.text).replace(/\r/g, '') + '\n';
    break;
  default:
    return whenDumped(new Error('Unsupported dump format: ' + fmt));
  }

  if (cfg.log) { cfg.log('dump: mail #' + msg.seqno + ' -> ' + fn); }
  fs.writeFile(fn, dump, whenDumped);
};






























module.exports = EX;
