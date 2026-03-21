const Analysis = require('../models/Analysis');
const { getAiSuggestions } = require('./aiService');

// Increased during development to allow more analyses per day
const FREE_USER_DAILY_LIMIT = 100;

const getTodayDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};

const checkUsageLimit = async (userId, role) => {
  if (role === 'admin') return;
  const { start, end } = getTodayDateRange();
  const count = await Analysis.countDocuments({
    user: userId,
    createdAt: { $gte: start, $lt: end },
  });
  if (count >= FREE_USER_DAILY_LIMIT) {
    const error = new Error(`Daily analysis limit reached (${FREE_USER_DAILY_LIMIT} per day for free users)`);
    error.statusCode = 429;
    throw error;
  }
};

// ─── Smart Pattern-based Analyzer ────────────────────────────────────────────

/**
 * Splits code into logical lines (trimmed, non-empty).
 */
const getLines = (code) => code.split(/\r?\n/).map((l) => l.trim());

/**
 * Analyzes Python code for bugs, improvements, and security issues.
 */
const analyzePython = (code, lines) => {
  const bugs = [];
  const improvements = [];
  const security = [];
  let score = 100;

  // ── Variable tracking ──────────────────────────────────────────────────────
  const varValues = {};
  lines.forEach((line) => {
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const [, varName, rawVal] = assignMatch;
      const val = rawVal.trim();
      if (/^-?\d+(\.\d+)?$/.test(val)) {
        varValues[varName] = parseFloat(val);
      }
      
      // ── Bad naming detection ───────────────────────────────────────────────
      if (/^[a-z]$|_|temp|tmp|data|res/i.test(varName) && varName.length <= 4 && varName !== '_') {
        improvements.push(`Poor variable naming detected ('${varName}'). Use descriptive variable names.`);
        score -= 5;
      }
    }
  });

  // ── Division by zero detection ─────────────────────────────────────────────
  const divisionPatterns = [
    /\/\/?\s*0\b(?!\.\d)/,
    ...Object.entries(varValues).filter(([, v]) => v === 0).map(([name]) => new RegExp(`\\/\\/?\\s*${name}\\b`)),
    /\w+\s*\([^)]*,\s*0\s*\)/,
    ...Object.entries(varValues).filter(([, v]) => v === 0).map(([name]) => new RegExp(`\\w+\\s*\\([^)]*,\\s*${name}\\s*\\)`)),
  ];

  const hasDivision = code.includes('/');
  if (hasDivision) {
    for (const pattern of divisionPatterns) {
      if (pattern.test(code)) {
        bugs.push('🔴 Division by zero: a zero value is passed as divisor, which will raise ZeroDivisionError at runtime.');
        score -= 25;
        break;
      }
    }
  }

  // ── Missing try-except around risky division ────────────────────────────────
  if (hasDivision && !code.includes('try:')) {
    security.push('⚠️ No try-except block around division operation. Add exception handling to catch ZeroDivisionError.');
    score -= 10;
  }

  // ── Bare except ──────────────────────────────────────────────────────────
  if (/except\s*:/.test(code)) {
    improvements.push('Avoid bare `except:`. Catch specific exceptions (e.g. `except ZeroDivisionError:`) for better error handling.');
    score -= 8;
  }

  // ── Mutable default argument ──────────────────────────────────────────────
  if (/def\s+\w+\s*\([^)]*=\s*(\[\]|\{\}|\(\))/.test(code)) {
    bugs.push('⚠️ Mutable default argument detected (e.g. `def f(x=[])`). This is a common Python bug — the same object is shared across all calls.');
    score -= 15;
  }

  // ── Infinite loop risk ────────────────────────────────────────────────────
  if (/while\s+True:/i.test(code) && !code.includes('break')) {
    bugs.push('⚠️ `while True:` loop with no `break` statement detected. This will cause an infinite loop.');
    score -= 20;
  }

  // ── Undefined variable used before assignment ─────────────────────────────
  const definedVars = new Set(['True', 'False', 'None', 'self', 'cls']);
  lines.forEach((line) => {
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=/);
    if (assignMatch) definedVars.add(assignMatch[1]);
    const funcMatch = line.match(/^def\s+\w+\s*\(([^)]*)\)/);
    if (funcMatch) {
      funcMatch[1].split(',').forEach((param) => {
        const p = param.trim().replace(/=.*/, '').trim();
        if (p) definedVars.add(p);
      });
    }
  });

  // ── Unused imports ────────────────────────────────────────────────────────
  const importedModules = [];
  lines.forEach((line) => {
    const imp = line.match(/^import\s+(\w+)/) || line.match(/^from\s+\w+\s+import\s+(\w+)/);
    if (imp) importedModules.push(imp[1]);
  });
  importedModules.forEach((mod) => {
    if (!code.replace(`import ${mod}`, '').includes(mod)) {
      improvements.push(`Imported module '${mod}' is never used. Remove unused imports.`);
      score -= 5;
    }
  });

  // ── Global variable usage ─────────────────────────────────────────────────
  if (code.includes('global ')) {
    improvements.push('Usage of `global` keyword detected. Prefer passing variables as arguments and returning values instead of mutating globals.');
    score -= 8;
  }

  // ── Missing docstrings ─────────────────────────────────────────────────────
  if (/def\s+\w+/.test(code) && !code.includes('"""') && !code.includes("'''") && !code.includes('#')) {
    improvements.push('Code is missing comments and docstrings. Add comments to document purpose and logic.');
    score -= 10;
  }

  // ── Missing return ─────────────────────────────────────────────────────────
  if (/def\s+\w+/.test(code) && !code.includes('return') && !code.includes('yield') && !code.includes('pass')) {
    bugs.push('Missing return statement: function might return None implicitly unexpectedly.');
    score -= 5;
  }

  // ── Long function / complexity ─────────────────────────────────────────────
  const functionBodyLines = (code.match(/def\s+\w+[^:]*:/g) || []).length;
  if (code.split('\n').length > 50 && functionBodyLines < 2) {
    improvements.push('Long function detected. Break down code into smaller, reusable functions.');
    score -= 10;
  }

  return { bugs, improvements, security, score };
};

/**
 * Analyzes JavaScript / TypeScript code.
 */
const analyzeJS = (code, lines, isTS) => {
  const bugs = [];
  const improvements = [];
  const security = [];
  let score = 100;

  // ── var usage ─────────────────────────────────────────────────────────────
  if (/\bvar\s+/.test(code)) {
    improvements.push('`var` is function-scoped and can cause hoisting bugs. Use `const` or `let` instead.');
    score -= 8;
  }

  // ── == instead of === ─────────────────────────────────────────────────────
  if (/[^=!<>]==[^=]/.test(code)) {
    bugs.push('`==` (loose equality) used. Use `===` (strict equality) to avoid type coercion bugs.');
    score -= 10;
  }

  // ── Missing comments ───────────────────────────────────────────────────────
  if (!code.includes('//') && !code.includes('/*')) {
    improvements.push('Code is missing comments. Add comments to document purpose and logic.');
    score -= 10;
  }

  // ── Missing return ─────────────────────────────────────────────────────────
  if (/function\s+\w+\s*\(/.test(code) && !code.includes('return') && !code.includes('=>') && lines.length > 5) {
    bugs.push('Missing return statement: function might return undefined implicitly unexpectedly.');
    score -= 5;
  }

  // ── eval() ────────────────────────────────────────────────────────────────
  if (/\beval\s*\(/.test(code)) {
    security.push('🔴 `eval()` detected. This is a critical security vulnerability.');
    score -= 25;
  }

  // ── No error handling for async ───────────────────────────────────────────
  if ((/await\s+/.test(code) || /\.then\s*\(/.test(code)) && !code.includes('catch') && !code.includes('try')) {
    bugs.push('⚠️ Async code found without try-catch or .catch(). Unhandled promise rejections can crash the app.');
    score -= 15;
  }

  // ── Long function ──────────────────────────────────────────────────────────
  if (code.split('\n').length > 50 && (code.match(/function/g) || []).length < 2) {
    improvements.push('Long function detected. Break down code into smaller, reusable functions.');
    score -= 10;
  }

  // ── Unused variables and bad naming ──────────────────────────────────────
  const declaredVars = [];
  lines.forEach((line) => {
    const match = line.match(/(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/);
    if (match) {
      declaredVars.push(match[1]);
      const varName = match[1];
      if (/^[a-z]$|_|temp|tmp|data|res/i.test(varName) && varName.length <= 4) {
        improvements.push(`Poor variable naming detected ('${varName}'). Use descriptive names.`);
        score -= 5;
      }
    }
  });

  declaredVars.forEach((v) => {
    const usageCount = (code.match(new RegExp(`\\b${v}\\b`, 'g')) || []).length;
    if (usageCount === 1) {
      improvements.push(`Variable '${v}' is declared but never used. Remove it or use it.`);
      score -= 5;
    }
  });

  return { bugs, improvements, security, score };
};

/**
 * Analyzes Java code for bugs, improvements, and security issues.
 */
const analyzeJava = (code, lines) => {
  const bugs = [];
  const improvements = [];
  const security = [];
  let score = 100;

  // ── Missing try-catch ─────────────────────────────────────────────────────
  const hasRiskyOps = /new\s+\w*(File|Scanner|Connection|Reader|Writer|Stream|Socket|URL)/.test(code)
    || /Integer\.parseInt|Double\.parseDouble|Float\.parseFloat/.test(code)
    || /\.(read|write|connect|open)\(/.test(code);
  if (hasRiskyOps && !code.includes('try') && !code.includes('catch')) {
    bugs.push('⚠️ Risky operations detected (file/network/parsing) without try-catch. Add exception handling to prevent runtime crashes.');
    score -= 10;
  }

  // ── Unclosed Scanner / resource leak ─────────────────────────────────────
  if (/new\s+Scanner/.test(code) && !code.includes('.close()') && !code.includes('try-with-resources') && !code.includes('try (')) {
    improvements.push('⚠️ Scanner object created but never closed. Use try-with-resources (try (Scanner sc = ...)) or call sc.close() to prevent resource leaks.');
    score -= 8;
  }

  // ── Missing comments ──────────────────────────────────────────────────────
  if (!code.includes('//') && !code.includes('/*')) {
    improvements.push('Code is missing comments. Add comments to document purpose and logic.');
    score -= 8;
  }

  // ── Poor variable naming ──────────────────────────────────────────────────
  lines.forEach((line) => {
    const match = line.match(/(?:int|String|double|float|long|boolean|char)\s+([a-zA-Z_][\w]*)/);
    if (match) {
      const varName = match[1];
      if (/^[a-z]$|^(temp|tmp|data|res|x|y|z|n|i|j)$/.test(varName) && varName.length <= 2) {
        // single letter is fine for loop counters
      } else if (/^(temp|tmp|data|res)$/i.test(varName)) {
        improvements.push(`Poor variable naming detected ('${varName}'). Use a descriptive name that explains its purpose.`);
        score -= 5;
      }
    }
  });

  // ── System.exit() in methods ──────────────────────────────────────────────
  if (/System\.exit\(/.test(code)) {
    improvements.push('Avoid `System.exit()` inside methods. Throw an exception or use a return code instead.');
    score -= 5;
  }

  // ── Unnecessary System.out.println in production code ────────────────────
  const printCount = (code.match(/System\.out\.println/g) || []).length;
  if (printCount > 3) {
    improvements.push(`Found ${printCount} System.out.println() calls. Consider using a proper logger (java.util.logging or SLF4J) in production code.`);
    score -= 5;
  }

  // ── Missing return type annotation (void methods doing work) ─────────────
  if (/public\s+void\s+\w+/.test(code) && !/return/.test(code) && lines.length > 15) {
    improvements.push('Void methods should not perform complex computations without returning results. Consider refactoring.');
    score -= 5;
  }

  return { bugs, improvements, security, score };
};

/**
 * General analysis for all languages.
 */
const analyzeGeneral = (code) => {
  const improvements = [];
  let score = 0;

  const lines = code.split('\n');

  // ── Duplicate code detection (very basic lines check) ──────────────────────
  const uniqueLines = new Set(lines.map(l => l.trim()).filter(l => l.length > 10));
  const codeLinesCount = lines.filter(l => l.trim().length > 10).length;
  if (codeLinesCount - uniqueLines.size > 3) {
    improvements.push('Duplicate code logic detected. Consider creating reusable functions to avoid duplication.');
    score -= 5;
  }

  if (lines.length > 100) {
    improvements.push('File is quite long. Consider splitting into smaller modules.');
    score -= 5;
  }

  return { improvements, score };
};

/**
 * Estimate time complexity from code structure.
 */
const estimateComplexity = (code) => {
  const forCount = (code.match(/\bfor\b/g) || []).length;
  const whileCount = (code.match(/\bwhile\b/g) || []).length;
  const loopCount = forCount + whileCount;

  // Recursion detection
  if (/def\s+(\w+).*:\s*[\s\S]*?\1\s*\(/.test(code) || /function\s+(\w+).*\{\s*[\s\S]*?\1\s*\(/.test(code)) {
    return 'Recursion detected (Potential O(2^n) or O(n))';
  }

  // Detect nested loops
  if (
    /for[^:]+:[\s\S]{0,100}for[^:]+:/.test(code) || 
    /while[^:]+:[\s\S]{0,100}while[^:]+:/.test(code) ||
    /for.*\{[\s\S]{0,100}for.*\{/.test(code)
  ) {
    return 'O(n²)';
  }
  
  if (loopCount > 0) return 'O(n)';
  if (/\blog\b|bisect|binary/i.test(code)) return 'O(log n)';
  return 'O(1)';
};

// ──────────────────────────────────────────────────────────────────────────────

const analyzeCode = async ({ user, code, language }) => {
  if (!code || code.trim().length === 0) {
    const error = new Error('Code is required for analysis');
    error.statusCode = 400;
    throw error;
  }

  const userId = user.sub || user.id || user._id;
  await checkUsageLimit(userId, user.role);

  const lines = getLines(code);

  let bugs = [];
  let improvements = [];
  let security = [];
  let score = 100;

  // ── Language-specific analysis ────────────────────────────────────────────
  if (language === 'Python') {
    const r = analyzePython(code, lines);
    bugs = [...bugs, ...r.bugs];
    improvements = [...improvements, ...r.improvements];
    security = [...security, ...r.security];
    score += r.score - 100; // r.score starts at 100, so get the delta
  } else if (language === 'JavaScript' || language === 'TypeScript') {
    const r = analyzeJS(code, lines, language === 'TypeScript');
    bugs = [...bugs, ...r.bugs];
    improvements = [...improvements, ...r.improvements];
    security = [...security, ...r.security];
    score += r.score - 100;
  } else if (language === 'Java') {
    const r = analyzeJava(code, lines);
    bugs = [...bugs, ...r.bugs];
    improvements = [...improvements, ...r.improvements];
    security = [...security, ...r.security];
    score += r.score - 100;
  } else {
    // For Go, Other, etc. — apply basic deductions so nobody gets 100 for free
    if (!code.includes('//') && !code.includes('/*') && !code.includes('#')) {
      improvements.push('Code has no comments. Add comments to explain the logic.');
      score -= 8;
    }
    const lineCount = code.split('\n').length;
    if (lineCount > 10 && !/try|catch|error|err|exception|rescue|recover/i.test(code)) {
      improvements.push('No error handling detected. Add error checks to make your code production-safe.');
      score -= 7;
    }
  }

  // ── General analysis ──────────────────────────────────────────────────────
  const general = analyzeGeneral(code);
  improvements = [...improvements, ...general.improvements];
  score += general.score;

  score = Math.max(0, Math.min(100, score));

  const complexity = estimateComplexity(code);

  // ── Build summary ─────────────────────────────────────────────────────────
  const issueCount = bugs.length + security.length;
  let summary;
  if (issueCount === 0 && improvements.length === 0) {
    summary = 'Code looks clean with no detected issues.';
  } else if (bugs.length > 0) {
    summary = `Found ${bugs.length} bug(s) and ${improvements.length} improvement(s). Review the issues below.`;
  } else {
    summary = `No critical bugs found, but ${improvements.length} improvement(s) suggested.`;
  }

  const result = { summary, score, estimated_complexity: complexity, bugs, improvements, security };

  // ── Fetch AI Suggestions (Wow Feature #3) ─────────────────────────────────
  const suggestions = await getAiSuggestions(code, language);
  result.suggestions = suggestions;

  // Save to database
  const analysis = await Analysis.create({
    user: userId,
    code,
    language: language || 'unknown',
    prompt: `Analysis of ${language} code`,
    aiProvider: 'local',
    aiModel: 'smart-pattern-v2',
    result,
    score,
    complexity,
    bugs,
    improvements,
    security,
    suggestions,
    usage: { inputTokens: 0, outputTokens: 0 },
  });

  return {
    analysisId: analysis._id,
    summary: result.summary,
    score: result.score,
    estimated_complexity: result.estimated_complexity,
    bugs: result.bugs,
    improvements: result.improvements,
    security: result.security,
    suggestions: result.suggestions,
    createdAt: analysis.createdAt,
    remainingToday:
      user.role === 'admin'
        ? null
        : Math.max(
            0,
            FREE_USER_DAILY_LIMIT -
              (await Analysis.countDocuments({
                user: user.id || user._id,
                createdAt: {
                  $gte: getTodayDateRange().start,
                  $lt: getTodayDateRange().end,
                },
              }))
          ),
  };
};

module.exports = { analyzeCode };
