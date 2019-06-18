import {
  HorizontalNavProps,
} from '@console/internal/components/utils/horizontal-nav';

import { Extension } from './extension';

namespace ExtensionProperties {
  export interface TabItem {
    /** Props to pass to the corresponding `HorizontalNav` component. */
    componentProps: Pick<HorizontalNavProps, 'pages' | 'match'>;
  }
}

export interface TabItem extends Extension<ExtensionProperties.TabItem> {
  type: 'TabItem/HorizontalNav';
}

export const isTabItem = (e: Extension<any>): e is TabItem => {
  return e.type === 'TabItem/HorizontalNav';
};