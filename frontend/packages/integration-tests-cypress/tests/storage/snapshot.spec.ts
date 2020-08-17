import { testName, checkErrors } from '../../support';
import {
  SnapshotDetails,
  snapshotClassDropdown,
  dropdownFirstItem,
  pvcDropdown,
} from '../../views/snapshot';
import { listPage } from '../../views/list-page';
import { PVC, testerDeployment, SnapshotClass } from '../../mocks/snapshot';
import { detailsPage } from '../../views/details-page';
import { submitButton } from '../../views/form';

const snapshotName = `${PVC.metadata.name}-snapshot`;

/**
 * This suite works only with AWS platform.
 */

describe('Snapshot Tests', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
    cy.exec(`echo '${JSON.stringify(PVC)}' | oc apply -n ${testName} -f -`);
    cy.exec(`echo '${JSON.stringify(testerDeployment)}' | oc apply -n ${testName} -f -`);
    cy.exec(`echo '${JSON.stringify(SnapshotClass)}' | oc apply -f -`);
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

  it('Creates Snapshot', () => {
    cy.clickNavLink(['Storage', 'Volume Snapshots']);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      `snapshot.storage.k8s.io~v1beta1~VolumeSnapshot`,
    );
    listPage.clickCreateYAMLbutton();
    cy.get(pvcDropdown).click();
    cy.get(dropdownFirstItem)
      .first()
      .click();
    cy.get(snapshotClassDropdown).click();
    cy.get(dropdownFirstItem)
      .first()
      .click();
    cy.get(submitButton).click();
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      `snapshot.storage.k8s.io~v1beta1~VolumeSnapshot/${PVC.metadata.name}-snapshot`,
    );
    detailsPage.titleShouldContain(PVC.metadata.name);
    // eslint-disable-next-line promise/catch-or-return
    cy.exec(`oc get VolumeSnapshot ${PVC.metadata.name}-snapshot -n ${testName} -o json`)
      .its('stdout')
      .then((res) => {
        const volumeSnapshot = JSON.parse(res);
        cy.get(SnapshotDetails.name).contains(volumeSnapshot.metadata.name);
        cy.get(SnapshotDetails.namespace).contains(volumeSnapshot.metadata.namespace);
        cy.get(SnapshotDetails.vsc).contains(volumeSnapshot.status.boundVolumeSnapshotContentName);
        cy.get(SnapshotDetails.sc).contains(volumeSnapshot.spec.volumeSnapshotClassName);
        cy.get(SnapshotDetails.pvc).contains(volumeSnapshot.spec.source.persistentVolumeClaimName);
      });
  });

  it('Lists Snapshot', () => {
    cy.clickNavLink((['Volume Snapshots'] as unknown) as [string, string]);
    listPage.rows.shouldBeLoaded();
    listPage.rows.shouldExist(snapshotName);
    listPage.rows.shouldNotExist(`${snapshotName}dup`);
  });

  it('Deletes Snapshot', () => {
    listPage.rows.clickKebabAction(snapshotName, 'Delete Volume Snapshot');
    cy.get('#confirm-action').click();
    listPage.rows.shouldNotExist(snapshotName);
  });
});
