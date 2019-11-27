'use strict';

const Apollo = require('ctrip-apollo-ex');
const { loadApolloConfig } = require('./lib/utils');

class AppBootHook {
  constructor(app) {
    this.app = app;
    this.app.apollo = Apollo(app.config.apollo);
  }

  configWillLoad() {
    // 此时 config 文件已经被读取并合并，但是还并未生效
    // 这是应用层修改配置的最后时机
    // 注意：此函数只支持同步调用
    loadApolloConfig(this.app);
  }
}

module.exports = AppBootHook;
