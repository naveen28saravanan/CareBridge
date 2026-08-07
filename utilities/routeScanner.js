import fs from 'fs';
import path from 'path';
import logger from './logger.js';

export function discoverRoutesAndForms() {
  const routesPath = path.resolve('data/routes.json');
  const formsPath = path.resolve('data/formData.json');

  let routesData = { roles: {} };
  let formData = {};

  if (fs.existsSync(routesPath)) {
    routesData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
  }
  if (fs.existsSync(formsPath)) {
    formData = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
  }

  // Auto-scan React source code to inspect dynamically declared input rules
  const srcDir = path.resolve('src');
  const dynamicFormRules = [];

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Scan for inputs with validation pattern, type, or placeholder
        const inputMatches = content.match(/<input[^>]+>/g) || [];
        inputMatches.forEach((inputTag) => {
          const typeMatch = inputTag.match(/type=["']([^"']+)["']/);
          const idMatch = inputTag.match(/id=["']([^"']+)["']/);
          const requiredMatch = inputTag.match(/\brequired\b/);
          const placeholderMatch = inputTag.match(/placeholder=["']([^"']+)["']/);
          const maxLengthMatch = inputTag.match(/maxLength=\{?(\d+)\}?/);
          
          dynamicFormRules.push({
            file,
            type: typeMatch ? typeMatch[1] : 'text',
            id: idMatch ? idMatch[1] : null,
            required: !!requiredMatch,
            placeholder: placeholderMatch ? placeholderMatch[1] : '',
            maxLength: maxLengthMatch ? parseInt(maxLengthMatch[1], 10) : null
          });
        });
      }
    }
  }

  scanDirectory(srcDir);
  logger.info(`RouteScanner discovered ${dynamicFormRules.length} dynamic form input rules from React source.`);

  return {
    routes: routesData,
    formData,
    discoveredRules: dynamicFormRules
  };
}

export default discoverRoutesAndForms;
