import React from 'react';
import * as _ from 'lodash-es';

import {
  StorageOverview as KubevirtStorageOverview,
  ClusterOverviewContext,
  getResource,
  formatBytes,
  complianceData,
} from 'kubevirt-web-ui-components';

import {
  CephClusterModel,
  NodeModel,
  PodModel,
  PersistentVolumeClaimModel,
  VirtualMachineModel,
} from '../../../models';
import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { LoadingInline } from '../../../kubevirt/components/utils/okdutils';
import { coFetchJSON } from '../../../co-fetch';
import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from '../../../kubevirt/components/cluster/events-inner-overview';

const CEPH_STATUS = 'ceph_health_status';
const CAPACITY_STORAGE_TOTAL_QUERY = 'ceph_cluster_total_bytes'; // available with Ceph
const CAPACITY_STORAGE_USED_QUERY = 'ceph_cluster_total_used_bytes';
const REQUESTED_CAPACITY_STORAGE_QUERY =
  'sum(kube_persistentvolumeclaim_resource_requests_storage_bytes)'; // available with Ceph
const ALLOCATED_CAPACITY_STORAGE_QUERY = 'sum(kubelet_volume_stats_used_bytes)';

const CEPH_ROOK_NAMESPACE = 'openshift-storage';
const REFRESH_TIMEOUT = 30000;

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false }),
  },
  pods: {
    resource: getResource(PodModel, {
      namespace: CEPH_ROOK_NAMESPACE,
    }),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  vms: {
    resource: getResource(VirtualMachineModel),
  },
  cephCluster: {
    resource: getResource(CephClusterModel),
  },
};

const getInventoryData = resources => {
  const inventory = {};
  if (resources.nodes) {
    inventory.nodes = {
      data: resources.nodes,
      title: 'Hosts',
      kind: NodeModel.kind,
    };
  }
  if (resources.pods) {
    inventory.pods = {
      data: resources.pods,
      title: 'Pods',
      kind: PodModel.kind,
    };
  }
  if (resources.pvcs) {
    inventory.pvcs = {
      data: resources.pvcs,
      title: 'PVCs',
      kind: PersistentVolumeClaimModel.kind,
    };
  }
  if (resources.vms) {
    inventory.vms = {
      data: resources.vms,
      title: 'VMs',
      kind: VirtualMachineModel.kind,
    };
  }
  return {
    inventory,
    loaded: !!inventory,
    heading: 'OCS Inventory',
  };
};

const OverviewEventStream = () => (
  <EventStream
    scrollableElementId="events-body"
    InnerComponent={EventsInnerOverview}
    overview={true}
    // namespace={"openshift-storage"}
    textFilter={'ceph.rook'}
  />
);

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      healthData: {
        data: {},
        loaded: false,
        heading: 'OCS Health',
      },
      capacityStats: {
        stats: {
          totalCapacity: {
            title: 'Total Capacity',
            data: {},
            formatValue: formatBytes,
          },
          requestedCapacity: {
            title: 'Requested Capacity',
            data: {},
            formatValue: formatBytes,
          },
        },
      },
    };

    this.setHealthData = this._setHealthData.bind(this);
    this.setCapacityData = this._setCapacityData.bind(this);
  }

  _setHealthData(healthy, message) {
    this.setState({
      healthData: {
        data: {
          healthy,
          message,
        },
        loaded: true,
      },
    });
  }

  _setCapacityData(key, dataKey, response) {
    const result = response.data.result;
    this.setState(state => {
      const capacityStats = {
        stats: _.get(state.capacityStats, 'stats', {}),
      };

      const value = Number(_.get(result, '[0].value[1]'));
      if (!Number.isNaN(value)) {
        if (dataKey === 'totalDefault') {
          if (isNaN(capacityStats.stats[key].data.total)) {
            capacityStats.stats[key].data.total = value;
          }
        } else if (dataKey === 'usedDefault') {
          if (isNaN(capacityStats.stats[key].data.used)) {
            capacityStats.stats[key].data.used = value;
          }
        } else {
          capacityStats.stats[key].data[dataKey] = value;
        }
      }
      return { capacityStats };
    });
  }

  fetchPrometheusQuery(query, callback) {
    const promURL = window.SERVER_FLAGS.prometheusBaseURL;
    const url = `${promURL}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url)
      .then(result => {
        if (this._isMounted) {
          callback(result);
        }
      })
      .then(() => {
        if (this._isMounted) {
          setTimeout(
            () => this.fetchPrometheusQuery(query, callback),
            REFRESH_TIMEOUT
          );
        }
      });
  }

  fetchHealth(response, callback) {
    const result = response.data.result;
    result.map(r =>
      r.value[1] === '0'
        ? callback(true, 'OCS is healthy')
        : callback(false, 'OCS is Unhealthy')
    );
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CEPH_STATUS, response =>
      this.fetchHealth(response, this.setHealthData)
    );

    this.fetchPrometheusQuery(CAPACITY_STORAGE_TOTAL_QUERY, response =>
      this.setCapacityData('totalCapacity', 'totalDefault', response)
    );
    this.fetchPrometheusQuery(CAPACITY_STORAGE_USED_QUERY, response =>
      this.setCapacityData('totalCapacity', 'usedDefault', response)
    );

    this.fetchPrometheusQuery(REQUESTED_CAPACITY_STORAGE_QUERY, response =>
      this.setCapacityData('requestedCapacity', 'totalDefault', response)
    );
    this.fetchPrometheusQuery(ALLOCATED_CAPACITY_STORAGE_QUERY, response =>
      this.setCapacityData('requestedCapacity', 'usedDefault', response)
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          detailsData: {
            LoadingComponent: LoadingInline,
            storageCluster: resources.cephCluster,
            ...this.state.detailsData,
          },
          inventoryData: getInventoryData(resources),
          healthData: {
            clusterHealth: this.state.healthData,
            LoadingComponent: LoadingInline,
            ...this.state.healthData,
          },
          eventsData: {
            Component: OverviewEventStream,
            heading: 'OCS Events',
            loaded: true,
          },
          capacityStats: {
            LoadingComponent: LoadingInline,
            ...this.state.capacityStats,
          },
          complianceData,
        },
      };
    };

    return (
      <WithResources
        resourceMap={resourceMap}
        resourceToProps={inventoryResourceMapToProps}
      >
        <ClusterOverviewContext.Provider>
          <KubevirtStorageOverview />
        </ClusterOverviewContext.Provider>
      </WithResources>
    );
  }
}
