import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

describe("CareBridge E2E Selenium Test Suite", function () {
  this.timeout(60000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--headless=new");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it("should load the login page and authenticate successfully", async function () {
    const appUrl = process.env.TEST_APP_URL || "http://localhost:4173/CareBridge/";
    await driver.get(appUrl);

    // Wait for the login screen to render
    const emailInput = await driver.wait(until.elementLocated(By.id("email")), 15000);
    const passwordInput = await driver.findElement(By.id("password"));
    const loginButton = await driver.findElement(By.id("login-button"));

    // Enter login credentials
    await emailInput.clear();
    await emailInput.sendKeys("patient@carebridge.demo");

    await passwordInput.clear();
    await passwordInput.sendKeys("Patient@123");

    // Click login button
    await loginButton.click();

    // Verify successful authentication by checking page transition
    await driver.wait(until.elementLocated(By.className("topbar")), 15000);
  });
});
