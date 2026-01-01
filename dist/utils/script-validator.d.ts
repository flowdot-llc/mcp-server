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
export declare function validateCustomNodeScript(scriptCode: string, outputs: OutputDef[], inputs?: InputDef[]): ScriptWarning[];
/**
 * Format warnings for display in MCP response
 */
export declare function formatWarnings(warnings: ScriptWarning[]): string;
export {};
//# sourceMappingURL=script-validator.d.ts.map