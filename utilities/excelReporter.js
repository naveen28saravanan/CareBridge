import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import logger, { executionLogs } from './logger.js';
import { failedTestRecords } from './failureHandler.js';
import config from '../config/env.config.js';

const excelDir = path.resolve('excel');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

export const completedTestCases = [];
let suiteStartTime = new Date();

export function setSuiteStartTime(time) {
  suiteStartTime = time;
}

export function recordTestCaseResult(testCase) {
  // testCase: { id, module, scenarioName, browser, status, startTime, endTime, duration }
  completedTestCases.push(testCase);
}

export async function generateExcelReport() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CareBridge QA Automation Architect';
  workbook.lastModifiedBy = 'Automated CI/CD Pipeline';
  workbook.created = new Date();

  // Header styling options
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // -------------------------------------------------------------
  // Sheet 1: Summary
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  summarySheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const total = completedTestCases.length;
  const passed = completedTestCases.filter((t) => t.status === 'PASSED').length;
  const failed = completedTestCases.filter((t) => t.status === 'FAILED').length;
  const skipped = completedTestCases.filter((t) => t.status === 'SKIPPED').length;
  const passPercentage = total > 0 ? `${((passed / total) * 100).toFixed(2)}%` : '0%';
  const durationSec = Math.round((new Date() - suiteStartTime) / 1000);

  const summaryData = [
    { metric: 'Execution Date', value: new Date().toLocaleString() },
    { metric: 'Environment', value: config.baseUrl },
    { metric: 'Target Browser', value: config.browser },
    { metric: 'Headless Mode', value: String(config.headless) },
    { metric: 'Total Tests', value: total },
    { metric: 'Passed', value: passed },
    { metric: 'Failed', value: failed },
    { metric: 'Skipped', value: skipped },
    { metric: 'Pass Percentage', value: passPercentage },
    { metric: 'Execution Duration', value: `${durationSec} seconds` }
  ];

  summaryData.forEach((row) => summarySheet.addRow(row));

  // -------------------------------------------------------------
  // Sheet 2: Test Cases
  // -------------------------------------------------------------
  const testCasesSheet = workbook.addWorksheet('Test Cases');
  testCasesSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Scenario Name', key: 'scenarioName', width: 45 },
    { header: 'Browser', key: 'browser', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Start Time', key: 'startTime', width: 22 },
    { header: 'End Time', key: 'endTime', width: 22 },
    { header: 'Duration', key: 'duration', width: 15 }
  ];
  testCasesSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  completedTestCases.forEach((t) => {
    const row = testCasesSheet.addRow(t);
    const statusCell = row.getCell('status');
    if (t.status === 'PASSED') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
      statusCell.font = { color: { argb: '065F46' }, bold: true };
    } else if (t.status === 'FAILED') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      statusCell.font = { color: { argb: '991B1B' }, bold: true };
    }
  });

  // -------------------------------------------------------------
  // Sheet 3: Failed Tests
  // -------------------------------------------------------------
  const failedSheet = workbook.addWorksheet('Failed Tests');
  failedSheet.columns = [
    { header: 'Test Name', key: 'testName', width: 40 },
    { header: 'Failure Reason', key: 'failureReason', width: 45 },
    { header: 'Screenshot Path', key: 'screenshotPath', width: 50 },
    { header: 'Browser', key: 'browser', width: 15 },
    { header: 'URL', key: 'url', width: 40 }
  ];
  failedSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  if (failedTestRecords.length === 0) {
    failedSheet.addRow({
      testName: 'N/A',
      failureReason: 'No failures recorded during execution. All tests passed successfully!',
      screenshotPath: 'N/A',
      browser: config.browser,
      url: config.baseUrl
    });
  } else {
    failedTestRecords.forEach((record) => failedSheet.addRow(record));
  }

  // -------------------------------------------------------------
  // Sheet 4: Execution Logs
  // -------------------------------------------------------------
  const logsSheet = workbook.addWorksheet('Execution Logs');
  logsSheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Test Name', key: 'testName', width: 35 },
    { header: 'Step Description', key: 'stepDescription', width: 45 },
    { header: 'Result', key: 'result', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 35 }
  ];
  logsSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  executionLogs.forEach((log) => logsSheet.addRow(log));

  const filePath = path.join(excelDir, 'E2E_Report.xlsx');
  await workbook.xlsx.writeFile(filePath);
  logger.info(`Excel E2E Report generated successfully at ${filePath}`);
  return filePath;
}

export default generateExcelReport;
