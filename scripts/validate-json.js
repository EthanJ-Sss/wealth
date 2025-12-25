/**
 * JSON 格式验证脚本
 * 用于检测 JSON 文件中可能导致解析失败的特殊字符
 * 
 * 使用方法: node scripts/validate-json.js [文件路径]
 * 示例: node scripts/validate-json.js bazi_result.json
 */

const fs = require('fs');
const path = require('path');

// 可能导致 JSON 解析问题的字符 (使用 Unicode 编码)
const PROBLEMATIC_CHARS = {
  '\u201C': { name: '中文左双引号', code: 'U+201C', replacement: '\u300C' }, // " → 「
  '\u201D': { name: '中文右双引号', code: 'U+201D', replacement: '\u300D' }, // " → 」
  '\u2018': { name: '中文左单引号', code: 'U+2018', replacement: "'" },      // ' → '
  '\u2019': { name: '中文右单引号', code: 'U+2019', replacement: "'" },      // ' → '
  '\u3000': { name: '全角空格', code: 'U+3000', replacement: ' ' },          // 全角空格 → 半角空格
};

function validateJsonFile(filePath) {
  console.log('\n\u{1F50D} Checking: ' + filePath + '\n');
  
  // 读取文件
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('\u274C Cannot read file: ' + err.message);
    return false;
  }

  // 检查问题字符
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineIndex) => {
    for (const [char, info] of Object.entries(PROBLEMATIC_CHARS)) {
      let colIndex = line.indexOf(char);
      while (colIndex !== -1) {
        issues.push({
          line: lineIndex + 1,
          column: colIndex + 1,
          char,
          ...info
        });
        colIndex = line.indexOf(char, colIndex + 1);
      }
    }
  });

  // 报告问题
  if (issues.length > 0) {
    console.log('\u26A0\uFE0F  Found ' + issues.length + ' problematic characters:\n');
    issues.forEach(issue => {
      console.log('  Line ' + issue.line + ', Col ' + issue.column + ': "' + issue.char + '" (' + issue.name + ' ' + issue.code + ')');
      console.log('    Suggested replacement: "' + issue.replacement + '"\n');
    });
  } else {
    console.log('\u2705 No problematic characters found');
  }

  // 尝试解析 JSON
  try {
    JSON.parse(content);
    console.log('\u2705 JSON is valid and can be parsed');
    return issues.length === 0;
  } catch (err) {
    console.log('\u274C JSON parse error: ' + err.message);
    return false;
  }
}

function fixJsonFile(filePath) {
  console.log('\n\u{1F527} Fixing: ' + filePath + '\n');
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('\u274C Cannot read file: ' + err.message);
    return false;
  }

  let fixedContent = content;
  let fixCount = 0;

  for (const [char, info] of Object.entries(PROBLEMATIC_CHARS)) {
    const regex = new RegExp(char, 'g');
    const matches = fixedContent.match(regex);
    if (matches) {
      fixCount += matches.length;
      fixedContent = fixedContent.replace(regex, info.replacement);
      console.log('  Replaced "' + char + '" (' + info.name + ') -> "' + info.replacement + '": ' + matches.length + ' occurrences');
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('\n\u2705 Fixed ' + fixCount + ' issues');
    return true;
  } else {
    console.log('\u2705 No fixes needed');
    return true;
  }
}

// 主程序
const args = process.argv.slice(2);
const command = args[0];
const targetFile = args[1];

if (!command || command === '--help') {
  console.log('\nJSON Validation & Fix Tool\n');
  console.log('Usage:');
  console.log('  node scripts/validate-json.js check <file>   Check a JSON file');
  console.log('  node scripts/validate-json.js fix <file>     Fix a JSON file');
  console.log('  node scripts/validate-json.js check-all      Check all JSON files');
  console.log('  node scripts/validate-json.js fix-all        Fix all JSON files');
  console.log('\nExamples:');
  console.log('  node scripts/validate-json.js check bazi_result.json');
  console.log('  node scripts/validate-json.js fix love_analysis.json');
  console.log('  node scripts/validate-json.js check-all\n');
  process.exit(0);
}

if (command === 'check' && targetFile) {
  const filePath = path.resolve(targetFile);
  validateJsonFile(filePath);
} else if (command === 'fix' && targetFile) {
  const filePath = path.resolve(targetFile);
  fixJsonFile(filePath);
} else if (command === 'check-all' || command === 'fix-all') {
  const projectDir = path.resolve(__dirname, '..');
  const jsonFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.json') && !f.includes('package'));
  
  console.log('\n\u{1F4C1} Found ' + jsonFiles.length + ' JSON files\n');
  
  jsonFiles.forEach(file => {
    const filePath = path.join(projectDir, file);
    if (command === 'check-all') {
      validateJsonFile(filePath);
    } else {
      fixJsonFile(filePath);
    }
    console.log('-'.repeat(50));
  });
} else {
  console.error('\u274C Invalid command or arguments. Use --help for usage.');
  process.exit(1);
}
