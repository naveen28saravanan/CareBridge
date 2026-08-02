import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../");

// Start a local server if TEST_APP_URL is not overridden
let serverProcess = null;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerUp(url, retries = 15, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const { default: http } = await import("node:http");
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          resolve(res.statusCode);
        });
        req.on("error", reject);
        req.setTimeout(800, () => { req.destroy(); reject(new Error("timeout")); });
      });
      return true;
    } catch {
      await wait(delayMs);
    }
  }
  return false;
}

async function setReactInput(driver, element, value) {
  await driver.executeScript((el, val) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (el._valueTracker) {
      el._valueTracker.setValue('');
    }
    nativeInputValueSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, element, value);
}

describe("CareBridge E2E Selenium Test Suite", function () {
  this.timeout(90000);
  let driver;
  const appUrl = process.env.TEST_APP_URL || "http://localhost:4173/CareBridge/";

  before(async function () {
    // Start the preview server if not already running
    if (!process.env.TEST_APP_URL) {
      serverProcess = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--port", "4173", "--host", "0.0.0.0"], {
        cwd: root,
        stdio: "pipe",
        detached: false,
      });
      serverProcess.stderr?.on("data", () => {});
      serverProcess.stdout?.on("data", () => {});

      const up = await isServerUp("http://localhost:4173/CareBridge/");
      if (!up) throw new Error("Preview server did not start in time.");
    }

    // Build Chrome driver
    const options = new chrome.Options();
    options.addArguments("--headless=new");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--window-size=1280,900");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) await driver.quit();
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
      await wait(500);
    }
  });

  it("should load the login page and show the email input", async function () {
    await driver.get(appUrl);
    const emailInput = await driver.wait(until.elementLocated(By.id("email")), 20000);
    const displayed = await emailInput.isDisplayed();
    if (!displayed) throw new Error("Email input not visible.");
  });

  it("should authenticate as patient and reach the dashboard", async function () {
    await driver.get(appUrl);
    await driver.executeScript("sessionStorage.clear(); localStorage.clear();");
    await driver.navigate().refresh();

    const emailInput = await driver.wait(until.elementLocated(By.id("email")), 20000);
    const passwordInput = await driver.findElement(By.id("password"));
    const loginButton = await driver.findElement(By.id("login-button"));

    await setReactInput(driver, emailInput, "patient@carebridge.demo");
    await setReactInput(driver, passwordInput, "Patient@123");

    await loginButton.click();

    try {
      // After login, the topbar of the dashboard should appear
      await driver.wait(until.elementLocated(By.className("topbar")), 10000);
    } catch (err) {
      const errElem = await driver.findElements(By.className("auth-error"));
      if (errElem.length > 0) {
        const txt = await errElem[0].getText();
        console.log("Auth error text on page:", txt);
      }
      try {
        const logs = await driver.manage().logs().get("browser");
        console.log("Browser console logs:", logs.map((l) => l.message));
      } catch {}
      throw err;
    }
  });

  it("should show the sidebar navigation after login", async function () {
    // Dashboard already loaded from previous test; verify sidebar is present
    const sidebar = await driver.wait(until.elementLocated(By.className("sidebar")), 10000);
    const displayed = await sidebar.isDisplayed();
    if (!displayed) throw new Error("Sidebar not visible after login.");
  });

  it("should display Continue with Google for Doctor and Operations roles", async function () {
    await driver.executeScript("localStorage.clear(); sessionStorage.clear();");
    await driver.get(appUrl);
    
    // Check patient tab Google button
    let googleBtn = await driver.wait(until.elementLocated(By.className("provider-button--google")), 10000);
    if (!(await googleBtn.isDisplayed())) throw new Error("Google button not visible for Patient role.");

    // Switch to Doctor role and check Google button
    const buttons = await driver.findElements(By.css(".auth-role-grid button"));
    if (buttons.length >= 2) {
      await buttons[1].click(); // Doctor
      googleBtn = await driver.wait(until.elementLocated(By.className("provider-button--google")), 5000);
      if (!(await googleBtn.isDisplayed())) throw new Error("Google button not visible for Doctor role.");
    }

    // Switch to Operations role and check Google button
    if (buttons.length >= 3) {
      await buttons[2].click(); // Operations
      googleBtn = await driver.wait(until.elementLocated(By.className("provider-button--google")), 5000);
      if (!(await googleBtn.isDisplayed())) throw new Error("Google button not visible for Operations role.");
    }
  });
});
