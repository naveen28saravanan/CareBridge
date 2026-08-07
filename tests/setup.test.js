import driverManager from '../utilities/driverManager.js';
import generateExcelReport, { setSuiteStartTime, recordTestCaseResult } from '../utilities/excelReporter.js';
import handleTestFailure from '../utilities/failureHandler.js';
import logger, { logStep } from '../utilities/logger.js';
import config from '../config/env.config.js';

export const mochaHooks = {
  async beforeAll() {
    setSuiteStartTime(new Date());
    logger.info('================================================================');
    logger.info('   CAREBRIDGE E2E ENTERPRISE AUTOMATION SUITE STARTED           ');
    logger.info(`   Target Base URL: ${config.baseUrl}`);
    logger.info(`   Browser: ${config.browser} (Headless: ${config.headless})`);
    logger.info('================================================================');
  },

  async beforeEach() {
    this.testStartTime = new Date();
  },

  async afterEach() {
    const testTitle = this.currentTest.fullTitle();
    const duration = Math.round((new Date() - this.testStartTime) / 1000);
    const testState = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    
    // Extract module name from suite
    const moduleName = this.currentTest.parent ? this.currentTest.parent.title : 'General';
    const testId = `TC-${Math.floor(1000 + Math.random() * 9000)}`;

    if (testState === 'FAILED') {
      const driver = driverManager.driver;
      const error = this.currentTest.err || new Error('Test failed with unknown error');
      await handleTestFailure(driver, testTitle, error, config.browser);
      logStep(testTitle, 'Test Execution', 'FAILED', error.message);
    } else {
      logStep(testTitle, 'Test Execution', 'PASSED', 'Completed successfully');
    }

    recordTestCaseResult({
      id: testId,
      module: moduleName,
      scenarioName: this.currentTest.title,
      browser: config.browser,
      status: testState,
      startTime: this.testStartTime.toLocaleTimeString(),
      endTime: new Date().toLocaleTimeString(),
      duration: `${duration}s`
    });
  },

  async afterAll() {
    logger.info('Closing driver instance...');
    await driverManager.quitDriver();

    logger.info('Generating final Excel report (E2E_Report.xlsx)...');
    try {
      const reportPath = await generateExcelReport();
      logger.info(`E2E_Report.xlsx successfully saved to: ${reportPath}`);
    } catch (err) {
      logger.error(`Error generating Excel report: ${err.message}`);
    }

    logger.info('================================================================');
    logger.info('   CAREBRIDGE E2E ENTERPRISE AUTOMATION SUITE FINISHED          ');
    logger.info('================================================================');
  }
};
