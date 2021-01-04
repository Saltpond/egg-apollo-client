'use strict';

const properties = require('properties');
const extend = require('extend2');

function parseConfig(ns) {
  const config = ns.config();
  const namespce = ns.namespace;
  const spArr = namespce.split('.');
  const format = spArr[spArr.length - 1];

  if (format === 'json' && config.content) {
    try {
      return JSON.parse(config.content);
    } catch (error) {
      return this.assert();
    }
  } else {
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
}

function mountConfig(config, ns) {
  Object.defineProperty(config, ns.namespace, {
    get() {
      return parseConfig(ns);
    },
  });
}

function mergeConfig(config, ns) {
  const nsConfig = parseConfig(ns);

  const newConfig = extend(true, {}, config, nsConfig);

  for (const key in newConfig) {
    config[key] = newConfig[key];
  }
}

function loadApolloConfig(app) {
  try {
    const options = app.config.apollo;
    const mergeNamespaces = Array.isArray(options.mergeNamespace) ? options.mergeNamespace : [ options.mergeNamespace ];

    options.namespaces.forEach(namespace => {
      const ns = app.apollo.namespace(namespace);

      ns.readySync();
      app.coreLogger.info(`[egg-apollo-client] [${namespace}] load config success`);

      if (options.mountConfig) {
        mountConfig(app.config, ns);
      }
      if (mergeNamespaces.includes(ns.namespace)) {
        // Namespace Events
        ns.on('add', () => {
          app.coreLogger.info(`[egg-apollo-client] [${namespace}] online config has new`);
          mergeConfig(app.config, ns);
        });
        ns.on('delete', () => {
          app.coreLogger.info(`[egg-apollo-client] [${namespace}] online config has delete`);
          mergeConfig(app.config, ns);
        });
        ns.on('updated', () => {
          app.coreLogger.info(`[egg-apollo-client] [${namespace}] online config has updated`);
          mergeConfig(app.config, ns);
        });
        mergeConfig(app.config, ns);
      }
    });
  } catch (error) {
    app.coreLogger.error(`[egg-apollo-client] fail to load config from apollo : ${error.message}`);
  }
}

module.exports = { loadApolloConfig };
