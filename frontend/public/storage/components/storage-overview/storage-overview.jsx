import React from "react";
import * as _ from "lodash-es";
import {
  StorageOverview as KubevirtStorageOverview,
  ClusterOverviewContext,
  getResource
} from "kubevirt-web-ui-components";

import {
  CephClusterModel,
  NodeModel,
  PodModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  VirtualMachineModel,
  VirtualMachineInstanceMigrationModel
} from "../../../models";

import { WithResources } from "../../../kubevirt/components/utils/withResources";
import { LoadingInline } from "../../../kubevirt/components/utils/okdutils";
import { coFetchJSON } from "../../../co-fetch";

const REFRESH_TIMEOUT = 5000;
const CEPH_ROOK_NAMESPACE = "openshift-storage";

const DATA_RESILIENCY_QUERY = "(ceph_pg_active/ ceph_pg_total)*100";
const CEPH_STATUS = "ceph_health_status";

const resourceMap = {
  nodes: {
    resource: getResource(NodeModel, { namespaced: false })
  },
  pods: {
    resource: getResource(PodModel, {
      namespace: CEPH_ROOK_NAMESPACE
    })
  },
  pvs: {
    resource: getResource(PersistentVolumeModel)
  },
  pvcs: {
    resource: getResource(PersistentVolumeClaimModel)
  },
  vms: {
    resource: getResource(VirtualMachineModel)
  },
  migrations: {
    resource: getResource(VirtualMachineInstanceMigrationModel)
  },
  cephCluster: {
    resource: getResource(CephClusterModel)
  }
};

export class StorageOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ocsHealthData: {
        data: {},
        loaded: false
      },
      dataResiliencyData: {
        data: {},
        loaded: false
      }
    };
    this.setHealthData = this._setHealthData.bind(this);
    this.setDemoDataResiliency = this._setDemoDataResiliency.bind(this);
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

  _setDemoDataResiliency(data) {
    this.setState({
      dataResiliencyData: {
        data: {
          progressPercentage: data
        },
        loaded: true
      }
    })
  }

  fetchHealth(response, callback) {
    const result = response.data.result;
    result.map(r => callback(r.value[1]));
  }

  demofetchDataResiliency(response,callback) {
    const result =  response.data.result;
    return result.map(r => callback(r.value[1]));
  }

  demofetchPrometheusQuery(callback) {
    const data = {
      status: "success",
      data: {
        resultType: "vector",
        result: [
          {
            metric: {
              __name__: "ceph_health_status",
              endpoint: "http-metrics",
              instance: "10.129.2.10:9283",
              job: "rook-ceph-mgr",
              namespace: "openshift-storage",
              pod: "rook-ceph-mgr-a-548667fb4f-6fv4g",
              service: "rook-ceph-mgr"
            },
            value: [1553701988.855, "1"]
          }
        ]
      }
    };
    callback(data);
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

  componentDidMount() {
    this._isMounted = true;

    this.fetchPrometheusQuery(CEPH_STATUS, response =>
      this.fetchHealth(response, this.setHealthData)
    );

    this.demofetchPrometheusQuery(response => 
        this.demofetchDataResiliency(response, this.setDemoDataResiliency)
      )
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { ocsHealthData } = this.state;
    const { dataResiliencyData } = this.state;
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          dataResiliencyData,
        }
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
