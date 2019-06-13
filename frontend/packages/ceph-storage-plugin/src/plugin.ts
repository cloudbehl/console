import * as _ from 'lodash-es';

import { Plugin, ModelFeatureFlag, ModelDefinition } from '@console/plugin-sdk';

import * as models from './models';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition;

const CEPH_FLAG = 'CEPH';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.CephClusterModel,
      flag: CEPH_FLAG,
    },
  },
];

export default plugin;
