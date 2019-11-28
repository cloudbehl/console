import { ExpectedConditions as until, browser } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import * as createNamespace from '../views/CreateOpenShiftStorageNamespace.view';

describe('Create openshift-storage Namespace', () => {
  const BROWSER_TIMEOUT = 15000;

  it('create the namespace', async () => {
    await createNamespace.goToNamespacePage();
    await createNamespace.clickCreateNamespaceButton();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await createNamespace.clickCreateButton();
    await browser.wait(until.urlContains(`/${createNamespace.namespace}`), BROWSER_TIMEOUT);
    expect(browser.getCurrentUrl()).toContain(
      `${appHost}/k8s/cluster/namespaces/${createNamespace.namespace}`,
    );
  });
});
