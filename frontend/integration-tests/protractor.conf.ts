/* eslint-disable no-undef, no-unused-vars */

import { Config, browser, logging } from 'protractor';
import { execSync } from 'child_process';
import * as HtmlScreenshotReporter from 'protractor-jasmine2-screenshot-reporter';
import * as _ from 'lodash';
import { TapReporter, JUnitXmlReporter } from 'jasmine-reporters';
import * as ConsoleReporter from 'jasmine-console-reporter';
import * as failFast from 'protractor-fail-fast';
import { createWriteStream } from 'fs';
import { format } from 'util';

const tap = !!process.env.TAP;

export const BROWSER_TIMEOUT = 15000;
export const appHost = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(process.env.BRIDGE_BASE_PATH || '/').replace(/\/$/, '')}`;
export const testName = `test-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;

const htmlReporter = new HtmlScreenshotReporter({ dest: './gui_test_screenshots', inlineImages: true, captureOnlyFailedSpecs: true, filename: 'test-gui-report.html' });
const junitReporter = new JUnitXmlReporter({ savePath: './gui_test_screenshots', consolidateAll: true });
const browserLogs: logging.Entry[] = [];

const plugins = [];
if (process.env.FAIL_FAST === 'true') {
  plugins.push(failFast.init());
}

export const config: Config = {
  framework: 'jasmine',
  directConnect: true,
  skipSourceMapSupport: true,
  jasmineNodeOpts: {
    print: () => null,
    defaultTimeoutInterval: 40000,
  },
  logLevel: tap ? 'ERROR' : 'INFO',
  plugins,
  capabilities: {
    browserName: 'chrome',
    acceptInsecureCerts: true,
    chromeOptions: {
      args: [
        '--disable-gpu',
        '--headless',
        '--no-sandbox',
        '--window-size=1920,1200',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-raf-throttling',
      ],
      prefs: {
        'profile.password_manager_enabled': false,
        'credentials_enable_service': false,
        'password_manager_enabled': false,
      },
    },
  },
  beforeLaunch: () => new Promise(resolve => htmlReporter.beforeLaunch(resolve)),
  onPrepare: () => {
    browser.waitForAngularEnabled(false);
    jasmine.getEnv().addReporter(htmlReporter);
    jasmine.getEnv().addReporter(junitReporter);
    if (tap) {
      jasmine.getEnv().addReporter(new TapReporter());
    } else {
      jasmine.getEnv().addReporter(new ConsoleReporter());
    }
  },
  onComplete: async() => {
    const consoleLogStream = createWriteStream('gui_test_screenshots/browser.log', { flags: 'a' });
    browserLogs.forEach(log => {
      const { level, message } = log;
      const messageStr = _.isArray(message) ? message.join(' ') : message;
      consoleLogStream.write(`${format.apply(null, [`[${level.name}]`, messageStr])}\n`);
    });

    const url = await browser.getCurrentUrl();
    console.log('Last browser URL: ', url);

    // Use projects if OpenShift so non-admin users can run tests. We need the fully-qualified name
    // since we're using kubectl instead of oc.
    const resource = browser.params.openshift === 'true' ? 'projects.project.openshift.io' : 'namespaces';
    await browser.close();
    execSync(`kubectl delete ${resource} ${testName}`);
  },
  afterLaunch: (exitCode) => {
    failFast.clean();
    return new Promise(resolve => htmlReporter.afterLaunch(resolve.bind(this, exitCode)));
  },
  suites: {
    filter: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/filter.scenario.ts',
    ],
    annotation: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/modal-annotations.scenario.ts',
    ],
    environment: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/environment.scenario.ts',
    ],
    secrets: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/secrets.scenario.ts',
    ],
    crud: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/crud.scenario.ts',
      'tests/secrets.scenario.ts',
      'tests/filter.scenario.ts',
      'tests/modal-annotations.scenario.ts',
      'tests/environment.scenario.ts',
    ],
    monitoring: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/monitoring.scenario.ts',
    ],
    newApp: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/overview/overview.scenario.ts',
      'tests/source-to-image.scenario.ts',
      'tests/deploy-image.scenario.ts',
    ],
    olm: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/olm/descriptors.scenario.ts',
      'tests/olm/catalog.scenario.ts',
      'tests/olm/single-installmode.scenario.ts',
      'tests/olm/global-installmode.scenario.ts',
    ],
    olmUpgrade: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/olm/update-channel-approval.scenario.ts',
    ],
    operatorHub: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/operator-hub/operator-hub.scenario.ts',
    ],
    // OLM and OperatorHub
    olmFull: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/operator-hub/operator-hub.scenario.ts',
      'tests/olm/descriptors.scenario.ts',
      'tests/olm/catalog.scenario.ts',
      'tests/olm/single-installmode.scenario.ts',
      'tests/olm/global-installmode.scenario.ts',
    ],
    performance: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/performance.scenario.ts',
    ],
    serviceCatalog: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/service-catalog/service-catalog.scenario.ts',
      'tests/service-catalog/service-broker.scenario.ts',
      'tests/service-catalog/service-class.scenario.ts',
      'tests/service-catalog/service-binding.scenario.ts',
      'tests/developer-catalog.scenario.ts',
    ],
    overview: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/overview/overview.scenario.ts',
    ],
    kubevirt: [
      'tests/base.scenario.ts',
      'tests/kubevirt/vm.wizard.scenario.ts',
      'tests/kubevirt/vm.actions.scenario.ts',
      'tests/kubevirt/template.wizard.scenario.ts'
    ],
    e2e: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/crud.scenario.ts',
      'tests/secrets.scenario.ts',
      'tests/filter.scenario.ts',
      'tests/modal-annotations.scenario.ts',
      'tests/environment.scenario.ts',
      'tests/overview/overview.scenario.ts',
      'tests/source-to-image.scenario.ts',
      'tests/deploy-image.scenario.ts',
      'tests/performance.scenario.ts',
    ],
    all: [
      'tests/login.scenario.ts',
      'tests/base.scenario.ts',
      'tests/crud.scenario.ts',
      'tests/overview/overview.scenareio.ts',
      'tests/secrets.scenario.ts',
      'tests/olm/**/*.scenario.ts',
      'tests/service-catalog/**/*.scenario.ts',
      'tests/filter.scenario.ts',
      'tests/modal-annotations.scenario.ts',
      'tests/source-to-image.scenario.ts',
      'tests/deploy-image.scenario.ts',
      'tests/operator-hub/operator-hub.scenario.ts',
      'tests/developer-catalog.scenario.ts',
    ],
    login: [
      'tests/login.scenario.ts',
    ],
  },
  params: {
    // Set to 'true' to enable OpenShift resources in the crud scenario.
    // Use a string rather than boolean so it can be specified on the command line:
    // $ yarn run test-gui --params.openshift true
    openshift: 'false',
    // Set to 'true' to enable Service Catalog resources in the crud scenario.
    servicecatalog: 'false',
  },
};

export const checkLogs = async() => (await browser.manage().logs().get('browser'))
  .map(log => {
    browserLogs.push(log);
    return log;
  });

function hasError() {
  return (window as any).windowError;
}
export const checkErrors = async() => await browser.executeScript(hasError).then(err => {
  if (err) {
    fail(`omg js error: ${err}`);
  }
});

export const waitForCount = (elementArrayFinder, expectedCount) => {
  return async() => {
    const actualCount = await elementArrayFinder.count();
    return expectedCount >= actualCount;
  };
};

export const waitForNone = (elementArrayFinder) => {
  return async() => {
    const count = await elementArrayFinder.count();
    return count === 0;
  };
};
