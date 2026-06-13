import type {
  AssignmentStatement,
  BinaryExpression,
  CallExpression,
  ClassDeclaration,
  Expression,
  FunctionDeclaration,
  IfStatement,
  ImportDeclaration,
  LogicalExpression,
  MatchStatement,
  MemberExpression,
  NewExpression,
  ObjectExpression,
  PipelineExpression,
  Program,
  RangeExpression,
  Statement,
  VariableDeclaration,
} from "./ast";
import { parse, type ParseOptions } from "./parser";

export interface CompileOptions extends ParseOptions {}

const indentUnit = "  ";

interface EmitContext {
  usesRange: boolean;
}

export function compile(source: string, options: CompileOptions = {}): string {
  return emitProgram(parse(source, options));
}

export function emitProgram(program: Program): string {
  const context: EmitContext = { usesRange: false };
  const body = program.body.map((statement) => emitStatement(statement, 0, context)).join("\n");
  const helper = context.usesRange ? `${emitRangeHelper()}\n\n` : "";
  return `${helper}${body}\n`;
}

function emitStatement(statement: Statement, depth: number, context: EmitContext, implicitReturn = false): string {
  switch (statement.kind) {
    case "VariableDeclaration":
      return emitVariableDeclaration(statement, depth, context);
    case "AssignmentStatement":
      return `${indent(depth)}${emitExpression(statement.target, context)} = ${emitExpression(statement.value, context)};`;
    case "ExpressionStatement":
      return `${indent(depth)}${implicitReturn ? "return " : ""}${emitExpression(statement.expression, context)};`;
    case "FunctionDeclaration":
      return emitFunctionDeclaration(statement, depth, context);
    case "ReturnStatement":
      return `${indent(depth)}return${statement.value ? ` ${emitExpression(statement.value, context)}` : ""};`;
    case "IfStatement":
      return emitIfStatement(statement, depth, context);
    case "MatchStatement":
      return `${indent(depth)}${emitMatchExpression(statement, context)};`;
    case "ForInStatement":
      return `${indent(depth)}for (const ${statement.iterator} of ${emitExpression(statement.iterable, context)}) ${emitBlock(statement.body, depth, context, false)}`;
    case "WhileStatement":
      return `${indent(depth)}while (${emitExpression(statement.test, context)}) ${emitBlock(statement.body, depth, context, false)}`;
    case "BreakStatement":
      return `${indent(depth)}break;`;
    case "ContinueStatement":
      return `${indent(depth)}continue;`;
    case "ImportDeclaration":
      return emitImport(statement, depth);
    case "ExportDeclaration":
      if (statement.default && statement.value) {
        return `${indent(depth)}export default ${emitExpression(statement.value, context)};`;
      }
      if (statement.names.length > 0) {
        return `${indent(depth)}export { ${statement.names.join(", ")} };`;
      }
      if (statement.declaration) {
        if (statement.declaration.kind === "ClassDeclaration") {
          return emitClassDeclaration(statement.declaration, depth, context, true);
        }
        return `${indent(depth)}export ${emitStatement(statement.declaration, 0, context).trimStart()}`;
      }
      throw new Error("Invalid export declaration");
    case "ClassDeclaration":
      return emitClassDeclaration(statement, depth, context, false);
    default:
      return assertNever(statement);
  }
}

function emitVariableDeclaration(statement: VariableDeclaration, depth: number, context: EmitContext): string {
  const keyword = statement.constant ? "const" : "let";
  return `${indent(depth)}${keyword} ${statement.name} = ${emitExpression(statement.value, context)};`;
}

function emitFunctionDeclaration(statement: FunctionDeclaration, depth: number, context: EmitContext): string {
  const prefix = statement.async ? "async " : "";
  return `${indent(depth)}${prefix}function ${statement.name}(${statement.params.join(", ")}) ${emitFunctionBlock(statement.body, depth, context)}`;
}

function emitClassDeclaration(statement: ClassDeclaration, depth: number, context: EmitContext, exported: boolean): string {
  const parent = statement.extendsName ? ` extends ${statement.extendsName}` : "";
  const header = `${indent(depth)}${exported ? "export " : ""}class ${statement.name}${parent} {`;
  const methods = statement.methods
    .map((method) => {
      const name = method.name === "init" ? "constructor" : method.name;
      const asyncPrefix = method.async && name !== "constructor" ? "async " : "";
      return `${indent(depth + 1)}${asyncPrefix}${name}(${method.params.join(", ")}) ${emitFunctionBlock(method.body, depth + 1, context)}`;
    })
    .join("\n");
  return `${header}\n${methods}\n${indent(depth)}}`;
}

function emitIfStatement(statement: IfStatement, depth: number, context: EmitContext): string {
  return statement.branches
    .map((branch, index) => {
      const prefix = index === 0 ? "if" : branch.test ? "else if" : "else";
      const test = branch.test ? ` (${emitExpression(branch.test, context)})` : "";
      return `${index === 0 ? indent(depth) : ""}${prefix}${test} ${emitBlock(branch.body, depth, context, false)}`;
    })
    .join(" ");
}

function emitImport(statement: ImportDeclaration, depth: number): string {
  if (statement.defaultName && statement.named.length > 0) {
    return `${indent(depth)}import ${statement.defaultName}, { ${statement.named.join(", ")} } from ${JSON.stringify(statement.source)};`;
  }
  if (statement.named.length > 0) {
    return `${indent(depth)}import { ${statement.named.join(", ")} } from ${JSON.stringify(statement.source)};`;
  }
  if (statement.defaultName) {
    return `${indent(depth)}import ${statement.defaultName} from ${JSON.stringify(statement.source)};`;
  }
  return `${indent(depth)}import ${JSON.stringify(statement.source)};`;
}

function emitBlock(body: Statement[], depth: number, context: EmitContext, implicitReturn: boolean): string {
  if (body.length === 0) {
    return "{}";
  }
  return `{\n${emitStatements(body, depth + 1, context, implicitReturn)}\n${indent(depth)}}`;
}

function emitFunctionBlock(body: Statement[], depth: number, context: EmitContext): string {
  if (body.length === 0) {
    return "{}";
  }
  return `{\n${emitStatements(body, depth + 1, context, true)}\n${indent(depth)}}`;
}

function emitStatements(body: Statement[], depth: number, context: EmitContext, implicitReturn: boolean): string {
  return body
    .map((statement, index) => emitStatement(statement, depth, context, implicitReturn && index === body.length - 1 && statement.kind === "ExpressionStatement"))
    .join("\n");
}

function emitExpression(expression: Expression, context: EmitContext): string {
  switch (expression.kind) {
    case "Identifier":
      return expression.name;
    case "ThisExpression":
      return "this";
    case "Literal":
      return typeof expression.value === "string" ? JSON.stringify(expression.value) : String(expression.value);
    case "TemplateString":
      return emitTemplateString(expression.value);
    case "ArrayExpression":
      return `[${expression.elements.map((element) => emitExpression(element, context)).join(", ")}]`;
    case "ObjectExpression":
      return emitObjectExpression(expression, context);
    case "UnaryExpression":
      return `${expression.operator === "not" ? "!" : expression.operator}${parenthesize(expression.argument, context)}`;
    case "BinaryExpression":
      return emitBinaryExpression(expression, context);
    case "LogicalExpression":
      return emitLogicalExpression(expression, context);
    case "RangeExpression":
      return emitRangeExpression(expression, context);
    case "PipelineExpression":
      return emitPipelineExpression(expression, context);
    case "AwaitExpression":
      return `await ${parenthesize(expression.argument, context)}`;
    case "CallExpression":
      return emitCallExpression(expression, context);
    case "MemberExpression":
      return emitMemberExpression(expression, context);
    case "NewExpression":
      return emitNewExpression(expression, context);
    case "ArrowFunctionExpression":
      return `${expression.async ? "async " : ""}(${expression.params.join(", ")}) => ${
        Array.isArray(expression.body) ? emitBlock(expression.body, 0, context, true) : emitExpression(expression.body, context)
      }`;
    default:
      return assertNever(expression);
  }
}

function emitBinaryExpression(expression: BinaryExpression, context: EmitContext): string {
  const operator = expression.operator === "==" ? "===" : expression.operator === "!=" ? "!==" : expression.operator;
  return `${parenthesize(expression.left, context)} ${operator} ${parenthesize(expression.right, context)}`;
}

function emitLogicalExpression(expression: LogicalExpression, context: EmitContext): string {
  const operator = expression.operator === "and" ? "&&" : "||";
  return `${parenthesize(expression.left, context)} ${operator} ${parenthesize(expression.right, context)}`;
}

function emitRangeExpression(expression: RangeExpression, context: EmitContext): string {
  context.usesRange = true;
  return `__cocoRange(${emitExpression(expression.start, context)}, ${emitExpression(expression.end, context)})`;
}

function emitPipelineExpression(expression: PipelineExpression, context: EmitContext): string {
  if (expression.right.kind === "Identifier") {
    return emitCallExpression({ kind: "CallExpression", loc: expression.loc, callee: expression.right, args: [expression.left] }, context);
  }

  return emitCallExpression({ ...expression.right, args: [expression.left, ...expression.right.args] }, context);
}

function emitCallExpression(expression: CallExpression, context: EmitContext): string {
  const callee = expression.callee.kind === "Identifier" && expression.callee.name === "print" ? "console.log" : emitExpression(expression.callee, context);
  return `${callee}(${expression.args.map((arg) => emitExpression(arg, context)).join(", ")})`;
}

function emitMemberExpression(expression: MemberExpression, context: EmitContext): string {
  return `${parenthesizeMemberObject(expression.object, context)}${expression.optional ? "?." : "."}${expression.property}`;
}

function emitNewExpression(expression: NewExpression, context: EmitContext): string {
  if (expression.callee.kind === "CallExpression") {
    return `new ${emitExpression(expression.callee.callee, context)}(${expression.callee.args.map((arg) => emitExpression(arg, context)).join(", ")})`;
  }
  return `new ${emitExpression(expression.callee, context)}(${expression.args.map((arg) => emitExpression(arg, context)).join(", ")})`;
}

function emitObjectExpression(expression: ObjectExpression, context: EmitContext): string {
  if (expression.properties.length === 0) {
    return "{}";
  }
  const properties = expression.properties.map((property) => `${property.key}: ${emitExpression(property.value, context)}`).join(", ");
  return `{ ${properties} }`;
}

function emitMatchExpression(statement: MatchStatement, context: EmitContext): string {
  const valueName = `__cocoMatch${statement.loc.line}_${statement.loc.column}`;
  const cases = statement.cases
    .map((matchCase, index) => {
      const keyword = index === 0 ? "if" : "else if";
      const header = matchCase.pattern ? `${keyword} (${valueName} === ${emitExpression(matchCase.pattern, context)})` : "else";
      return `${indent(2)}${header} ${emitBlock(matchCase.body, 2, context, true)}`;
    })
    .join(" ");
  return `(() => {\n${indent(1)}const ${valueName} = ${emitExpression(statement.value, context)};\n${cases}\n${indent(1)}return undefined;\n})()`;
}

function emitTemplateString(value: string): string {
  const escaped = value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return `\`${escaped.replace(/\{([A-Za-z_][A-Za-z0-9_]*(?:\??\.[A-Za-z_][A-Za-z0-9_]*)*)\}/g, (_, expression: string) => `\${${expression}}`)}\``;
}

function emitRangeHelper(): string {
  return `function __cocoRange(start, end) {
  const step = start <= end ? 1 : -1;
  const values = [];
  for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
    values.push(value);
  }
  return values;
}`;
}

function parenthesize(expression: Expression, context: EmitContext): string {
  if (
    expression.kind === "Identifier" ||
    expression.kind === "Literal" ||
    expression.kind === "TemplateString" ||
    expression.kind === "CallExpression" ||
    expression.kind === "MemberExpression" ||
    expression.kind === "AwaitExpression" ||
    expression.kind === "NewExpression" ||
    expression.kind === "ThisExpression" ||
    expression.kind === "ArrayExpression" ||
    expression.kind === "ObjectExpression" ||
    expression.kind === "RangeExpression" ||
    expression.kind === "PipelineExpression"
  ) {
    return emitExpression(expression, context);
  }
  return `(${emitExpression(expression, context)})`;
}

function parenthesizeMemberObject(expression: Expression, context: EmitContext): string {
  if (expression.kind === "Identifier" || expression.kind === "CallExpression" || expression.kind === "MemberExpression" || expression.kind === "ThisExpression") {
    return emitExpression(expression, context);
  }
  return `(${emitExpression(expression, context)})`;
}

function indent(depth: number): string {
  return indentUnit.repeat(depth);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled AST node: ${JSON.stringify(value)}`);
}
