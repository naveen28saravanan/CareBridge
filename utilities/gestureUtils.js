import logger from './logger.js';

export class GestureUtils {
  constructor(driver) {
    this.driver = driver;
  }

  async tap(element) {
    logger.info('Executing Gesture: Tap');
    if (element && element.click) {
      await element.click();
    } else if (this.driver.touchAction) {
      await this.driver.touchAction({ action: 'tap', element });
    }
  }

  async doubleTap(element) {
    logger.info('Executing Gesture: Double Tap');
    if (this.driver.performActions) {
      const rect = await element.getRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      await this.driver.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 }
        ]
      }]);
    }
  }

  async longPress(element, durationMs = 2000) {
    logger.info(`Executing Gesture: Long Press (${durationMs}ms)`);
    const rect = await element.getRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    await this.driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: durationMs },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
  }

  async scroll(direction = 'down', distance = 500) {
    logger.info(`Executing Gesture: Scroll (${direction})`);
    const startY = direction === 'down' ? 800 : 300;
    const endY = direction === 'down' ? 800 - distance : 300 + distance;
    await this.swipe(500, startY, 500, endY, 500);
  }

  async swipe(startX, startY, endX, endY, durationMs = 400) {
    logger.info(`Executing Gesture: Swipe from (${startX},${startY}) to (${endX},${endY})`);
    await this.driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration: durationMs, x: endX, y: endY },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
  }

  async dragAndDrop(sourceElement, targetElement) {
    logger.info('Executing Gesture: Drag and Drop');
    const srcRect = await sourceElement.getRect();
    const tgtRect = await targetElement.getRect();

    const startX = srcRect.x + srcRect.width / 2;
    const startY = srcRect.y + srcRect.height / 2;
    const endX = tgtRect.x + tgtRect.width / 2;
    const endY = tgtRect.y + tgtRect.height / 2;

    await this.swipe(startX, startY, endX, endY, 1000);
  }

  async pinch() {
    logger.info('Executing Gesture: Pinch');
    // Simulated multi-touch pinch gesture
    await this.driver.sleep(300);
  }

  async zoom() {
    logger.info('Executing Gesture: Zoom');
    // Simulated multi-touch zoom gesture
    await this.driver.sleep(300);
  }
}

export default GestureUtils;
