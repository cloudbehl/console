import { testName, checkErrors } from '../../support';
import { listPage } from '../../views/list-page';
import { PVC, testerDeployment } from '../../mocks/snapshot';
import { detailsPage } from '../../views/details-page';
import { modal } from '../../views/modal';
import { PVCDetails } from '../../views/snapshot';

const cloneName = `${PVC.metadata.name}-clone`;
const cloneSize = '2';

describe('Clone Tests', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
    cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
    cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc apply -n ${testName} -f -`);
    // Let the PVC get bound
    cy.wait(10 * 1000);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('Creates PVC Clone', () => {
    cy.clickNavLink(['Storage', 'Persistent Volume Claims']);
    cy.location('pathname', { timeout: 60000 }).should('include', `persistentvolumeclaims`);
    listPage.rows.clickKebabAction(PVC.metadata.name, 'Clone PVC');
    modal.shouldBeOpened();
    cy.get('#input-request-size')
      .clear()
      .type(cloneSize);
    modal.submit();
    modal.shouldBeClosed();
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      `persistentvolumeclaims/${PVC.metadata.name}-clone`,
    );
    detailsPage.titleShouldContain(`${PVC.metadata.name}-clone`);
    // eslint-disable-next-line promise/catch-or-return
    cy.exec(`oc get pvc ${PVC.metadata.name}-clone -n ${testName} -o json`)
      .its('stdout')
      .then((res) => {
        const pvc = JSON.parse(res);
        cy.get(PVCDetails.name).contains(pvc.metadata.name);
        cy.get(PVCDetails.namespace).contains(pvc.metadata.namespace);
        cy.byTestID('pvc-requested-capacity').contains(`${cloneSize} GiB`);
      });
  });

  it('Lists Clone', () => {
    cy.clickNavLink((['Persistent Volume Claims'] as unknown) as [string, string]);
    listPage.rows.shouldBeLoaded();
    listPage.rows.shouldExist(cloneName);
  });

  it('Deletes PVC Clone', () => {
    listPage.filter.byName(cloneName);
    listPage.rows.clickKebabAction(cloneName, 'Delete Persistent Volume Claim');
    cy.get('#confirm-action').click();
    listPage.rows.shouldNotExist(cloneName);
  });
});
