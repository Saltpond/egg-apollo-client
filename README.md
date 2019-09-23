# egg-apollo

## 使用场景

用于接入 apollo 配置中心，实现启动前动态加载配置进行初始化，与运行时获取最新配置来实现配置热更新，基于[ctrip-apollo](https://github.com/kaelzhang/ctrip-apollo)扩展。

### 启动前动态加载配置

通过配置 `mergeNamespace: application` 可以在 egg 启动前(目前在`configWillLoad`生命周期钩子),将 apollo 的 application 命名空间的配置合入本地文件配置 `app.config` 中，实现启动前的配置文件加载。

### 运行时获取配置

可以通过像获取 egg 配置一样的调用方式直接获取 apollo 配置，如 `app.config.application` 来获得 `application` 命名空间下的配置信息，也可以通过 `app.apollo` 来获取 apollo 实例，自行调用 api 获取配置信息。

配置获取在默认配置的情况下都是热更新的。详见后续说明。

## 安装

```
npm i @yunding/egg-apollo-client
```

## 开启插件

```js
// config/plugin.js
exports.apollo = {
  enable: true,
  package: '@yunding/egg-apollo-client'
};
```

## 详细配置

```
  host: '', // 配置中心地址
  appId: '', // appId
  cluster: 'default', // 默认集群
  namespaces: [ 'application' ], // 默认命名空间
  cachePath: '/tmp/apollo_cache', // 默认缓存目录
  enableUpdateNotification: true, // 默认开启推送更新
  enableFetch: true, // 默认开启定时拉取
  fetchInterval: 5 * 60 * 1000, // 定时拉取间隔
  retry: 10, // 初始化重试次数
  mergeNamespace: '', // 将特定namespace合入本地配置 默认不做
  mountConfig: true, // 将namespaces挂载到本地配置 默认开启
```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 使用参考

当`apollo`的某个`appId`下的`application`命名空间配置如下时

| key    | value            |
| ------ | ---------------- |
| name   | apollo           |
| config | {"key": "value"} |
| a.b    | 1                |
| a.c.d  | 2                |

通过`app.conig`直接获取配置信息。

```js
console.log(app.config.application);
// {
//   name: "apollo",
//   config: {
//     key: "value"
//   },
//   a: {
//     b: 1,
//     c: {
//       d: 2
//     }
//   }
// }
```

通过这种方式获得配置数据会默认进行 key 的对象合并和 value 的 JSON 格式化，所以推荐使用这种方式,具体的合并方式可以参考[properties](https://github.com/gagle/node-properties#namespaces)对 namespaces 合并的规则，但是一般来说不推荐使用 key 合并，而是直接把 value 设置为 JSON 对象更好。

第二种是直接通过`app.apollo`获取，这种获取方式拿到的配置不会对数据进行任何处理，所以得到的是原始字符串。

```js
app.apollo.namespace().config(); // 获取默认namespace下的全部配置
app.apollo.namespace().get(key); // 获取默认namespace下的某个配置
```

## 关于热更新

对于以上两种获取配置的方式，在启用`enableUpdateNotification: true`后可以获得近实时更新配置，或者启用`enableFetch: true`(`fetchInterval`)后，在`fetchInterval`周期后更新配置。

## 配置说明

常见配置可以参考[ctrip-apollo](https://github.com/kaelzhang/ctrip-apollo)

`mountConfig`配置 默认开启

开启后会将`namespaces`挂载到`config`下，比如配置`namespaces: [ 'application','otherNameSpace' ]`的时候你可以通过`app.config.application`,`app.config.otherNameSpace`获取 apollo 配置。

`mergeNamespace`配置

如果你希望将特定`namespace`的配置合并到`config`中，可以设置`mergeNamespace`，如`mergeNamespace: 'application'`，常见的使用场景是在 egg 启动前更改配置，采用的是`extend2`合并配置，如将启动的配置放在 apollo 配置中心，否则使用`mountConfig`进行配置挂载就能满足日常需求。