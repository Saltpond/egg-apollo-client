const mock = require('egg-mock');
const assert = require('assert');

describe('test/apollo.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/apollo-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    assert(app.config.application.greeting === 'apollo');
    assert(app.config.greeting === 'apollo');
    return app
      .httpRequest()
      .get('/')
      .expect('hi, apollo')
      .expect(200);
  });
});
