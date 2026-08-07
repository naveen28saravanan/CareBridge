import fs from 'fs';
import path from 'path';
import logger from './logger.js';

export class AiTestScanner {
  static scanReactWorkspace() {
    logger.info('[AI Mobile Scanner] Scanning React Native workspace source code for interactive widgets...');
    const srcDir = path.resolve('src');
    const widgets = [];

    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Match inputs, buttons, selects, accessibility labels
          const inputMatches = content.match(/<input[^>]+>/g) || [];
          const buttonMatches = content.match(/<button[^>]+>[\s\S]*?<\/button>/g) || [];
          const keyMatches = content.match(/key=\{["']([^"']+)["']\}/g) || [];

          inputMatches.forEach(inp => widgets.push({ file: path.basename(file), type: 'TextField / Input', code: inp }));
          buttonMatches.forEach(btn => widgets.push({ file: path.basename(file), type: 'Button / Touchable', code: btn.slice(0, 80) }));
          keyMatches.forEach(k => widgets.push({ file: path.basename(file), type: 'ValueKey / Key', code: k }));
        }
      }
    }

    scanDirectory(srcDir);
    logger.info(`[AI Mobile Scanner] Discovered ${widgets.length} interactive React Native widgets.`);
    return widgets;
  }

  static generateAutoScenarios(discoveredWidgets) {
    logger.info('[AI Mobile Scanner] Generating automated test scenarios from discovered widgets...');
    return [
      { id: 'AI-MOB-001', name: 'Auto-discovered Auth Input Fields Validation', count: discoveredWidgets.filter(w => w.type.includes('Input')).length },
      { id: 'AI-MOB-002', name: 'Auto-discovered Action Buttons Verification', count: discoveredWidgets.filter(w => w.type.includes('Button')).length },
      { id: 'AI-MOB-003', name: 'Auto-discovered Navigation Key Accessibility', count: discoveredWidgets.filter(w => w.type.includes('ValueKey')).length }
    ];
  }
}

export default AiTestScanner;
