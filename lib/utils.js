'use strict';

const properties = require('properties');
const sleep = require('system-sleep');
const extend = require('extend2');

function parseConfig(config) {
  try {
    let propertiesStr = '';
    Object.keys(config).forEach(key => {
      propertiesStr += `${key}=${config[key]}\n`;
    });
    return properties.parse(propertiesStr, {
      namespaces: true,
      reviver(key, value) {
        try {
          return JSON.parse(value);
        } catch (error) {
          return this.assert();
        }
      },
    });
  } catch (error) {
    return config;
  }
}

function mountConfig(config, ns) {
  Object.defineProperty(config, ns.namespace, {
    get() {
      return parseConfig(ns.config());
    },
  });
}

function mergeConfig(config, ns) {
  const nsConfig = parseConfig(ns.config());

  const newConfig = extend(true, {}, config, nsConfig);

  for (const key in newConfig) {
    config[key] = newConfig[key];
  }
}

function loadApolloConfig(app) {
  try {
    const options = app.config.apollo;
    let done = false;
    let err;
    Promise.all(
      options.namespaces.map(async namespace => {
        const ns = app.apollo.namespace(namespace);
        await ns.ready();
        return ns;
      })
    )
      .then(nsArr => {
        done = true;
        nsArr.forEach(ns => {
          if (options.mountConfig) {
            mountConfig(app.config, ns);
          }
          if (options.mergeNamespace === ns.namespace) {
            // Namespace Events
            ns.on('add', () => {
              app.coreLogger.info('[egg-apollo-client] online config has new');
              mergeConfig(app.config, ns);
            });
            ns.on('delete', () => {
              app.coreLogger.info('[egg-apollo-client] online config has delete');
              mergeConfig(app.config, ns);
            });
            ns.on('updated', () => {
              app.coreLogger.info('[egg-apollo-client] online config has updated');
              mergeConfig(app.config, ns);
            });
            mergeConfig(app.config, ns);
          }
        });
      })
      .catch(e => (err = e));
    let count = 0;
    while (!done) {
      if (err) {
        throw err;
      }
      count = count + 1;
      if (count > options.retry) {
        throw new Error(`[egg-apollo-client] fetch configs timeout from apollo after retry ${options.retry} times`);
      }
      sleep(1000);
    }
  } catch (error) {
    app.coreLogger.error(`[egg-apollo-client] fail to load config from apollo : ${error.message}`);
  }
}

module.exports = { loadApolloConfig };
