import { $, $$, ExpectedConditions as until, browser } from 'protractor';
import { untilNoLoadersPresent } from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';

const createNamespaceID = $('#yaml-create');
const createBtn = $('.modal-content').$('#confirm-action');
const namespaceClass = '.modal-body__field';
const labelValue = 'true';
const label = `openshift.io/cluster-monitoring=${labelValue}`;

export const namespace = 'openshift-storage';

export const goToNamespacePage = async () => {
  await sideNavView.clickNavLink(['Administration', 'Namespaces']);
  await browser.wait(until.and(untilNoLoadersPresent));
};

export const clickCreateNamespaceButton = async () => {
  await browser.wait(until.visibilityOf(createNamespaceID));
  createNamespaceID.click();
};

export const clickCreateButton = async () => {
  await $$(namespaceClass)
    .get(0)
    .$('input')
    .sendKeys(namespace);
  await $$(namespaceClass)
    .get(1)
    .$('input')
    .sendKeys(label);
  await createBtn.click();
};
