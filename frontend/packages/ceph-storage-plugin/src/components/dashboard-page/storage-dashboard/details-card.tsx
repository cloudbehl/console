import * as React from 'react';
import * as _ from 'lodash-es';

import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';

import { DetailsBody } from '@console/internal/components/dashboard/details-card/details-body';
import { DetailItem } from '@console/internal/components/dashboard/details-card/detail-item';

import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { CephClusterModel } from '../../../models';
import { getName } from '@console/shared/src/selectors/common';
import { InfrastructureModel } from '@console/internal/models/index';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sResourceKind } from '@console/internal/module/k8s/index';
import { FirehoseResource } from '@console/internal/components/utils/index';

const getInfrastructurePlatform = (infrastructure: K8sResourceKind): string =>
  _.get(infrastructure, 'status.platform');

const getCephVersion = (cephCluster: K8sResourceKind): string =>
  _.get(cephCluster, 'spec.cephVersion.image');

const infrastructureResource: FirehoseResource = {
  kind: referenceForModel(InfrastructureModel),
  namespaced: false,
  isList: false,
  prop: 'infrastructure',
};

const cephClusterResource: FirehoseResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: true,
  namespace: 'openshift-storage',
  isList: true,
  prop: 'ceph',
};

export const DetailsCard_: React.FC<DashboardItemProps> = ({
  watchURL,
  stopWatchURL,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  React.useEffect(() => {
    watchK8sResource(cephClusterResource);
    watchK8sResource(infrastructureResource);
    return () => {
      stopWatchK8sResource(cephClusterResource);
      stopWatchK8sResource(infrastructureResource);
    };
  }, [watchK8sResource, stopWatchK8sResource, watchURL, stopWatchURL]);

  const infrastructure = _.get(resources, 'infrastructure');
  const infrastructureLoaded = _.get(infrastructure, 'loaded', false);
  const infrastructureData = _.get(infrastructure, 'data') as K8sResourceKind;

  const cephCluster = _.get(resources, 'ceph');
  const cephClusterLoaded = _.get(cephCluster, 'loaded', false);
  const cephClusterData = _.get(cephCluster, 'data') as K8sResourceKind;

  return (
    <DashboardCard className="co-details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          {
            <>
              <DetailItem
                key="name"
                title="Name"
                value={getName(_.get(cephClusterData, '0'))}
                isLoading={!cephClusterLoaded}
              />
              <DetailItem
                key="provider"
                title="Provider"
                value={getInfrastructurePlatform(infrastructureData)}
                isLoading={!infrastructureLoaded}
              />
              <DetailItem
                key="version"
                title="version"
                value={getCephVersion(_.get(cephClusterData, '0'))}
                isLoading={!cephClusterLoaded}
              />
            </>
          }
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const DetailsCard = withDashboardResources(DetailsCard_);
