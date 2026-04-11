/**
 * @license
 * Copyright 2024 FlowDot
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { ScriptWarning } from './script-validator.js';
import { validateCustomNodeScript, formatWarnings } from './script-validator.js';

describe('validateCustomNodeScript', () => {
  describe('syntax validation', () => {
    it('should return syntax error for invalid JavaScript', () => {
      const script = 'function processData( { return {}; }'; // Missing closing paren
      const warnings = validateCustomNodeScript(script, []);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('syntax');
      expect(warnings[0].severity).toBe('error');
      expect(warnings[0].message).toContain('Syntax error');
    });

    it('should parse valid JavaScript without syntax errors', () => {
      const script = 'function processData(inputs, properties) { return { output: "test" }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'output' }]);

      const syntaxErrors = warnings.filter(w => w.type === 'syntax' && w.severity === 'error');
      expect(syntaxErrors).toHaveLength(0);
    });
  });

  describe('processData function detection', () => {
    it('should warn if processData function is missing', () => {
      const script = 'function otherFunction() { return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const missingFunc = warnings.find(w => w.type === 'missing_function');
      expect(missingFunc).toBeDefined();
      expect(missingFunc!.severity).toBe('error');
      expect(missingFunc!.message).toContain('processData');
    });

    it('should not warn if processData function exists', () => {
      const script = 'function processData(inputs, properties) { return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const missingFunc = warnings.find(w => w.type === 'missing_function');
      expect(missingFunc).toBeUndefined();
    });

    it('should warn about processData with no parameters', () => {
      const script = 'function processData() { return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const bestPractice = warnings.find(w => w.type === 'best_practice' && w.message.includes('no parameters'));
      expect(bestPractice).toBeDefined();
      expect(bestPractice!.severity).toBe('warning');
    });

    it('should give info about processData with only 1 parameter', () => {
      const script = 'function processData(inputs) { return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const bestPractice = warnings.find(w => w.type === 'best_practice' && w.message.includes('1 parameter'));
      expect(bestPractice).toBeDefined();
      expect(bestPractice!.severity).toBe('info');
    });

    it('should not warn about processData with 2 parameters', () => {
      const script = 'function processData(inputs, properties) { return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const paramWarnings = warnings.filter(w => w.type === 'best_practice' && w.message.includes('parameter'));
      expect(paramWarnings).toHaveLength(0);
    });
  });

  describe('top-level return detection', () => {
    it('should error on top-level return statement', () => {
      const script = 'function processData() { }\nreturn { output: 1 };';
      const warnings = validateCustomNodeScript(script, []);

      const topLevelReturn = warnings.find(w => w.type === 'syntax' && w.message.includes('Top-level'));
      expect(topLevelReturn).toBeDefined();
      expect(topLevelReturn!.severity).toBe('error');
    });
  });

  describe('output name coverage', () => {
    it('should warn about missing output in return statement', () => {
      const script = 'function processData(inputs) { return { other: 1 }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'result' }]);

      const mismatch = warnings.find(w => w.type === 'output_mismatch' && w.message.includes("'result'"));
      expect(mismatch).toBeDefined();
      expect(mismatch!.severity).toBe('warning');
    });

    it('should give info about extra keys not matching outputs', () => {
      const script = 'function processData(inputs) { return { result: 1, extra: 2 }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'result' }]);

      const extraKey = warnings.find(w => w.type === 'output_mismatch' && w.message.includes("'extra'"));
      expect(extraKey).toBeDefined();
      expect(extraKey!.severity).toBe('info');
    });

    it('should not warn when all outputs are returned', () => {
      const script = 'function processData(inputs) { return { output1: 1, output2: 2 }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'output1' }, { name: 'output2' }]);

      const missingOutputs = warnings.filter(w => w.type === 'output_mismatch' && w.severity === 'warning');
      expect(missingOutputs).toHaveLength(0);
    });

    it('should handle return with string literal keys', () => {
      const script = 'function processData(inputs) { return { "result": 1 }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'result' }]);

      const missingOutputs = warnings.filter(w => w.type === 'output_mismatch' && w.severity === 'warning');
      expect(missingOutputs).toHaveLength(0);
    });

    it('should skip output check when no outputs defined', () => {
      const script = 'function processData(inputs) { return { anything: 1 }; }';
      const warnings = validateCustomNodeScript(script, []);

      const outputWarnings = warnings.filter(w => w.type === 'output_mismatch');
      expect(outputWarnings).toHaveLength(0);
    });
  });

  describe('security pattern detection', () => {
    it('should warn about eval usage', () => {
      const script = 'function processData(inputs) { eval("code"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('eval'));
      expect(security).toBeDefined();
      expect(security!.severity).toBe('error');
    });

    it('should warn about Function constructor', () => {
      const script = 'function processData(inputs) { new Function("return 1"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('Function constructor'));
      expect(security).toBeDefined();
    });

    it('should warn about require usage', () => {
      const script = 'function processData(inputs) { require("fs"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('require'));
      expect(security).toBeDefined();
    });

    it('should warn about import statements', () => {
      // Note: import statement causes syntax error first since parser uses sourceType: 'script'
      // but the security pattern check still detects it in the raw code
      const script = 'const x = "import something";\nfunction processData(inputs) { return {}; }';
      validateCustomNodeScript(script, []);

      // The regex pattern /\bimport\s+/ looks for 'import ' followed by space
      // Let's use a script that contains this pattern in a comment or string that gets past parsing
      const script2 = '// import fs from "fs";\nfunction processData(inputs) { return {}; }';
      const warnings2 = validateCustomNodeScript(script2, []);
      const security = warnings2.find(w => w.type === 'security' && w.message.includes('import'));
      expect(security).toBeDefined();
    });

    it('should warn about process object access', () => {
      const script = 'function processData(inputs) { process.env.SECRET; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('process'));
      expect(security).toBeDefined();
    });

    it('should warn about global object access', () => {
      const script = 'function processData(inputs) { global.something; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('global'));
      expect(security).toBeDefined();
    });

    it('should warn about globalThis access', () => {
      const script = 'function processData(inputs) { globalThis.something; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('globalThis'));
      expect(security).toBeDefined();
    });

    it('should warn about __proto__ access', () => {
      const script = 'function processData(inputs) { obj.__proto__; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('__proto__'));
      expect(security).toBeDefined();
    });

    it('should warn about constructor chain access', () => {
      const script = 'function processData(inputs) { obj.constructor.constructor; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('Constructor chain'));
      expect(security).toBeDefined();
    });

    it('should warn about fs module access', () => {
      const script = 'function processData(inputs) { fs.readFile(); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('fs'));
      expect(security).toBeDefined();
    });

    it('should warn about child_process module', () => {
      const script = 'function processData(inputs) { child_process.exec(); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('child_process'));
      expect(security).toBeDefined();
    });

    it('should warn about exec function', () => {
      const script = 'function processData(inputs) { exec("ls"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('exec'));
      expect(security).toBeDefined();
    });

    it('should warn about spawn function', () => {
      const script = 'function processData(inputs) { spawn("ls"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('spawn'));
      expect(security).toBeDefined();
    });

    it('should warn about setTimeout with string', () => {
      const script = 'function processData(inputs) { setTimeout("alert()"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('setTimeout'));
      expect(security).toBeDefined();
    });

    it('should warn about setInterval with string', () => {
      const script = 'function processData(inputs) { setInterval("alert()"); return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const security = warnings.find(w => w.type === 'security' && w.message.includes('setInterval'));
      expect(security).toBeDefined();
    });
  });

  describe('common mistake warnings', () => {
    it('should warn about using outputs variable', () => {
      const script = 'function processData(inputs) { outputs = {}; outputs.result = 1; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const warning = warnings.find(w => w.type === 'best_practice' && w.message.includes('outputs'));
      expect(warning).toBeDefined();
    });

    it('should give info about result variable not returned', () => {
      // The logic checks: result is defined, result is not in outputs, and return doesn't contain 'result' key
      const script = 'function processData(inputs) { const result = 1; return { other: 1 }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'other' }]);

      const info = warnings.find(w => w.type === 'best_practice' && w.message.includes("'result'") && w.message.includes('not be returned'));
      expect(info).toBeDefined();
    });

    it('should not warn about result if it is in outputs', () => {
      const script = 'function processData(inputs) { const result = 1; return { result }; }';
      const warnings = validateCustomNodeScript(script, [{ name: 'result' }]);

      const resultWarning = warnings.find(w => w.type === 'best_practice' && w.message.includes("'result'") && w.message.includes('not be returned'));
      expect(resultWarning).toBeUndefined();
    });

    it('should give info about using string instead of text for dataType', () => {
      const script = 'function processData(inputs) { const config = { dataType: "string" }; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const info = warnings.find(w => w.type === 'best_practice' && w.message.includes('text'));
      expect(info).toBeDefined();
    });

    it('should handle outputs pattern with array syntax', () => {
      // This triggers findLineNumber with a pattern that may not match exactly
      const script = 'function processData(inputs) { outputs[0] = 1; return {}; }';
      const warnings = validateCustomNodeScript(script, []);

      const warning = warnings.find(w => w.type === 'best_practice' && w.message.includes('outputs'));
      expect(warning).toBeDefined();
      expect(warning!.line).toBeDefined();
    });

    it('should handle result pattern in edge case', () => {
      // Script where let result = is matched but appears in a tricky location
      const script = 'function processData(inputs) {\n  // comment\n  let result = 1;\n  return { output: 2 };\n}';
      const warnings = validateCustomNodeScript(script, [{ name: 'output' }]);

      const info = warnings.find(w => w.message.includes("'result'") && w.message.includes('not be returned'));
      expect(info).toBeDefined();
      expect(info!.line).toBe(3); // The line where result is defined
    });
  });

  describe('edge cases', () => {
    it('should handle empty script', () => {
      const warnings = validateCustomNodeScript('', []);
      expect(warnings.length).toBeGreaterThan(0);
      // Should have missing_function warning
      const missingFunc = warnings.find(w => w.type === 'missing_function');
      expect(missingFunc).toBeDefined();
    });

    it('should handle syntax error with location info', () => {
      // Trigger a syntax error that has location information
      const script = 'function processData() {\n  const x = \n}'; // Missing value
      const warnings = validateCustomNodeScript(script, []);

      const syntaxError = warnings.find(w => w.type === 'syntax');
      expect(syntaxError).toBeDefined();
      expect(syntaxError!.line).toBeDefined();
    });

    it('should handle script with only comments', () => {
      const script = '// This is a comment\n/* multi\nline */';
      const warnings = validateCustomNodeScript(script, []);
      const missingFunc = warnings.find(w => w.type === 'missing_function');
      expect(missingFunc).toBeDefined();
    });

    it('should handle complex valid script', () => {
      const script = `
function processData(inputs, properties) {
  const data = inputs.data || [];
  const processed = data.map(item => ({
    ...item,
    processed: true
  }));
  return {
    output: processed,
    count: processed.length
  };
}
`;
      const warnings = validateCustomNodeScript(script, [{ name: 'output' }, { name: 'count' }]);

      // Should have no errors
      const errors = warnings.filter(w => w.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });
});

describe('formatWarnings', () => {
  it('should return empty string for no warnings', () => {
    const result = formatWarnings([]);
    expect(result).toBe('');
  });

  it('should format errors section', () => {
    const warnings: ScriptWarning[] = [
      { type: 'syntax', severity: 'error', message: 'Syntax error', line: 5 },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('Errors');
    expect(result).toContain('Syntax error');
    expect(result).toContain('line 5');
  });

  it('should format warnings section', () => {
    const warnings: ScriptWarning[] = [
      { type: 'output_mismatch', severity: 'warning', message: 'Missing output', line: 10 },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('Warnings');
    expect(result).toContain('Missing output');
    expect(result).toContain('line 10');
  });

  it('should format info section', () => {
    const warnings: ScriptWarning[] = [
      { type: 'best_practice', severity: 'info', message: 'Consider this', line: 3 },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('Notes');
    expect(result).toContain('Consider this');
  });

  it('should include column in error location', () => {
    const warnings: ScriptWarning[] = [
      { type: 'syntax', severity: 'error', message: 'Error', line: 5, column: 10 },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('line 5:10');
  });

  it('should format multiple severity levels', () => {
    const warnings: ScriptWarning[] = [
      { type: 'syntax', severity: 'error', message: 'Error message' },
      { type: 'output_mismatch', severity: 'warning', message: 'Warning message' },
      { type: 'best_practice', severity: 'info', message: 'Info message' },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('Errors');
    expect(result).toContain('Warnings');
    expect(result).toContain('Notes');
    expect(result).toContain('Error message');
    expect(result).toContain('Warning message');
    expect(result).toContain('Info message');
  });

  it('should handle warnings without line numbers', () => {
    const warnings: ScriptWarning[] = [
      { type: 'best_practice', severity: 'info', message: 'General note' },
    ];
    const result = formatWarnings(warnings);

    expect(result).toContain('General note');
    expect(result).not.toContain('line');
  });
});
