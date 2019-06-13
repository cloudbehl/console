import { K8sKind } from '@console/internal/module/k8s';

export const CephClusterModel: K8sKind = {
  label: 'Ceph Cluster',
  labelPlural: 'Ceph Clusters',
  apiVersion: 'v1',
  path: 'cephclusters',
  apiGroup: 'ceph.rook.io',
  plural: 'cephclusters',
  abbr: 'CC',
  namespaced: true,
  kind: 'CephCluster',
  id: 'cephcluster',
  crd: true,
};
