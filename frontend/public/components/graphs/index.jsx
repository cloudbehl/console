import * as React from 'react';

import { AsyncComponent } from '../utils/async';

export { Status } from './status';

export const Bar = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Line)} {...props} />;
export const Scalar = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Scalar)} {...props} />;
