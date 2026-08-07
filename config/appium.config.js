import path from 'path';

export const appiumConfig = {
  server: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/',
  },
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:app': process.env.APK_PATH || path.resolve('./app/app-release.apk'),
    'appium:appPackage': process.env.APP_PACKAGE || 'com.carebridge.app',
    'appium:appActivity': process.env.APP_ACTIVITY || 'com.carebridge.app.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 300,
    'appium:noReset': false,
    'appium:fullReset': false,
  },
  reactNative: {
    finders: {
      byValueKey: (key) => `~${key}`,
      bySemanticsLabel: (label) => `//*[@content-desc="${label}"]`,
      byAccessibilityId: (id) => `~${id}`,
      byText: (text) => `//*[@text="${text}" or contains(@text, "${text}")]`,
    }
  }
};

export default appiumConfig;
