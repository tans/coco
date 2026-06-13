import type {
  ArrayExpression,
  AssignmentStatement,
  BinaryExpression,
  CallExpression,
  ClassDeclaration,
  Expression,
  ForInStatement,
  FunctionDeclaration,
  Identifier,
  IfBranch,
  IfStatement,
  ImportDeclaration,
  LogicalExpression,
  MatchCase,
  MatchStatement,
  MemberExpression,
  ObjectExpression,
  PipelineExpression,
  Program,
  RangeExpression,
  Statement,
  VariableDeclaration,
} from "./ast";
import { tokenize } from "./lexer";
import { CocoSyntaxError, type SourceLocation, type Token, type TokenType } from "./token";

export interface ParseOptions {
  filename?: string;
}

const expressionStartTokens = new Set<TokenType>([
  "IDENTIFIER",
  "NUMBER",
  "STRING",
  "STRING_TEMPLATE",
  "TRUE",
  "FALSE",
  "NULL",
  "KEYWORD",
  "LPAREN",
  "LBRACKET",
  "LBRACE",
  "MINUS",
  "NOT",
  "AT",
]);

const expressionStartKeywords = new Set(["await"]);
const statementBoundaryTokens = new Set<TokenType>(["NEWLINE", "DEDENT", "EOF", "RPAREN", "RBRACKET", "RBRACE", "COMMA"]);

export function parse(source: string, options: ParseOptions = {}): Program {
  return new Parser(tokenize(source, options)).parseProgram();
}

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): Program {
    const body: Statement[] = [];
    const loc = this.peek().start;
    this.skipNewlines();

    while (!this.check("EOF")) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }

    return { kind: "Program", loc, body };
  }

  private parseStatement(): Statement {
    if (this.matchKeyword("export")) {
      return this.parseExport(this.previous());
    }
    if (this.matchKeyword("import")) {
      return this.parseImport(this.previous());
    }
    if (this.matchKeyword("const")) {
      return this.parseVariableDeclaration(this.previous(), true);
    }
    if (this.matchKeyword("async")) {
      const token = this.previous();
      this.consumeKeyword("fn", "Expected fn after async");
      return this.parseFunctionDeclaration(token, true);
    }
    if (this.matchKeyword("fn")) {
      return this.parseFunctionDeclaration(this.previous(), false);
    }
    if (this.matchKeyword("class")) {
      return this.parseClassDeclaration(this.previous());
    }
    if (this.matchKeyword("return")) {
      const token = this.previous();
      const value = this.isLineEnd() ? null : this.parseExpression();
      this.consumeStatementEnd();
      return { kind: "ReturnStatement", loc: token.start, value };
    }
    if (this.matchKeyword("if")) {
      return this.parseIfStatement(this.previous());
    }
    if (this.matchKeyword("match")) {
      return this.parseMatchStatement(this.previous());
    }
    if (this.matchKeyword("for")) {
      return this.parseForInStatement(this.previous());
    }
    if (this.matchKeyword("while")) {
      return this.parseWhileStatement(this.previous());
    }
    if (this.matchKeyword("break")) {
      const token = this.previous();
      this.consumeStatementEnd();
      return { kind: "BreakStatement", loc: token.start };
    }
    if (this.matchKeyword("continue")) {
      const token = this.previous();
      this.consumeStatementEnd();
      return { kind: "ContinueStatement", loc: token.start };
    }

    return this.parseExpressionOrAssignmentStatement();
  }

  private parseVariableDeclaration(keyword: Token, constant: boolean): VariableDeclaration {
    const name = this.consumeIdentifier("Expected variable name").lexeme;
    this.consume("ASSIGN", "Expected = after variable name");
    const value = this.match("NEWLINE") && this.check("INDENT") ? this.parseIndentedObjectExpression() : this.parseExpression();
    this.consumeStatementEnd();
    return { kind: "VariableDeclaration", loc: keyword.start, name, constant, value };
  }

  private parseFunctionDeclaration(start: Token, async: boolean): FunctionDeclaration {
    const name = this.consumeIdentifier("Expected function name").lexeme;
    const params: string[] = [];
    while (this.check("IDENTIFIER")) {
      params.push(this.advance().lexeme);
    }
    const body = this.parseBlock();
    return { kind: "FunctionDeclaration", loc: start.start, name, params, body, async };
  }

  private parseClassDeclaration(start: Token): ClassDeclaration {
    const name = this.consumeIdentifier("Expected class name").lexeme;
    const extendsName = this.matchKeyword("extends") ? this.consumeIdentifier("Expected parent class name after extends").lexeme : null;
    this.consume("NEWLINE", "Expected newline after class name");
    this.consume("INDENT", "Expected indented class body");
    const methods: FunctionDeclaration[] = [];
    this.skipNewlines();

    while (!this.check("DEDENT") && !this.check("EOF")) {
      let async = false;
      let token = this.peek();
      if (this.matchKeyword("async")) {
        async = true;
        token = this.previous();
      }
      this.consumeKeyword("fn", "Only method declarations are supported in class bodies");
      methods.push(this.parseFunctionDeclaration(token, async));
      this.skipNewlines();
    }

    this.consume("DEDENT", "Expected end of class body");
    return { kind: "ClassDeclaration", loc: start.start, name, extendsName, methods };
  }

  private parseIfStatement(start: Token): IfStatement {
    const branches: IfBranch[] = [];
    const test = this.parseExpression();
    branches.push({ test, body: this.parseBlock() });

    while (this.matchKeyword("elif")) {
      const branchTest = this.parseExpression();
      branches.push({ test: branchTest, body: this.parseBlock() });
    }

    if (this.matchKeyword("else")) {
      branches.push({ test: null, body: this.parseBlock() });
    }

    return { kind: "IfStatement", loc: start.start, branches };
  }

  private parseForInStatement(start: Token): ForInStatement {
    const iterator = this.consumeIdentifier("Expected loop variable").lexeme;
    this.consumeKeyword("in", "Expected in after loop variable");
    const iterable = this.parseExpression();
    const body = this.parseBlock();
    return { kind: "ForInStatement", loc: start.start, iterator, iterable, body };
  }

  private parseMatchStatement(start: Token): MatchStatement {
    const value = this.parseExpression();
    this.consume("NEWLINE", "Expected newline before match cases");
    this.consume("INDENT", "Expected indented match cases");
    const cases: MatchCase[] = [];
    this.skipNewlines();

    while (!this.check("DEDENT") && !this.check("EOF")) {
      const pattern = this.check("IDENTIFIER") && this.peek().lexeme === "_" ? (this.advance(), null) : this.parseMatchPattern();
      this.consume("ARROW", "Expected -> after match pattern");
      if (this.match("NEWLINE")) {
        cases.push({ pattern, body: this.parseInlineBlockAfterArrow() });
      } else {
        cases.push({ pattern, body: [{ kind: "ExpressionStatement", loc: pattern?.loc ?? start.start, expression: this.parseExpression() }] });
        this.consumeStatementEnd();
      }
      this.skipNewlines();
    }

    this.consume("DEDENT", "Expected end of match cases");
    if (!cases.some((matchCase) => matchCase.pattern === null)) {
      throw this.error(start, "Expected wildcard _ match case");
    }
    return { kind: "MatchStatement", loc: start.start, value, cases };
  }

  private parseMatchPattern(): Expression {
    return this.parseExpression();
  }

  private parseInlineBlockAfterArrow(): Statement[] {
    this.consume("INDENT", "Expected indented match case body");
    const body: Statement[] = [];
    this.skipNewlines();
    while (!this.check("DEDENT") && !this.check("EOF")) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    this.consume("DEDENT", "Expected end of match case body");
    return body;
  }

  private parseWhileStatement(start: Token): Statement {
    const test = this.parseExpression();
    const body = this.parseBlock();
    return { kind: "WhileStatement", loc: start.start, test, body };
  }

  private parseImport(start: Token): ImportDeclaration {
    let defaultName: string | null = null;
    const named: string[] = [];

    if (this.match("LBRACE")) {
      do {
        named.push(this.consumeIdentifier("Expected imported name").lexeme);
      } while (this.match("COMMA"));
      this.consume("RBRACE", "Expected } after named imports");
    } else {
      defaultName = this.consumeIdentifier("Expected import name").lexeme;
      if (this.match("COMMA")) {
        this.consume("LBRACE", "Expected { after default import");
        do {
          named.push(this.consumeIdentifier("Expected imported name").lexeme);
        } while (this.match("COMMA"));
        this.consume("RBRACE", "Expected } after named imports");
      }
    }

    this.consumeKeyword("from", "Expected from in import declaration");
    const source = this.consume("STRING", "Expected import source string");
    this.consumeStatementEnd();
    return { kind: "ImportDeclaration", loc: start.start, defaultName, named, source: String(source.value) };
  }

  private parseExport(start: Token): Statement {
    if (this.matchKeyword("default")) {
      const value = this.parseExpression();
      this.consumeStatementEnd();
      return { kind: "ExportDeclaration", loc: start.start, default: true, declaration: null, value, names: [] };
    }

    if (this.matchKeyword("class")) {
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: this.parseClassDeclaration(this.previous()), value: null, names: [] };
    }
    if (this.matchKeyword("async")) {
      const token = this.previous();
      this.consumeKeyword("fn", "Expected fn after async");
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: this.parseFunctionDeclaration(token, true), value: null, names: [] };
    }
    if (this.matchKeyword("fn")) {
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: this.parseFunctionDeclaration(this.previous(), false), value: null, names: [] };
    }
    if (this.matchKeyword("const")) {
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: this.parseVariableDeclaration(this.previous(), true), value: null, names: [] };
    }
    if (this.match("LBRACE")) {
      const names = this.parseExportNameList("RBRACE");
      this.consumeStatementEnd();
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: null, value: null, names };
    }
    if (this.check("IDENTIFIER")) {
      const names = [this.advance().lexeme];
      this.consumeStatementEnd();
      return { kind: "ExportDeclaration", loc: start.start, default: false, declaration: null, value: null, names };
    }

    throw this.error(this.peek(), "Expected export declaration or default export");
  }

  private parseExpressionOrAssignmentStatement(): Statement {
    const expression = this.parseExpression();

    if (this.match("ASSIGN")) {
      const value = this.match("NEWLINE") && this.check("INDENT") ? this.parseIndentedObjectExpression() : this.parseExpression();
      this.consumeStatementEnd();

      if (expression.kind === "Identifier") {
        return {
          kind: "VariableDeclaration",
          loc: expression.loc,
          name: expression.name,
          constant: false,
          value,
        };
      }

      return { kind: "AssignmentStatement", loc: expression.loc, target: expression, value };
    }

    this.consumeStatementEnd();
    return { kind: "ExpressionStatement", loc: expression.loc, expression };
  }

  private parseBlock(): Statement[] {
    this.consume("NEWLINE", "Expected newline before block");
    this.consume("INDENT", "Expected indented block");
    const body: Statement[] = [];
    this.skipNewlines();

    while (!this.check("DEDENT") && !this.check("EOF")) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }

    this.consume("DEDENT", "Expected end of block");
    return body;
  }

  private parseIndentedObjectExpression(): ObjectExpression {
    const indent = this.consume("INDENT", "Expected indented object body");
    const properties = this.parseObjectProperties("DEDENT");
    this.consume("DEDENT", "Expected end of object body");
    return { kind: "ObjectExpression", loc: indent.start, properties };
  }

  private parseExpression(): Expression {
    return this.parseArrow();
  }

  private parseArrow(): Expression {
    if (this.check("LPAREN") && this.findMatchingParenArrow()) {
      const start = this.advance();
      const params: string[] = [];
      if (!this.check("RPAREN")) {
        do {
          params.push(this.consumeIdentifier("Expected arrow parameter").lexeme);
        } while (this.match("COMMA"));
      }
      this.consume("RPAREN", "Expected ) after arrow parameters");
      this.consume("ARROW", "Expected => after arrow parameters");
      const body = this.parseExpression();
      return { kind: "ArrowFunctionExpression", loc: start.start, params, body, async: false };
    }

    return this.parsePipeline();
  }

  private parsePipeline(): Expression {
    let expression = this.parseOr();
    while (this.match("PIPE")) {
      const operator = this.previous();
      const right = this.parsePipelineTarget();
      expression = { kind: "PipelineExpression", loc: operator.start, left: expression, right } satisfies PipelineExpression;
    }
    return expression;
  }

  private parsePipelineTarget(): PipelineExpression["right"] {
    const target = this.parseCall(true);
    if (target.kind !== "Identifier" && target.kind !== "CallExpression") {
      throw new CocoSyntaxError("Expected function name or call after pipeline operator", target.loc);
    }
    return target;
  }

  private parseOr(): Expression {
    let expression = this.parseAnd();
    while (this.match("OR")) {
      const operator = this.previous();
      const right = this.parseAnd();
      expression = { kind: "LogicalExpression", loc: operator.start, operator: "or", left: expression, right } satisfies LogicalExpression;
    }
    return expression;
  }

  private parseAnd(): Expression {
    let expression = this.parseEquality();
    while (this.match("AND")) {
      const operator = this.previous();
      const right = this.parseEquality();
      expression = { kind: "LogicalExpression", loc: operator.start, operator: "and", left: expression, right } satisfies LogicalExpression;
    }
    return expression;
  }

  private parseEquality(): Expression {
    let expression = this.parseComparison();
    while (this.match("EQ", "NE")) {
      const operator = this.previous();
      const right = this.parseComparison();
      expression = { kind: "BinaryExpression", loc: operator.start, operator: operator.lexeme as BinaryExpression["operator"], left: expression, right };
    }
    return expression;
  }

  private parseComparison(): Expression {
    let expression = this.parseRange();
    while (this.match("GT", "GTE", "LT", "LTE")) {
      const operator = this.previous();
      const right = this.parseRange();
      expression = { kind: "BinaryExpression", loc: operator.start, operator: operator.lexeme as BinaryExpression["operator"], left: expression, right };
    }
    return expression;
  }

  private parseRange(): Expression {
    let expression = this.parseTerm();
    if (this.match("RANGE")) {
      const operator = this.previous();
      const end = this.parseTerm();
      expression = { kind: "RangeExpression", loc: operator.start, start: expression, end, inclusive: true } satisfies RangeExpression;
    }
    return expression;
  }

  private parseTerm(): Expression {
    let expression = this.parseFactor();
    while (this.match("PLUS", "MINUS")) {
      const operator = this.previous();
      const right = this.parseFactor();
      expression = { kind: "BinaryExpression", loc: operator.start, operator: operator.lexeme as BinaryExpression["operator"], left: expression, right };
    }
    return expression;
  }

  private parseFactor(): Expression {
    let expression = this.parseUnary();
    while (this.match("STAR", "SLASH", "MOD")) {
      const operator = this.previous();
      const right = this.parseUnary();
      expression = { kind: "BinaryExpression", loc: operator.start, operator: operator.lexeme as BinaryExpression["operator"], left: expression, right };
    }
    return expression;
  }

  private parseUnary(): Expression {
    if (this.match("MINUS", "NOT")) {
      const operator = this.previous();
      const argument = this.parseUnary();
      return {
        kind: "UnaryExpression",
        loc: operator.start,
        operator: operator.type === "MINUS" ? "-" : operator.lexeme === "not" ? "not" : "!",
        argument,
      };
    }
    if (this.matchKeyword("await")) {
      const token = this.previous();
      return { kind: "AwaitExpression", loc: token.start, argument: this.parseUnary() };
    }
    if (this.matchKeyword("new")) {
      const token = this.previous();
      const callee = this.parseCall(false);
      const args = this.parseConstructorArguments();
      return { kind: "NewExpression", loc: token.start, callee, args };
    }

    return this.parseCall(true);
  }

  private parseConstructorArguments(): Expression[] {
    if (this.match("LPAREN")) {
      const args: Expression[] = [];
      if (!this.check("RPAREN")) {
        do {
          args.push(this.parseExpression());
        } while (this.match("COMMA"));
      }
      this.consume("RPAREN", "Expected ) after constructor arguments");
      return args;
    }

    const args: Expression[] = [];
    while (this.shouldParseConstructorArgument()) {
      args.push(this.parseCall(false));
    }
    return args;
  }

  private parseCall(allowWhitespaceCall: boolean): Expression {
    let expression = this.parsePrimary();

    while (true) {
      if (this.match("LPAREN")) {
        const args: Expression[] = [];
        if (!this.check("RPAREN")) {
          do {
            args.push(this.parseExpression());
          } while (this.match("COMMA"));
        }
        this.consume("RPAREN", "Expected ) after arguments");
        expression = { kind: "CallExpression", loc: expression.loc, callee: expression, args } satisfies CallExpression;
        continue;
      }

      if (this.match("QUESTION")) {
        this.consume("DOT", "Expected . after ?");
        const property = this.consumeIdentifier("Expected property name").lexeme;
        expression = { kind: "MemberExpression", loc: expression.loc, object: expression, property, optional: true } satisfies MemberExpression;
        continue;
      }

      if (this.match("DOT")) {
        const property = this.consumeIdentifier("Expected property name").lexeme;
        expression = { kind: "MemberExpression", loc: expression.loc, object: expression, property, optional: false } satisfies MemberExpression;
        continue;
      }

      if (allowWhitespaceCall && this.shouldParseWhitespaceCall(expression)) {
        const args: Expression[] = [];
        do {
          args.push(this.parseCall(false));
        } while (this.shouldParseWhitespaceCall(expression));
        expression = { kind: "CallExpression", loc: expression.loc, callee: expression, args };
        continue;
      }

      break;
    }

    return expression;
  }

  private parsePrimary(): Expression {
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE", "NULL")) {
      const token = this.previous();
      return { kind: "Literal", loc: token.start, value: token.value };
    }
    if (this.match("STRING_TEMPLATE")) {
      const token = this.previous();
      return { kind: "TemplateString", loc: token.start, value: String(token.value) };
    }
    if (this.match("IDENTIFIER")) {
      const token = this.previous();
      return { kind: "Identifier", loc: token.start, name: token.lexeme } satisfies Identifier;
    }
    if (this.match("AT")) {
      const token = this.previous();
      const property = this.consumeIdentifier("Expected property name after @").lexeme;
      return {
        kind: "MemberExpression",
        loc: token.start,
        object: { kind: "ThisExpression", loc: token.start },
        property,
        optional: false,
      };
    }
    if (this.match("LPAREN")) {
      const expression = this.parseExpression();
      this.consume("RPAREN", "Expected ) after expression");
      return expression;
    }
    if (this.match("LBRACKET")) {
      return this.parseArrayLiteral(this.previous());
    }
    if (this.match("LBRACE")) {
      const start = this.previous();
      const properties = this.parseObjectProperties("RBRACE");
      this.consume("RBRACE", "Expected } after object literal");
      return { kind: "ObjectExpression", loc: start.start, properties };
    }

    throw this.error(this.peek(), "Expected expression");
  }

  private parseExportNameList(end: TokenType): string[] {
    const names: string[] = [];
    if (!this.check(end)) {
      do {
        names.push(this.consumeIdentifier("Expected exported name").lexeme);
      } while (this.match("COMMA"));
    }
    this.consume(end, "Expected } after exported names");
    return names;
  }

  private parseArrayLiteral(start: Token): ArrayExpression {
    const elements: Expression[] = [];
    this.skipNewlines();
    while (!this.check("RBRACKET") && !this.check("EOF")) {
      elements.push(this.parseExpression());
      this.match("COMMA");
      this.skipNewlines();
    }
    this.consume("RBRACKET", "Expected ] after array literal");
    return { kind: "ArrayExpression", loc: start.start, elements };
  }

  private parseObjectProperties(end: TokenType) {
    const properties: ObjectExpression["properties"] = [];
    this.skipNewlines();

    while (!this.check(end) && !this.check("EOF")) {
      const key = this.consumeIdentifier("Expected object property name").lexeme;
      this.consume("COLON", "Expected : after object property name");
      const value = this.match("NEWLINE") && this.check("INDENT") ? this.parseIndentedObjectExpression() : this.parseExpression();
      properties.push({ key, value });
      this.match("COMMA");
      this.skipNewlines();
    }

    return properties;
  }

  private shouldParseWhitespaceCall(callee: Expression): boolean {
    if (callee.kind !== "Identifier" && callee.kind !== "MemberExpression" && callee.kind !== "CallExpression") {
      return false;
    }
    if (statementBoundaryTokens.has(this.peek().type)) {
      return false;
    }
    if (this.peek().type === "RANGE" || this.peek().type === "PIPE" || this.peek().type === "ARROW") {
      return false;
    }
    if (this.peek().type === "KEYWORD" && !expressionStartKeywords.has(this.peek().lexeme)) {
      return false;
    }
    return expressionStartTokens.has(this.peek().type) || expressionStartKeywords.has(this.peek().lexeme);
  }

  private shouldParseConstructorArgument(): boolean {
    if (statementBoundaryTokens.has(this.peek().type)) {
      return false;
    }
    if (this.peek().type === "RANGE" || this.peek().type === "PIPE" || this.peek().type === "ARROW") {
      return false;
    }
    if (this.peek().type === "KEYWORD" && !expressionStartKeywords.has(this.peek().lexeme)) {
      return false;
    }
    return expressionStartTokens.has(this.peek().type) || expressionStartKeywords.has(this.peek().lexeme);
  }

  private consumeStatementEnd(): void {
    if (this.match("NEWLINE")) {
      return;
    }
    if (this.previous().type === "DEDENT") {
      return;
    }
    if (this.check("DEDENT") || this.check("EOF")) {
      return;
    }
    throw this.error(this.peek(), "Expected end of statement");
  }

  private skipNewlines(): void {
    while (this.match("NEWLINE")) {}
  }

  private isLineEnd(): boolean {
    return this.check("NEWLINE") || this.check("DEDENT") || this.check("EOF");
  }

  private findMatchingParenArrow(): boolean {
    let depth = 0;
    for (let i = this.current; i < this.tokens.length; i += 1) {
      const token = this.tokens[i];
      if (!token) {
        return false;
      }
      if (token.type === "LPAREN") {
        depth += 1;
      }
      if (token.type === "RPAREN") {
        depth -= 1;
        if (depth === 0) {
          return this.tokens[i + 1]?.type === "ARROW";
        }
      }
    }
    return false;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchKeyword(keyword: string): boolean {
    if (this.checkKeyword(keyword)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private consumeIdentifier(message: string): Token {
    return this.consume("IDENTIFIER", message);
  }

  private consumeKeyword(keyword: string, message: string): Token {
    if (this.checkKeyword(keyword)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private checkKeyword(keyword: string): boolean {
    return this.peek().type === "KEYWORD" && this.peek().lexeme === keyword;
  }

  private advance(): Token {
    if (!this.check("EOF")) {
      this.current += 1;
    }
    return this.previous();
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? this.tokens[0]!;
  }

  private peek(): Token {
    return this.tokens[this.current] ?? this.tokens[this.tokens.length - 1]!;
  }

  private error(token: Token, message: string): CocoSyntaxError {
    return new CocoSyntaxError(message, token.start as SourceLocation);
  }
}
