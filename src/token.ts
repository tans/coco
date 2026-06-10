export type TokenType =
  | "EOF"
  | "IDENTIFIER"
  | "KEYWORD"
  | "STRING"
  | "STRING_TEMPLATE"
  | "NUMBER"
  | "TRUE"
  | "FALSE"
  | "NULL"
  | "NEWLINE"
  | "INDENT"
  | "DEDENT"
  | "LPAREN"
  | "RPAREN"
  | "LBRACKET"
  | "RBRACKET"
  | "LBRACE"
  | "RBRACE"
  | "COMMA"
  | "COLON"
  | "DOT"
  | "ASSIGN"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "MOD"
  | "EQ"
  | "NE"
  | "GT"
  | "GTE"
  | "LT"
  | "LTE"
  | "AND"
  | "OR"
  | "NOT"
  | "PIPE"
  | "ARROW"
  | "AT"
  | "QUESTION";

export interface SourceLocation {
  line: number;
  column: number;
  index: number;
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value: string | number | boolean | null;
  start: SourceLocation;
  end: SourceLocation;
}

export class CocoSyntaxError extends Error {
  readonly line: number;
  readonly column: number;
  readonly index: number;

  constructor(message: string, location: SourceLocation) {
    super(`${message} at ${location.line}:${location.column}`);
    this.name = "CocoSyntaxError";
    this.line = location.line;
    this.column = location.column;
    this.index = location.index;
  }
}

export const keywords = new Set([
  "const",
  "fn",
  "async",
  "await",
  "return",
  "if",
  "elif",
  "else",
  "match",
  "for",
  "in",
  "while",
  "break",
  "continue",
  "class",
  "try",
  "catch",
  "finally",
  "import",
  "export",
  "default",
]);
