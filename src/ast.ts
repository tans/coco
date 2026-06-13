import type { SourceLocation } from "./token";

export interface NodeBase {
  kind: string;
  loc: SourceLocation;
}

export interface Program extends NodeBase {
  kind: "Program";
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | AssignmentStatement
  | ExpressionStatement
  | FunctionDeclaration
  | ReturnStatement
  | IfStatement
  | MatchStatement
  | ForInStatement
  | WhileStatement
  | BreakStatement
  | ContinueStatement
  | ImportDeclaration
  | ExportDeclaration
  | ClassDeclaration;

export interface VariableDeclaration extends NodeBase {
  kind: "VariableDeclaration";
  name: string;
  constant: boolean;
  value: Expression;
}

export interface AssignmentStatement extends NodeBase {
  kind: "AssignmentStatement";
  target: Expression;
  value: Expression;
}

export interface ExpressionStatement extends NodeBase {
  kind: "ExpressionStatement";
  expression: Expression;
}

export interface FunctionDeclaration extends NodeBase {
  kind: "FunctionDeclaration";
  name: string;
  params: string[];
  body: Statement[];
  async: boolean;
}

export interface ReturnStatement extends NodeBase {
  kind: "ReturnStatement";
  value: Expression | null;
}

export interface IfBranch {
  test: Expression | null;
  body: Statement[];
}

export interface IfStatement extends NodeBase {
  kind: "IfStatement";
  branches: IfBranch[];
}

export interface MatchCase {
  pattern: Expression | null;
  body: Statement[];
}

export interface MatchStatement extends NodeBase {
  kind: "MatchStatement";
  value: Expression;
  cases: MatchCase[];
}

export interface ForInStatement extends NodeBase {
  kind: "ForInStatement";
  iterator: string;
  iterable: Expression;
  body: Statement[];
}

export interface WhileStatement extends NodeBase {
  kind: "WhileStatement";
  test: Expression;
  body: Statement[];
}

export interface BreakStatement extends NodeBase {
  kind: "BreakStatement";
}

export interface ContinueStatement extends NodeBase {
  kind: "ContinueStatement";
}

export interface ImportDeclaration extends NodeBase {
  kind: "ImportDeclaration";
  defaultName: string | null;
  named: string[];
  source: string;
}

export interface ExportDeclaration extends NodeBase {
  kind: "ExportDeclaration";
  declaration: Statement | null;
  value: Expression | null;
  default: boolean;
  names: string[];
}

export interface ClassDeclaration extends NodeBase {
  kind: "ClassDeclaration";
  name: string;
  extendsName: string | null;
  methods: FunctionDeclaration[];
}

export type Expression =
  | Identifier
  | ThisExpression
  | Literal
  | TemplateString
  | ArrayExpression
  | ObjectExpression
  | UnaryExpression
  | BinaryExpression
  | LogicalExpression
  | RangeExpression
  | PipelineExpression
  | AwaitExpression
  | CallExpression
  | MemberExpression
  | NewExpression
  | ArrowFunctionExpression;

export interface Identifier extends NodeBase {
  kind: "Identifier";
  name: string;
}

export interface ThisExpression extends NodeBase {
  kind: "ThisExpression";
}

export interface Literal extends NodeBase {
  kind: "Literal";
  value: string | number | boolean | null;
}

export interface TemplateString extends NodeBase {
  kind: "TemplateString";
  value: string;
}

export interface ArrayExpression extends NodeBase {
  kind: "ArrayExpression";
  elements: Expression[];
}

export interface ObjectProperty {
  key: string;
  value: Expression;
}

export interface ObjectExpression extends NodeBase {
  kind: "ObjectExpression";
  properties: ObjectProperty[];
}

export interface UnaryExpression extends NodeBase {
  kind: "UnaryExpression";
  operator: "-" | "!" | "not";
  argument: Expression;
}

export interface BinaryExpression extends NodeBase {
  kind: "BinaryExpression";
  operator: "+" | "-" | "*" | "/" | "%" | "==" | "!=" | ">" | ">=" | "<" | "<=";
  left: Expression;
  right: Expression;
}

export interface LogicalExpression extends NodeBase {
  kind: "LogicalExpression";
  operator: "and" | "or";
  left: Expression;
  right: Expression;
}

export interface RangeExpression extends NodeBase {
  kind: "RangeExpression";
  start: Expression;
  end: Expression;
  inclusive: boolean;
}

export interface PipelineExpression extends NodeBase {
  kind: "PipelineExpression";
  left: Expression;
  right: CallExpression | Identifier;
}

export interface AwaitExpression extends NodeBase {
  kind: "AwaitExpression";
  argument: Expression;
}

export interface CallExpression extends NodeBase {
  kind: "CallExpression";
  callee: Expression;
  args: Expression[];
}

export interface MemberExpression extends NodeBase {
  kind: "MemberExpression";
  object: Expression;
  property: string;
  optional: boolean;
}

export interface NewExpression extends NodeBase {
  kind: "NewExpression";
  callee: Expression;
  args: Expression[];
}

export interface ArrowFunctionExpression extends NodeBase {
  kind: "ArrowFunctionExpression";
  params: string[];
  body: Expression | Statement[];
  async: boolean;
}
