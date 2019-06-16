'use strict';

const debuglog = __debug.bind(null, __filename);

const _ = require('lodash');
const os = require('os');
const esprima = require('esprima');
const fs = require('fs');

const DataStore = require('./data-store');

const dbApi = new DataStore({
  location: `${os.homedir()}/.fdk/`
});
const addonVersion = dbApi.fetch('version_details').addon.version;

const events = require(`${os.homedir()}/.fdk/addon/addon-${addonVersion}/events/events.json`);

function getDefinedFunctions(hash) {
  const definedFunc = [];

  _.each(hash, function(prop) {
    if (prop.value.type === 'FunctionExpression') {
      definedFunc.push(prop.key.name);
    }
  });

  debuglog(`Found ${JSON.stringify(definedFunc)} as exported functions.`);

  return definedFunc;
}

function getEventsList() {
  const events = [];
  const code = fs.readFileSync( `${process.cwd()}/server/server.js`, 'utf8');
  const ast = esprima.parse(code).body;
  const exportsExp = _.find(ast, function(node) {
    return (node.type === 'ExpressionStatement'
      && node.expression.type === 'AssignmentExpression'
      && node.expression.left.name === 'exports');
  });

  let definedFunc = [];

  if (exportsExp) {
    const properties = exportsExp.expression.right.properties;

    definedFunc = getDefinedFunctions(properties);
    const eventProp = _.find(properties, function(prop) {
      return (prop.key.name === 'events'
        && prop.value.type === 'ArrayExpression');
    });

    const eventsHash = eventProp ? eventProp.value.elements : [];

    _.each(eventsHash, function(evt) {
      const values = evt.properties;
      const hash = {};

      _.each(values, function(p) {
        hash[p.key.name] = p.value.value;
      });
      events.push(hash);
    });
  }

  debuglog(`Found ${JSON.stringify(events)} as events.`);

  return {
    events: events,
    definedFunctions: definedFunc
  };
}

function eventsList(product) {
  return events[product].concat(_.flatten(_.values(events.common_events)));
}

function isValidEvent(product, eventName) {
  return _.includes(eventsList(product), eventName);
}

module.exports = {
  eventsList,
  isValidEvent,
  getEventsList
};
