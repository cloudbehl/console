import * as _ from 'lodash-es';

import {
  Plugin,
  ModelFeatureFlag,
  ModelDefinition,
  HrefNavItem,
  RoutePage,
  TabItem
} from '@console/plugin-sdk';

import { CephClusterModel } from './models';
import { StorageDashboard } from './components/dashboards/storage-dashboard'

type ConsumedExtensions =
  | RoutePage
  | HrefNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | TabItem;

const CEPH_FLAG = 'CEPH';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: [CephClusterModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: CephClusterModel,
      flag: CEPH_FLAG,
    },
  },
  {
    type: 'TabItem/HorizontalNav',
    properties: {
      componentProps: {
        match: {
          isExact: false,
          url: '/dashboards',
          path: '/dashboards',
        },
        pages: [{
          name: "Storage",
          href: 'storage-dashboard',
          component: StorageDashboard
        }]
      },
    },
  },
];

export default plugin;
