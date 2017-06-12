/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, synd = [];
EX.syncDeciders = synd;

function ifObj(x, d) { return ((x && typeof x) === 'object' ? x : d); }


EX.runFromCLI = function () {
  function guessConfig() {
    var acc = (process.env.THEKWANE_USER || 'default');
    if (acc.match(/\/|@/)) { return acc; }
    return '../logins/' + acc + '.json';
  }
  var cfg = require(guessConfig()), tkw = require('thekwane-pmb')(cfg);
  tkw.on('decideMail', EX.decideMail.bind(tkw));
  return;
};


EX.decideMail = function (mail, decide) {
  var decision;
  EX.syncDeciders.find(function (decider) {
    decision = ifObj(decider(mail));
    return !!decision;
  });
  return decide(null, decision);
};






















synd.push(function (mail) { console.log('Unknown mail:', mail.debug()); });

if (require.main === module) { EX.runFromCLI(); }
