import { $, ExpectedConditions as until, browser } from 'protractor';
import * as crudView from 'integration-tests/views/crud.view';
import { goToOperatorHub, searchInOperatorHub, OCS_OP, operatorsPage } from '../views/subscriptionFlow.view';

describe('Testing OCS Subscription', () => {
    beforeAll(async () => {
        await operatorsPage();
        await browser.wait(
            until.and(
                crudView.untilNoLoadersPresent))
        await goToOperatorHub();
        await browser.wait(
            until.and(
                crudView.untilNoLoadersPresent));

        const ocsOp = await searchInOperatorHub(OCS_OP);
        await ocsOp.click();
    });
    it('SSD', async () => {
    });
})