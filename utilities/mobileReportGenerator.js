import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

export async function generateMobileExcelReport(results) {
  const workbook = new ExcelJS.Workbook();
  const reportPath = path.resolve('excel/React_native_E2E_Report.xlsx');
  
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  // Sheet 1 - Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 35 }
  ];
  summarySheet.addRows([
    { metric: 'Execution Date', value: new Date().toLocaleString() },
    { metric: 'Device Name', value: process.env.ANDROID_DEVICE_NAME || 'Android Emulator (Pixel 6)' },
    { metric: 'Android Version', value: process.env.ANDROID_VERSION || 'Android 14 (API 34)' },
    { metric: 'Total Tests', value: results.total },
    { metric: 'Passed', value: results.passed },
    { metric: 'Failed', value: results.failed },
    { metric: 'Skipped', value: results.skipped },
    { metric: 'Pass Percentage', value: `${((results.passed / (results.total || 1)) * 100).toFixed(2)}%` },
    { metric: 'Duration', value: `${results.durationMs} ms` }
  ]);

  // Sheet 2 - Test Cases
  const tcSheet = workbook.addWorksheet('Test Cases');
  tcSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Scenario', key: 'scenario', width: 45 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Device', key: 'device', width: 25 },
    { header: 'Duration (ms)', key: 'duration', width: 15 }
  ];
  (results.tests || []).forEach(t => tcSheet.addRow(t));

  // Sheet 3 - Failed Tests
  const failSheet = workbook.addWorksheet('Failed Tests');
  failSheet.columns = [
    { header: 'Test Name', key: 'name', width: 30 },
    { header: 'Failure Reason', key: 'reason', width: 50 },
    { header: 'Screenshot Path', key: 'screenshot', width: 40 },
    { header: 'Device', key: 'device', width: 20 },
    { header: 'Android Version', key: 'version', width: 20 }
  ];
  (results.failures || []).forEach(f => failSheet.addRow(f));

  // Sheet 4 - Execution Logs
  const logSheet = workbook.addWorksheet('Execution Logs');
  logSheet.columns = [
    { header: 'Timestamp', key: 'time', width: 25 },
    { header: 'Test Name', key: 'test', width: 30 },
    { header: 'Step', key: 'step', width: 40 },
    { header: 'Result', key: 'result', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];
  (results.logs || []).forEach(l => logSheet.addRow(l));

  await workbook.xlsx.writeFile(reportPath);
  logger.info(`Excel Mobile E2E Report saved to: ${reportPath}`);
}

export function generateMobileHtmlReport(results) {
  const htmlPath = path.resolve('reports/mobile_index.html');
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React Native Appium Mobile Automation Report</title>
  <style>
    body { font-family: Inter, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    h1 { color: #38bdf8; }
    .badge { padding: 4px 12px; border-radius: 4px; font-weight: bold; }
    .pass { background: #10b981; color: white; }
    .fail { background: #ef4444; color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; }
    th { background: #334155; }
  </style>
</head>
<body>
  <div class="card">
    <h1>CareBridge React Native Mobile Automation Report</h1>
    <p>Device: ${process.env.ANDROID_DEVICE_NAME || 'Android Emulator (Pixel 6)'} | Version: ${process.env.ANDROID_VERSION || 'Android 14'}</p>
    <p>Total: <strong>${results.total}</strong> | Passed: <span class="badge pass">${results.passed}</span> | Failed: <span class="badge fail">${results.failed}</span></p>
  </div>
  <div class="card">
    <h2>Execution Results</h2>
    <table>
      <thead>
        <tr><th>Test ID</th><th>Scenario</th><th>Status</th><th>Duration</th></tr>
      </thead>
      <tbody>
        ${(results.tests || []).map(t => `<tr><td>${t.id}</td><td>${t.scenario}</td><td><span class="badge ${t.status === 'PASSED' ? 'pass' : 'fail'}">${t.status}</span></td><td>${t.duration}ms</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');
  logger.info(`HTML Mobile Report saved to: ${htmlPath}`);
}
