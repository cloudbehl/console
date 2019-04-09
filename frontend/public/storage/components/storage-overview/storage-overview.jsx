import React from 'react';
import * as _ from 'lodash-es';

import {
  StorageOverview as KubevirtStorageOverview,
  StorageOverviewContext,
  getResource,
} from 'kubevirt-web-ui-components';

import {
  CephClusterModel,
  NodeModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
} from '../../../models';

import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { LoadingInline } from '../../../kubevirt/components/utils/okdutils';
import { coFetchJSON } from '../../../co-fetch';

const REFRESH_TIMEOUT = 5000;

const CEPH_STATUS_QUERY = 'ceph_health_status';
const STORAGE_CEPH_CAPACITY_TOTAL_QUERY = 'ceph_cluster_total_bytes';
const STORAGE_CEPH_CAPACITY_USED_QUERY = 'ceph_cluster_total_used_bytes';
const CEPH_OSD_UP_QUERY = 'sum(ceph_osd_up)';
const CEPH_OSD_DOWN_QUERY = 'count(ceph_osd_up == 0.0) OR vector(0)';

const TOP_CONSUMERS_QUERY = '(sort(topk(5, sum((max(kubelet_volume_stats_used_bytes{namespace!=""}) by (namespace, persistentvolumeclaim))* on (namespace,persistentvolumeclaim) group_left(pod) (max(kube_pod_spec_volumes_persistentvolumeclaims_info{namespace!="", pod != ""}) by (namespace, persistentvolumeclaim, pod))) by (namespace))))[360m:60m]';

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false }),
  },
  pvs: {
    resource: getResource(PersistentVolumeModel),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  cephCluster: {
    resource: getResource(CephClusterModel),
  },
};

const getPrometheusBaseURL = () => window.SERVER_FLAGS.prometheusBaseURL;

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ocsHealthData: {
        data: {},
        loaded: false,
      },
      topConsumersData: {
        stats: [],
        loaded: false,
      },
      capacityData: {},
      diskStats: {},
    };
    this.setHealthData = this._setHealthData.bind(this);
    this.setCapacityData = this._setCapacityData.bind(this);
    this.setCephDiskStats = this._setCephDiskStats.bind(this);
    this.setTopConsumersData = this._setTopConsumersData.bind(this);
  }

  _setHealthData(healthy) {
    this.setState({
      ocsHealthData: {
        data: {
          healthy,
        },
        loaded: true,
      },
    });
  }

  _setCapacityData(key, response) {
    this.setState(state => ({
      capacityData: {
        ...state.capacityData,
        [key]: response,
      },
    }));
  }

  _setCephDiskStats(key, response) {
    this.setState(state => ({
      diskStats: {
        ...state.diskStats,
        [key]: response,
      },
    }));
  }

  _setTopConsumersData(response) {
    const result = _.get(response, 'data.result', []);
    this.setState({
      topConsumersData: {
        stats: result,
        loaded: true,
      },
    });
  }

  fetchPrometheusQuery(query, callback) {
    const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url).then(result => {
      if (this._isMounted) {
        callback(result);
      }
    }).catch(error => {
      if (this._isMounted) {
        callback(error);
      }
    }).then(() => {
      if (this._isMounted) {
        setTimeout(() => this.fetchPrometheusQuery(query, callback), REFRESH_TIMEOUT);
      }
    });
  }

  componentDidMount() {
    this._isMounted = true;
    this.fetchPrometheusQuery(CEPH_STATUS_QUERY, this.setHealthData);
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, response => this.setCapacityData('capacityTotal', response));
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, response => this.setCapacityData('capacityUsed', response));
    this.fetchPrometheusQuery(CEPH_OSD_UP_QUERY, response => this.setCephDiskStats('cephOsdUp', response));
    this.fetchPrometheusQuery(CEPH_OSD_DOWN_QUERY, response => this.setCephDiskStats('cephOsdDown', response));
    this.fetchPrometheusQuery(TOP_CONSUMERS_QUERY, response => this.setTopConsumersData(response));
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { ocsHealthData, capacityData, diskStats, topConsumersData } = this.state;
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          ...capacityData,
          diskStats,
          ...topConsumersData,
        },
      };
    };

    return (
      <WithResources
        resourceMap={resourceMap}
        resourceToProps={inventoryResourceMapToProps}
      >
        <StorageOverviewContext.Provider>
          <KubevirtStorageOverview />
        </StorageOverviewContext.Provider>
      </WithResources>
    );
  }
}
