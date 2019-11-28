import { $, $$, ExpectedConditions as until, browser } from 'protractor';
import * as crudView from 'integration-tests/views/crud.view';
import { goToOperatorHub, searchInOperatorHub, OCS_OP, operatorsPage } from '../views/subscriptionFlow.view';


describe('Namespace', () => {
  const name = 'openshift-storage';

  it('creates the namespace', async () => {
    await crudView.createYAMLButton.click();
    await browser.wait(until.presenceOf($('.modal-body__field')));
    await $$('.modal-body__field').get(0).$('input').sendKeys(name);
    leakedResources.add(JSON.stringify({ name, plural: 'namespaces' }));
    await $('#confirm-action').click();
    await browser.wait(until.invisibilityOf($('.modal-content')), K8S_CREATION_TIMEOUT);

    expect(browser.getCurrentUrl()).toContain(`/k8s/cluster/namespaces/${testName}-ns`);
  });
}