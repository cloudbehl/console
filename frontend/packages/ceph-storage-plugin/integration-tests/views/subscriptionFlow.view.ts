import { $, by, element, ExpectedConditions as until, browser } from 'protractor';
import * as sideNavView from 'integration-tests/views/sidenav.view';
import { untilNoLoadersPresent } from 'integration-tests/views/crud.view';

//TODO => Captialize S in OpenShift

export const OCS_OP = "Openshift Container Storage Operator";

const ocsLink = (element, catalogSource) => $(`a[data-test="${element}-${catalogSource}-openshift-marketplace"]`);

export const goToOperatorHub = async () => {
    await sideNavView.clickNavLink(['Operators', 'OperatorHub']);
    await browser.wait(until.and(untilNoLoadersPresent));
}

const searchInputOperatorHub = $('input[placeholder="Filter by keyword..."]');

export const searchInOperatorHub = async (searchParam) => {
    await browser.wait(until.visibilityOf(searchInputOperatorHub));
    await searchInputOperatorHub.sendKeys(searchParam);
    const ocs = await ocsLink('ocs-operator', 'ocs-catalogsource');
    await browser.wait(until.visibilityOf(ocs));
    return ocs;
}

export const operatorsPage = async () => {
    await sideNavView.clickNavLink(['Operators', 'Installed Operators']);
}