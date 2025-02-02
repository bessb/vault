import { module, test } from 'qunit';
import { setupTest } from 'vault/tests/helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Unit | Adapter | pki/certificate/generate', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    this.store = this.owner.lookup('service:store');
    this.secretMountPath = this.owner.lookup('service:secret-mount-path');
    this.backend = 'pki-test';
    this.secretMountPath.currentPath = this.backend;
    this.data = {
      serial_number: 'my-serial-number',
      certificate: 'some-cert',
    };
  });

  test('it should make request to correct endpoint on create', async function (assert) {
    assert.expect(1);
    const generateData = {
      name: 'my-role',
      common_name: 'example.com',
    };
    this.server.post(`${this.backend}/issue/${generateData.name}`, () => {
      assert.ok(true, 'request made to correct endpoint on create');
      return {
        data: {
          serial_number: 'this-serial-number',
        },
      };
    });

    const model = await this.store.createRecord('pki/certificate/generate', generateData);
    await model.save();
  });

  test('it should make request to correct endpoint on delete', async function (assert) {
    assert.expect(2);
    this.store.pushPayload('pki/certificate/generate', {
      modelName: 'pki/certificate/generate',
      ...this.data,
    });
    this.server.post(`${this.backend}/revoke`, (schema, req) => {
      assert.deepEqual(JSON.parse(req.requestBody), { serial_number: 'my-serial-number' });
      assert.ok(true, 'request made to correct endpoint on delete');
      return { data: {} };
    });

    const model = await this.store.peekRecord('pki/certificate/generate', this.data.serial_number);
    await model.destroyRecord();
  });
});
