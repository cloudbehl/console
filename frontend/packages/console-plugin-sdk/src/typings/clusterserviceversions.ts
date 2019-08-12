import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ClusterServiceVersionAction {
    /** the kind this action is for */
    kind: string; // should be K8sKind probably
    /** label of action */
    label: string;
    /** action callback */
    callback: (kind, obj) => () => any;
  }
}

export interface ClusterServiceVersionAction
  extends Extension<ExtensionProperties.ClusterServiceVersionAction> {
  type: 'ClusterServiceVersion/Action';
}

export const isClusterServiceVersionAction = (
  e: Extension<any>,
): e is ClusterServiceVersionAction => e.type === 'ClusterServiceVersion/Action';
