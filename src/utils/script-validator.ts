/**
 * Script Validator for Custom Nodes
 *
 * Performs comprehensive validation of custom node scripts:
 * - Syntax validation using acorn AST parser
 * - processData function detection
 * - Output name matching
 * - Security pattern detection
 * - Common mistake warnings
 */

import * as acorn from 'acorn';

export interface ScriptWarning {
  type: 'missing_function' | 'output_mismatch' | 'syntax' | 'security' | 'best_practice';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
}

interface OutputDef {
  name: string;
  dataType?: string;
}

interface InputDef {
  name: string;
  dataType?: string;
}

/**
 * Validate custom node script code and return warnings
 */
export function validateCustomNodeScript(
  scriptCode: string,
  outputs: OutputDef[],
  inputs?: InputDef[]
): ScriptWarning[] {
  const warnings: ScriptWarning[] = [];

  // 1. SYNTAX VALIDATION with AST parsing
  let ast: acorn.Program | null = null;
  try {
    ast = acorn.parse(scriptCode, {
      ecmaVersion: 2020,
      sourceType: 'script',
      locations: true,
      allowReturnOutsideFunction: true, // Allow parsing, but we'll detect it
    });
  } catch (e: unknown) {
    const error = e as { message?: string; loc?: { line?: number; column?: number } };
    warnings.push({
      type: 'syntax',
      severity: 'error',
      message: `Syntax error: ${error.message || 'Unknown syntax error'}`,
      line: error.loc?.line,
      column: error.loc?.column,
    });
    return warnings; // Can't continue without valid AST
  }

  // 2. CHECK FOR processData FUNCTION
  let hasProcessData = false;
  let processDataNode: acorn.FunctionDeclaration | null = null;

  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration') {
      const funcDecl = node as acorn.FunctionDeclaration;
      if (funcDecl.id?.name === 'processData') {
        hasProcessData = true;
        processDataNode = funcDecl;
        break;
      }
    }
  }

  if (!hasProcessData) {
    warnings.push({
      type: 'missing_function',
      severity: 'error',
      message:
        "No 'processData' function found. Script must define: function processData(inputs, properties) { return { ... }; }",
      line: 1,
    });
  }

  // 3. CHECK processData PARAMETERS
  if (processDataNode) {
    const params = processDataNode.params;
    if (params.length === 0) {
      warnings.push({
        type: 'best_practice',
        severity: 'warning',
        message:
          'processData has no parameters. Expected: function processData(inputs, properties)',
        line: getNodeLine(processDataNode),
      });
    } else if (params.length === 1) {
      warnings.push({
        type: 'best_practice',
        severity: 'info',
        message:
          "processData has 1 parameter. Consider adding 'properties' as second parameter for node configuration.",
        line: getNodeLine(processDataNode),
      });
    }
  }

  // 4. CHECK FOR TOP-LEVEL RETURN (outside functions)
  for (const node of ast.body) {
    if (node.type === 'ReturnStatement') {
      warnings.push({
        type: 'syntax',
        severity: 'error',
        message: "Top-level 'return' statement found. Return must be inside processData function.",
        line: getNodeLine(node),
      });
    }
  }

  // 5. CHECK FOR OUTPUT NAME COVERAGE in return statements
  if (processDataNode && outputs.length > 0) {
    const returnedKeys = findReturnedKeys(processDataNode);

    // Warn about missing outputs
    for (const output of outputs) {
      if (!returnedKeys.has(output.name)) {
        warnings.push({
          type: 'output_mismatch',
          severity: 'warning',
          message: `Output '${output.name}' not found in return statement - will be undefined`,
        });
      }
    }

    // Info about extra keys that don't match outputs
    const outputNames = new Set(outputs.map((o) => o.name));
    for (const key of returnedKeys) {
      if (!outputNames.has(key)) {
        warnings.push({
          type: 'output_mismatch',
          severity: 'info',
          message: `Return key '${key}' doesn't match any defined output - will be ignored`,
        });
      }
    }
  }

  // 6. SECURITY PATTERN WARNINGS
  const securityPatterns: Array<{ pattern: RegExp; msg: string }> = [
    { pattern: /\beval\s*\(/, msg: 'eval() is blocked in sandbox' },
    { pattern: /\bFunction\s*\(/, msg: 'Function constructor is blocked' },
    { pattern: /\brequire\s*\(/, msg: 'require() is not available in sandbox' },
    { pattern: /\bimport\s+/, msg: 'import statements are not supported' },
    { pattern: /\bprocess\./, msg: 'process object is not available' },
    { pattern: /\bglobal\./, msg: 'global object access is blocked' },
    { pattern: /\bglobalThis\./, msg: 'globalThis access is blocked' },
    { pattern: /__proto__/, msg: '__proto__ access is blocked (security)' },
    {
      pattern: /\.constructor\.constructor/,
      msg: 'Constructor chain access is blocked (security)',
    },
    { pattern: /\bfs\./, msg: 'File system (fs) is not available' },
    { pattern: /\bchild_process/, msg: 'child_process module is not available' },
    { pattern: /\bexec\s*\(/, msg: 'exec() is not available' },
    { pattern: /\bspawn\s*\(/, msg: 'spawn() is not available' },
    { pattern: /\bsetTimeout\s*\(\s*['"`]/, msg: 'setTimeout with string is blocked' },
    { pattern: /\bsetInterval\s*\(\s*['"`]/, msg: 'setInterval with string is blocked' },
  ];

  const lines = scriptCode.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, msg } of securityPatterns) {
      if (pattern.test(lines[i])) {
        warnings.push({
          type: 'security',
          severity: 'error',
          message: msg,
          line: i + 1,
        });
      }
    }
  }

  // 7. COMMON MISTAKE WARNINGS
  if (/\boutputs\s*[=\[]/.test(scriptCode) || /\boutputs\./.test(scriptCode)) {
    const lineNum = findLineNumber(scriptCode, /\boutputs/);
    warnings.push({
      type: 'best_practice',
      severity: 'warning',
      message: "'outputs' is not a predefined variable. Return values from processData() instead.",
      line: lineNum,
    });
  }

  // Check for 'result' variable that might not be returned
  const resultMatch = scriptCode.match(/\b(const|let|var)\s+result\s*=/);
  if (resultMatch && !outputs.find((o) => o.name === 'result')) {
    // Check if result is used in return
    if (!/return\s*\{[^}]*result[^}]*\}/.test(scriptCode)) {
      const lineNum = findLineNumber(scriptCode, /\bresult\s*=/);
      warnings.push({
        type: 'best_practice',
        severity: 'info',
        message:
          "Variable 'result' defined but may not be returned. Did you mean to include it in the return statement?",
        line: lineNum,
      });
    }
  }

  // Check for common dataType mistake
  if (/dataType.*['"]string['"]/.test(scriptCode)) {
    warnings.push({
      type: 'best_practice',
      severity: 'info',
      message: "Note: Use 'text' instead of 'string' for dataType values.",
    });
  }

  return warnings;
}

/**
 * Format warnings for display in MCP response
 */
export function formatWarnings(warnings: ScriptWarning[]): string {
  if (warnings.length === 0) {
    return '';
  }

  const lines: string[] = ['', '## Script Validation Warnings:', ''];

  // Group by severity
  const errors = warnings.filter((w) => w.severity === 'error');
  const warns = warnings.filter((w) => w.severity === 'warning');
  const infos = warnings.filter((w) => w.severity === 'info');

  if (errors.length > 0) {
    lines.push('### Errors (script may not execute):');
    for (const w of errors) {
      const loc = w.line ? ` (line ${w.line}${w.column ? `:${w.column}` : ''})` : '';
      lines.push(`- ${w.message}${loc}`);
    }
    lines.push('');
  }

  if (warns.length > 0) {
    lines.push('### Warnings:');
    for (const w of warns) {
      const loc = w.line ? ` (line ${w.line})` : '';
      lines.push(`- ${w.message}${loc}`);
    }
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('### Notes:');
    for (const w of infos) {
      const loc = w.line ? ` (line ${w.line})` : '';
      lines.push(`- ${w.message}${loc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Helper: Get line number from AST node
function getNodeLine(node: acorn.Node): number | undefined {
  return (node as acorn.Node & { loc?: { start?: { line?: number } } }).loc?.start?.line;
}

// Helper: Find all keys in return statements within a function
function findReturnedKeys(funcNode: acorn.FunctionDeclaration): Set<string> {
  const keys = new Set<string>();
  walkNode(funcNode.body, (node: acorn.Node) => {
    if (node.type === 'ReturnStatement') {
      const returnStmt = node as acorn.ReturnStatement;
      if (returnStmt.argument?.type === 'ObjectExpression') {
        const objExpr = returnStmt.argument as acorn.ObjectExpression;
        for (const prop of objExpr.properties) {
          if (prop.type === 'Property') {
            const propNode = prop as acorn.Property;
            if (propNode.key.type === 'Identifier') {
              keys.add((propNode.key as acorn.Identifier).name);
            } else if (propNode.key.type === 'Literal') {
              const value = (propNode.key as acorn.Literal).value;
              if (typeof value === 'string') {
                keys.add(value);
              }
            }
          }
        }
      }
    }
  });
  return keys;
}

// Helper: Simple AST walker
function walkNode(node: acorn.Node | null | undefined, callback: (n: acorn.Node) => void): void {
  if (!node || typeof node !== 'object') return;
  callback(node);

  // Cast through unknown to access dynamic properties
  const nodeObj = node as unknown as Record<string, unknown>;
  for (const key of Object.keys(nodeObj)) {
    const child = nodeObj[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c && typeof c === 'object' && 'type' in c) {
          walkNode(c as acorn.Node, callback);
        }
      }
    } else if (child && typeof child === 'object' && 'type' in child) {
      walkNode(child as acorn.Node, callback);
    }
  }
}

// Helper: Find line number for a pattern
function findLineNumber(code: string, pattern: RegExp): number {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return 1;
}
