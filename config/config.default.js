'use strict';

exports.apollo = {
  host: '',
  appId: '',
  cluster: 'default',
  namespaces: [ 'application' ],
  cachePath: '/tmp/apollo_cache',
  enableUpdateNotification: true,
  enableFetch: true,
  fetchInterval: 5 * 60 * 1000,
  retry: 10,
  mergeNamespace: '', // 将namespace合入本地配置
  mountConfig: true, // 将namespaces挂载到本地配置
};
