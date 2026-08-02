import http from "node:http";

function test(path, method, body = {}, headers = {}) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 8787,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (chunk) => {
          buf += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, body: buf, headers: res.headers });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ error: err.message }));
    if (method === "POST") req.write(data);
    req.end();
  });
}

async function runDAST() {
  console.log("===============================================");
  console.log("CAREBRIDGE DAST LIVE API SECURITY TEST SUITE");
  console.log("===============================================");

  const r1 = await test("/api/auth/logout", "POST");
  console.log("[DAST 1] Logout without Bearer token:", r1.status, JSON.stringify(r1.body));

  const r2 = await test("/api/auth/whatsapp/request", "POST", { phone: "+919876543210" });
  console.log("[DAST 2] WhatsApp OTP request:", r2.status, JSON.stringify(r2.body));

  const r3 = await test("/api/auth/whatsapp/verify", "POST", { phone: "+919876543210", code: "999999" });
  console.log("[DAST 3] WhatsApp OTP invalid code:", r3.status, JSON.stringify(r3.body));

  const r4 = await test("/api/auth/whatsapp/verify", "POST", { phone: "+919876543210", code: "123456" });
  console.log("[DAST 4] WhatsApp DEV OTP backdoor test (123456):", r4.status, JSON.stringify(r4.body));

  const r5 = await test("/api/auth/email/login", "POST", { email: "admin' OR '1'='1", password: "password" });
  console.log("[DAST 5] SQL Injection in email login payload:", r5.status, JSON.stringify(r5.body));

  const r6 = await test("/api/auth/email/login", "POST", { email: "doctor@carebridge.demo", password: "Doctor@123", role: "operations" });
  console.log("[DAST 6] RBAC Role Mismatch (doctor -> operations):", r6.status, JSON.stringify(r6.body));

  console.log("===============================================");
}

runDAST();
