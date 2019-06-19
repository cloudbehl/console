import * as React from 'react';
import * as _ from 'lodash';

import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { HealthBody } from '@console/internal/components/dashboard/health-card/health-body';
import { HealthItem } from '@console/internal/components/dashboard/health-card/health-item';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { STORAGE_PROMETHEUS_QUERIES } from '../../../constants/storage';
import { CEPH_HEALTHY, CEPH_DEGRADED, CEPH_ERROR, CEPH_UNKNOWN } from '../../../constants/index';

const OCSHealthStatus = {
  0: {
    message: CEPH_HEALTHY,
    state: HealthState.OK,
  },
  1: {
    message: CEPH_DEGRADED,
    state: HealthState.WARNING,
  },
  2: {
    message: CEPH_ERROR,
    state: HealthState.ERROR,
  },
  3: {
    message: CEPH_UNKNOWN,
    state: HealthState.ERROR,
  },
};

const getCephHealthState = (ocsResponse: Array<SystemHealth>): CephHealth => {
  if (!ocsResponse) {
    return { state: HealthState.LOADING };
  }
  const value = _.get(ocsResponse, 'data.result[0].value[1]');
  return OCSHealthStatus[value] || OCSHealthStatus[3];
};

const HealthCard_: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    watchPrometheus(STORAGE_PROMETHEUS_QUERIES.CEPH_STATUS_QUERY);
    return () => {
      stopWatchPrometheusQuery(STORAGE_PROMETHEUS_QUERIES.CEPH_STATUS_QUERY);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const queryResult = prometheusResults.getIn([
    STORAGE_PROMETHEUS_QUERIES.CEPH_STATUS_QUERY,
    'result',
  ]);

  const healthState = getCephHealthState(queryResult);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={healthState.state === HealthState.LOADING}>
        <HealthBody>
          <HealthItem
            state={healthState.state}
            message={healthState.message}
            details={healthState.details}
          />
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const HealthCard = withDashboardResources(HealthCard_);

type CephHealth = {
  state: HealthState;
  message?: string;
  details?: string;
};

export type SystemHealth = {
  message?: string;
  state: HealthState;
};
