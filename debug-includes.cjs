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
      // Look for any string method calls
      const stringMethods = [
        'includes',
        'startsWith', 
        'endsWith',
        'indexOf',
        'split',
        'replace',
        'match',
        'search'
      ];
      
      stringMethods.forEach(method => {
        const regex = new RegExp(`\\.${method}\\s*\\(`, 'g');
        if (regex.test(line)) {
          // Check if it's preceded by optional chaining or null check
          const lineBeforeMethod = line.substring(0, line.indexOf(`.${method}`));
          const hasOptionalChaining = lineBeforeMethod.includes('?.');
          const hasNullCheck = lineBeforeMethod.includes('&&') || lineBeforeMethod.includes('||');
          const hasIfCheck = /if\s*\(/.test(lineBeforeMethod);
          const hasTernary = lineBeforeMethod.includes('?') && lineBeforeMethod.includes(':');
          
          // Also check if the variable might be undefined
          const variablePattern = /(\w+)\s*\.\s*includes/;
          const match = line.match(variablePattern);
          
          if (!hasOptionalChaining && !hasNullCheck && !hasIfCheck && !hasTernary) {
            console.log(`📍 ${filePath}:${index + 1}`);
            console.log(`   ${line.trim()}`);
            console.log(`   Method: .${method}()`);
            if (match) {
              console.log(`   Variable: ${match[1]}`);
            }
            console.log('');
            issuesFound++;
          }
        }
      });
    });
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
  }
}

function walkDir(dir, level = 0) {
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
        '.vercel'
      ];
      
      if (stat.isDirectory() && !skipDirs.includes(file) && !file.startsWith('.')) {
        walkDir(filePath, level + 1);
      } else if (stat.isFile()) {
        // Check TypeScript and JavaScript files
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const ext = path.extname(file);
        
        if (extensions.includes(ext) && !file.endsWith('.d.ts')) {
          checkFile(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }
}

// Start from current directory
console.log('Starting scan from current directory...\n');
walkDir('.');

console.log(`\n✅ Scanned ${totalFiles} files`);
console.log(`${issuesFound > 0 ? '⚠️' : '✅'} Found ${issuesFound} potential issues\n`);

// Also specifically check for Next.js specific issues
console.log('Checking for Next.js specific patterns...\n');

// Check for usePathname usage
function checkForPathnameUsage(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
        checkForPathnameUsage(filePath);
      } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('usePathname')) {
          console.log(`📌 File uses usePathname: ${filePath}`);
          
          // Check how pathname is used
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('pathname') && (line.includes('.includes') || line.includes('.startsWith'))) {
              console.log(`   Line ${index + 1}: ${line.trim()}`);
            }
          });
          console.log('');
        }
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

checkForPathnameUsage('.');