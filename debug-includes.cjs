// debug-rsc-error.cjs
const fs = require('fs');
const path = require('path');

console.log('Searching for potential RSC errors...\n');

let totalFiles = 0;
let issuesFound = 0;

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    totalFiles++;
    
    lines.forEach((line, index) => {
      // Look for patterns that might cause the RSC error
      // The error mentions "can't access property includes, i is undefined"
      // So we're looking for: something.includes where something could be undefined
      
      // Pattern 1: Direct property access followed by .includes
      if (line.match(/(\w+)\.includes\(/)) {
        const beforeIncludes = line.substring(0, line.indexOf('.includes'));
        const hasOptionalChaining = beforeIncludes.includes('?.');
        const hasNullCheck = beforeIncludes.includes('&&') || beforeIncludes.includes('||');
        const hasIfStatement = /if\s*\(/.test(beforeIncludes);
        
        if (!hasOptionalChaining && !hasNullCheck && !hasIfStatement) {
          console.log(`📍 ${filePath}:${index + 1}`);
          console.log(`   ${line.trim()}`);
          console.log(`   ⚠️  Potential unsafe .includes() call`);
          console.log('');
          issuesFound++;
        }
      }
      
      // Pattern 2: Array/object access followed by .includes
      if (line.match(/\[.*?\]\.includes\(/)) {
        console.log(`📍 ${filePath}:${index + 1}`);
        console.log(`   ${line.trim()}`);
        console.log(`   ⚠️  Array/object access followed by .includes()`);
        console.log('');
        issuesFound++;
      }
      
      // Pattern 3: Function call result followed by .includes
      if (line.match(/\)\.includes\(/)) {
        const beforeIncludes = line.substring(0, line.lastIndexOf(').includes'));
        if (!beforeIncludes.includes('?.') && !beforeIncludes.includes('||')) {
          console.log(`📍 ${filePath}:${index + 1}`);
          console.log(`   ${line.trim()}`);
          console.log(`   ⚠️  Function result followed by .includes()`);
          console.log('');
          issuesFound++;
        }
      }
      
      // Pattern 4: Check for navigation-related patterns
      if (line.includes('navigation') || line.includes('router') || line.includes('pathname')) {
        if (line.includes('.includes(') || line.includes('.startsWith(')) {
          const hasOptionalChaining = line.includes('?.');
          if (!hasOptionalChaining) {
            console.log(`📍 ${filePath}:${index + 1}`);
            console.log(`   ${line.trim()}`);
            console.log(`   ⚠️  Navigation-related string method without optional chaining`);
            console.log('');
            issuesFound++;
          }
        }
      }
    });
  } catch (error) {
    // Ignore read errors
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip certain directories
      const skipDirs = [
        'node_modules',
        '.next',
        '.git',
        'dist',
        'build',
        'coverage',
        '.turbo',
        '.vercel',
        'public',
        '.github'
      ];
      
      if (stat.isDirectory() && !skipDirs.includes(file) && !file.startsWith('.')) {
        walkDir(filePath);
      } else if (stat.isFile()) {
        // Check TypeScript and JavaScript files
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const ext = path.extname(file);
        
        if (extensions.includes(ext) && !file.endsWith('.d.ts') && !file.includes('.test.') && !file.includes('.spec.')) {
          checkFile(filePath);
        }
      }
    });
  } catch (error) {
    // Ignore directory read errors
  }
}

// Additional check for Next.js App Router specific patterns
function checkAppRouterPatterns() {
  console.log('\nChecking for Next.js App Router specific patterns...\n');
  
  const appDir = path.join(process.cwd(), 'app');
  const srcAppDir = path.join(process.cwd(), 'src', 'app');
  
  const checkDir = fs.existsSync(appDir) ? appDir : fs.existsSync(srcAppDir) ? srcAppDir : null;
  
  if (checkDir) {
    checkLayoutAndPageFiles(checkDir);
  }
}

function checkLayoutAndPageFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkLayoutAndPageFiles(filePath);
      } else if (file === 'layout.tsx' || file === 'layout.js' || file === 'page.tsx' || file === 'page.js') {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for params usage
        if (content.includes('params.') || content.includes('searchParams.')) {
          console.log(`📌 Route file with params: ${filePath}`);
          
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('params.') && line.includes('.includes(')) {
              console.log(`   Line ${index + 1}: ${line.trim()}`);
              console.log(`   ⚠️  Params property access with .includes()`);
            }
          });
        }
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

// Start scanning
console.log('Starting comprehensive RSC error scan...\n');
walkDir(process.cwd());

console.log(`\n✅ Scanned ${totalFiles} files`);
console.log(`${issuesFound > 0 ? '⚠️' : '✅'} Found ${issuesFound} potential issues\n`);

// Check for App Router patterns
checkAppRouterPatterns();

// Check package.json for Next.js version
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('\nNext.js version:', packageJson.dependencies?.next || 'Not found');
  console.log('React version:', packageJson.dependencies?.react || 'Not found');
} catch (error) {
  console.log('\nCould not read package.json');
}

console.log('\n💡 Tip: The RSC error with minified variable "i" often comes from:');
console.log('   1. Navigation guards in middleware');
console.log('   2. Translation/i18n providers');
console.log('   3. Auth providers or route protection');
console.log('   4. Third-party libraries that interact with Next.js routing\n');