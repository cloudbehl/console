import { $, by, element, ExpectedConditions as until, browser } from 'protractor';
import { untilNoLoadersPresent } from 'integration-tests/views/crud.view';
import * as sideNavView from 'integration-tests/views/sidenav.view';

export const goToNamespacePage = async () => {
  await sideNavView.clickNavLink(['Administration', 'Namespaces']);
  await browser.wait(until.and(untilNoLoadersPresent));
}
const createNamespaceID = $("#yaml-create")

export const clickCreateNamespace = async () => {
  await sideNavView.clickNavLink(['Administration', 'Namespaces']);
  await browser.wait(until.and(untilNoLoadersPresent));
}