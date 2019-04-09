import React from 'react';
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

const CEPH_STATUS = 'ceph_health_status';
const CEPH_PG_ACTIVE = 'ceph_pg_active';
const CEPH_PG_TOTAL = 'ceph_pg_total';

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
      dataResiliencyData: {},
    };
    this.setHealthData = this._setHealthData.bind(this);
    this.setDataResiliencyData = this._setDataResiliencyData.bind(this);
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

  _setDataResiliencyData(key, response) {
    this.setState(state => ({
      dataResiliencyData: {
        ...state.dataResiliencyData,
        [key]: response,
      },
    }));
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
    this.fetchPrometheusQuery(CEPH_STATUS, this.setHealthData);

    this.fetchPrometheusQuery(CEPH_PG_ACTIVE, response => this.setDataResiliencyData('activePgRaw', response));
    this.fetchPrometheusQuery(CEPH_PG_TOTAL, response => this.setDataResiliencyData('totalPgRaw', response));
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { ocsHealthData, dataResiliencyData } = this.state;
    const inventoryResourceMapToProps = resources => {
      return {
        value: {
          LoadingComponent: LoadingInline,
          ...resources,
          ocsHealthData,
          ...dataResiliencyData,
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
