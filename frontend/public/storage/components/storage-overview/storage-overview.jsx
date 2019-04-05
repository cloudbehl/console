import React from "react";
import * as _ from "lodash-es";

import {
  StorageOverview as KubevirtStorageOverview,
  StorageOverviewContext,
  getResource
} from "kubevirt-web-ui-components";

import {
  CephClusterModel,
  NodeModel,
  PodModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  VirtualMachineModel,
  VirtualMachineInstanceMigrationModel,
} from '../../../models';

import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { LoadingInline } from '../../../kubevirt/components/utils/okdutils';
import { coFetchJSON } from '../../../co-fetch';
import { EventStream } from '../../../components/events';
import { EventsInnerOverview } from '../../../kubevirt/components/cluster/events-inner-overview';

const REFRESH_TIMEOUT = 30000;
const CEPH_ROOK_NAMESPACE = 'openshift-storage';

const CEPH_STATUS = 'ceph_health_status';
const STORAGE_CEPH_CAPACITY_TOTAL_QUERY = "ceph_cluster_total_bytes";
const STORAGE_CEPH_CAPACITY_USED_QUERY = "ceph_cluster_total_used_bytes";
const DATA_RESILIENCY_QUERY = "(ceph_pg_active/ ceph_pg_total)*100";

const pollerTimeouts = {};
const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false }),
  },
  pods: {
    resource: getResource(PodModel, {
      namespace: CEPH_ROOK_NAMESPACE,
    }),
  },
  pvs: {
    resource: getResource(PersistentVolumeModel),
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel),
  },
  vms: {
    resource: getResource(VirtualMachineModel),
  },
  migrations: {
    resource: getResource(VirtualMachineInstanceMigrationModel),
  },
  cephCluster: {
    resource: getResource(CephClusterModel, { isList: false }),
  },
};

const OverviewEventStream = () => <EventStream scrollableElementId="events-body" InnerComponent={EventsInnerOverview} overview={true} namespace={"openshift-storage"} />;

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ocsHealthData: {
        data: {},
        loaded: false
      },
      ocsAlertData: {
        data: {},
        loaded: false
      },
      dataResiliencyData: {
        componentLoaded: true,
        progressPercentage: 0,
      },
      capacityData: {},
    };
    this.setHealthData = this._setHealthData.bind(this);
    this.setAlertData = this._setAlertData.bind(this);
    this.setCapacityData = this._setCapacityData.bind(this);
    this.setDataResiliency = this._setDataResiliency.bind(this);
  }
  _setHealthData(healthy) {
    this.setState({
      ocsHealthData: {
        data: {
          healthy
        },
        loaded: true
      }
    });
  }

  _setDataResiliency(progressPercentage) {
    this.setState({
      dataResiliencyData: {
        progressPercentage,
        componentLoaded: true,
      }
    })
  }

  _setAlertData(alerts) {
    this.setState({
      ocsAlertData: {
        data: {
          alerts
        },
        loaded: true
      }
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

  fetchHealth(response, callback) {
    const result = response.data.result;
    result.map(r => callback(r.value[1]));
  }

  fetchDataResiliency(response, callback) {
    const result = response.data.result;
    result.map(r => callback(Number(r.value[1])));
  }

  fetchPrometheusQuery(query, key, callback) {
    const promURL =
      "https://prometheus-k8s-openshift-monitoring.apps.shubh-ceph.devcluster.openshift.com/";
    const url = `${promURL}/api/v1/query?query=${encodeURIComponent(query)}`;
    coFetchJSON(url)
      .then(result => {
        callback(result);
      })
      .then(() => {
        pollerTimeouts[key] = setTimeout(
          () => this.fetchPrometheusQuery(query, key, callback),
          REFRESH_TIMEOUT
        );
      });
    coFetchJSON(url);
  }

  poll(key, dataHandler) {
    const promURL = window.SERVER_FLAGS.prometheusBaseURL;
    promURL =
      "https://prometheus-k8s-openshift-monitoring.apps.shubh-ceph.devcluster.openshift.com/";
    const url = `${promURL}/api/v1/alerts`;
    const poller = () => {
      coFetchJSON(url)
        .then(({ data }) => dataHandler(data))
        .catch(e => store.dispatch(UIActions.monitoringErrored(key, e)))
        .then(() => (pollerTimeouts[key] = setTimeout(poller, REFRESH_TIMEOUT)));
    };
    poller();
  }

  componentDidMount() {
    this.fetchPrometheusQuery(CEPH_STATUS, "status", response =>
      this.fetchHealth(response, this.setHealthData)
    );
    this.fetchPrometheusQuery(DATA_RESILIENCY_QUERY, "dataResiliency", response =>
      this.fetchDataResiliency(response, this.setDataResiliency)
    )
    this.poll("alerts", this.setAlertData);

    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_TOTAL_QUERY, "capacityTotal", response => this.setCapacityData('capacityTotal', response));
    this.fetchPrometheusQuery(STORAGE_CEPH_CAPACITY_USED_QUERY, "capacityUsed", response => this.setCapacityData('capacityUsed', response));
  }
  componentWillUnmount() {
    _.each(pollerTimeouts, t => clearTimeout(t));
  }

  render() {
    const { ocsHealthData, ocsAlertData, capacityData, dataResiliencyData } = this.state;
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          ocsAlertData,
          ...dataResiliencyData,
          ...capacityData,
          eventsData: {
            Component: OverviewEventStream,
            loaded: true,
          },

        }
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
      </WithResources >
    );
  }
}
