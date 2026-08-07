import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const failuresDir = path.resolve('reports/failures');
if (!fs.existsSync(failuresDir)) {
  fs.mkdirSync(failuresDir, { recursive: true });
}

export const failedTestRecords = [];

export async function handleTestFailure(driver, testTitle, error, browserName = 'chrome') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const screenshotFileName = `FAILURE_${sanitizedTitle}_${timestamp}.png`;
  const screenshotPath = path.join(failuresDir, screenshotFileName);
  
  let currentUrl = 'N/A';
  let consoleLogs = [];

  if (driver) {
    try {
      currentUrl = await driver.getCurrentUrl();
      const image = await driver.takeScreenshot();
      fs.writeFileSync(screenshotPath, image, 'base64');
      logger.info(`Failure screenshot saved: ${screenshotPath}`);

      try {
        consoleLogs = await driver.manage().logs().get('browser');
      } catch (logErr) {
        // Driver might not support browser logging in headless edge/firefox
      }
    } catch (takeErr) {
      logger.error(`Failed to capture screenshot or URL: ${takeErr.message}`);
    }
  }

  const logDumpFileName = `LOGS_${sanitizedTitle}_${timestamp}.json`;
  const logDumpPath = path.join(failuresDir, logDumpFileName);
  fs.writeFileSync(logDumpPath, JSON.stringify({
    testTitle,
    error: error.message,
    stack: error.stack,
    currentUrl,
    consoleLogs,
    timestamp
  }, null, 2));

  const failureRecord = {
    testName: testTitle,
    failureReason: error.message,
    screenshotPath: screenshotPath,
    browser: browserName,
    url: currentUrl,
    stackTrace: error.stack
  };
  failedTestRecords.push(failureRecord);

  logger.error(`TEST FAILED: ${testTitle}`);
  logger.error(`Reason: ${error.message}`);
  logger.error(`URL: ${currentUrl}`);

  return failureRecord;
}

export default handleTestFailure;
