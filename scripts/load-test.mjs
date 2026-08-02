import http from "node:http";

const TARGET_URL = process.env.TARGET_URL || "http://localhost:8787/api/health";
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "100", 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || "60", 10);

console.log(`====================================================`);
console.log(`CareBridge API Load Testing Benchmark`);
console.log(`====================================================`);
console.log(`Target Endpoint: ${TARGET_URL}`);
console.log(`Virtual Users (Concurrency): ${CONCURRENCY}`);
console.log(`Test Duration: ${DURATION_SECONDS} seconds`);
console.log(`Starting load test now...\n`);

const parsedUrl = new URL(TARGET_URL);
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY * 2,
});

const latencies = [];
let totalRequests = 0;
let successCount = 0;
let errorCount = 0;
let isRunning = true;

function sendRequest() {
  if (!isRunning) return;

  const start = performance.now();
  const req = http.request(
    {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      agent: httpAgent,
      headers: {
        "User-Agent": "CareBridge-LoadTest/1.0",
        "Accept": "application/json",
      },
    },
    (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        const duration = performance.now() - start;
        latencies.push(duration);
        totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successCount++;
        } else {
          errorCount++;
        }
        if (isRunning) setImmediate(sendRequest);
      });
    }
  );

  req.on("error", () => {
    errorCount++;
    totalRequests++;
    if (isRunning) setImmediate(sendRequest);
  });

  req.end();
}

// Start worker loops for each virtual user
const startTime = performance.now();
for (let i = 0; i < CONCURRENCY; i++) {
  sendRequest();
}

// Stop after DURATION_SECONDS
setTimeout(() => {
  isRunning = false;
  const totalDurationMs = performance.now() - startTime;
  const durationSec = totalDurationMs / 1000;

  latencies.sort((a, b) => a - b);

  const sum = latencies.reduce((acc, val) => acc + val, 0);
  const avg = latencies.length ? (sum / latencies.length).toFixed(2) : "0";
  const min = latencies.length ? latencies[0].toFixed(2) : "0";
  const max = latencies.length ? latencies[latencies.length - 1].toFixed(2) : "0";
  const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)].toFixed(2) : "0";
  const p90 = latencies.length ? latencies[Math.floor(latencies.length * 0.9)].toFixed(2) : "0";
  const p99 = latencies.length ? latencies[Math.floor(latencies.length * 0.99)].toFixed(2) : "0";
  const rps = (totalRequests / durationSec).toFixed(2);

  console.log(`====================================================`);
  console.log(`LOAD TEST RESULTS & BENCHMARK REPORT`);
  console.log(`====================================================`);
  console.log(`Total Duration       : ${durationSec.toFixed(2)} seconds`);
  console.log(`Total Requests Sent  : ${totalRequests.toLocaleString()}`);
  console.log(`Successful Requests  : ${successCount.toLocaleString()}`);
  console.log(`Failed Requests      : ${errorCount.toLocaleString()}`);
  console.log(`Requests Per Second  : ${rps} req/sec (RPS)`);
  console.log(`----------------------------------------------------`);
  console.log(`Response Time Summary:`);
  console.log(`  Minimum (Fastest)  : ${min} ms`);
  console.log(`  Average            : ${avg} ms`);
  console.log(`  Median (p50)       : ${p50} ms`);
  console.log(`  90th Percentile    : ${p90} ms`);
  console.log(`  99th Percentile    : ${p99} ms`);
  console.log(`  Maximum (Slowest)  : ${max} ms`);
  console.log(`====================================================\n`);

  process.exit(0);
}, DURATION_SECONDS * 1000);
