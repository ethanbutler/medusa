#!/usr/bin/env node
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var chalk = require('chalk');
var fs = require('fs');
var program = require('commander');
var axios = require('axios');

var DEMARCATOR = ',';
var DEFAULT_PATH = '/wp-json/wp/v2/';

var multi = function multi(val, memo) {
  memo.push(val);
  return memo;
};

var getData = function getData(types, urlOpts) {
  var base = urlOpts.base,
      path = urlOpts.path,
      params = urlOpts.params;

  return new Promise(function (resolve, reject) {
    var allData = {};
    var complete = 0;

    types.map(function (type) {
      var endpoint = '' + base + path + type + '?' + params;
      getDataByPage(endpoint).then(function (data) {
        allData[type] = data;
        complete = complete + 1;
        if (complete === types.length) resolve(allData);
      }).catch(function (err) {
        return reject(err);
      });
    });
  });
};

var getDataByPage = function getDataByPage(endpoint) {
  return new Promise(function (resolve, reject) {
    var data = [];
    var recurse = function recurse(endpoint) {
      var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var prevData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      var url = endpoint + (page ? '&page=' + page : '');
      console.log('Scraping ' + chalk.magenta(url));
      axios.get(url).then(function (res) {
        data = [].concat(_toConsumableArray(prevData), _toConsumableArray(res.data));
        recurse(endpoint, page + 1, data);
      }).catch(function (err) {
        if (err.response && err.response.data) {
          if (err.response.data.code === 'rest_post_invalid_page_number') {
            resolve(data);
          }
          reject(err.response.data);
        }
        reject(err);
      });
    };

    recurse(endpoint);
  });
};

var outputData = function outputData(file, data, force) {
  return new Promise(function (resolve, reject) {
    var shouldMerge = !force && fs.existsSync(file);

    if (shouldMerge) {
      var pwd = process.env.PWD;
      var contents = require(pwd + '/' + file);
      var newData = Object.assign(contents, data);
      var newFile = JSON.stringify(newData);

      fs.writeFile('' + file, newFile, function (err) {
        if (err) reject(err);else resolve(true);
      });
    } else {
      var _newFile = JSON.stringify(data);
      fs.writeFile('' + file, _newFile, function (err) {
        if (err) reject(err);else resolve(false);
      });
    }
  });
};

program.version('1.0.0').arguments('<base>').option('-n', 'Use a non-WP REST API base').option('-f', 'Force complete rebuild').option('-t, --types [types]', 'Types to be scraped.', multi, []).option('-p, --params [params]', 'URL params.', multi, []).option('-o, --output <output>', 'Output location').action(function (base) {
  var types = program.types,
      params = program.params,
      output = program.output,
      N = program.N,
      F = program.F;

  if (!output) {
    console.log(chalk.red('Please specify output location with -o'));
    return;
  }

  if (params) params = params.join('&');

  var path = !N ? DEFAULT_PATH : '/';

  var t = Date.now();
  getData(types, { base: base, path: path, params: params }).then(function (data) {
    var _t = Date.now();
    console.log(chalk.green('Scape complete after ' + (_t - t) + 'ms'));
    outputData(output, data, !!F).then(function (wasMerged) {
      var __t = Date.now();
      var verb = wasMerged ? 'merged with' : 'output to';
      console.log(chalk.green('Data ' + verb + ' ' + output + ' after ' + (__t - _t) + 'ms'));
    }).catch(function (err) {
      console.log(chalk.red(err));
    });
  }).catch(function (err) {
    console.log(chalk.red(err));
  });
}).parse(process.argv);