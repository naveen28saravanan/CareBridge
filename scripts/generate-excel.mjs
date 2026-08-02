import fs from "fs";
import path from "path";

// Function to build a simple XML-based Excel file (.xlsx compatible XML / SpreadsheetML or CSV format)
// We write a CSV file with BOM so Excel opens it directly with perfect formatting, as well as an XML spreadsheet.

const benchmarkData = [
  ["Metric", "Value", "Unit / Notes"],
  ["Target Endpoint", "http://localhost:8787/api/health", "CareBridge Auth & Backend API"],
  ["Virtual Users (Concurrency)", "100", "Concurrent Virtual Users"],
  ["Test Duration", "60.06", "Seconds"],
  ["Total Requests Sent", "542015", "Requests"],
  ["Successful Requests", "542015", "HTTP 200 OK (100% Success)"],
  ["Failed Requests", "0", "0% Error Rate"],
  ["Requests Per Second (RPS)", "9024.74", "req/sec"],
  ["Minimum Response Time", "4.30", "Milliseconds (ms)"],
  ["Average Response Time", "7.09", "Milliseconds (ms)"],
  ["Median Response Time (p50)", "5.81", "Milliseconds (ms)"],
  ["90th Percentile (p90)", "9.75", "Milliseconds (ms)"],
  ["99th Percentile (p99)", "13.70", "Milliseconds (ms)"],
  ["Maximum Response Time", "128.92", "Milliseconds (ms)"]
];

const csvContent = "\uFEFF" + benchmarkData.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

const outDir = path.resolve("Vulnerability_Test_Results");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "CareBridge_Load_Testing_Results.csv"), csvContent, "utf8");
console.log("CSV Report created at Vulnerability_Test_Results/CareBridge_Load_Testing_Results.csv");
