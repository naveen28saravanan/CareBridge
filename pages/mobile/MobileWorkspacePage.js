import MobileBasePage from './MobileBasePage.js';

export class MobileWorkspacePage extends MobileBasePage {
  async navigateTab(tabName) {
    const tabSelector = `//*[@text="${tabName}" or contains(@text, "${tabName}")]`;
    await this.click(tabSelector);
  }

  async verifyWidgetPresent(widgetText) {
    const selector = `//*[@text="${widgetText}" or contains(@text, "${widgetText}")]`;
    return await this.isVisible(selector);
  }

  async performPullToRefresh() {
    await this.gestures.scroll('down', 600);
  }
}

export default MobileWorkspacePage;
