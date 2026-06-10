import { CocoSyntaxError, keywords, type SourceLocation, type Token, type TokenType } from "./token";

export interface TokenizeOptions {
  filename?: string;
}

const singleCharTokens: Record<string, TokenType> = {
  "(": "LPAREN",
  ")": "RPAREN",
  "[": "LBRACKET",
  "]": "RBRACKET",
  "{": "LBRACE",
  "}": "RBRACE",
  ",": "COMMA",
  ":": "COLON",
  ".": "DOT",
  "=": "ASSIGN",
  "+": "PLUS",
  "-": "MINUS",
  "*": "STAR",
  "/": "SLASH",
  "%": "MOD",
  ">": "GT",
  "<": "LT",
  "|": "PIPE",
  "@": "AT",
  "?": "QUESTION",
};

export class Lexer {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private readonly indents = [0];
  private index = 0;
  private line = 1;
  private column = 1;
  private atLineStart = true;
  private pendingLineHasTokens = false;
  private parenDepth = 0;

  constructor(source: string, _options: TokenizeOptions = {}) {
    this.source = source.replace(/\r\n?/g, "\n");
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      if (this.atLineStart) {
        this.scanIndentation();
        if (this.isAtEnd()) {
          break;
        }
      }

      const char = this.peek();

      if (char === " " || char === "\t") {
        this.advance();
        continue;
      }

      if (char === "\n") {
        this.scanNewline();
        continue;
      }

      if (char === "#") {
        this.scanComment();
        continue;
      }

      if (isIdentifierStart(char)) {
        this.scanIdentifier();
        continue;
      }

      if (isDigit(char)) {
        this.scanNumber();
        continue;
      }

      if (char === "'" || char === '"') {
        this.scanString();
        continue;
      }

      this.scanOperatorOrPunctuation();
    }

    this.closeOpenLine();

    while (this.indents.length > 1) {
      this.indents.pop();
      this.pushSynthetic("DEDENT");
    }

    this.pushSynthetic("EOF");
    return this.tokens;
  }

  private scanIndentation(): void {
    let width = 0;

    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === " ") {
        width += 1;
        this.advance();
        continue;
      }
      if (char === "\t") {
        width += 8 - (width % 8);
        this.advance();
        continue;
      }
      break;
    }

    const next = this.peek();
    if (next === "\n" || next === "#") {
      return;
    }

    if (this.parenDepth > 0) {
      this.atLineStart = false;
      return;
    }

    const currentIndent = this.indents[this.indents.length - 1] ?? 0;
    if (width > currentIndent) {
      this.indents.push(width);
      this.pushSynthetic("INDENT");
    } else if (width < currentIndent) {
      while (this.indents.length > 1 && width < (this.indents[this.indents.length - 1] ?? 0)) {
        this.indents.pop();
        this.pushSynthetic("DEDENT");
      }

      if (width !== (this.indents[this.indents.length - 1] ?? 0)) {
        this.fail("Inconsistent indentation");
      }
    }

    this.atLineStart = false;
  }

  private scanNewline(): void {
    const start = this.location();
    this.advance();
    if (this.parenDepth === 0 && this.pendingLineHasTokens) {
      this.addToken("NEWLINE", "\n", null, start);
    }
    this.pendingLineHasTokens = false;
    this.atLineStart = true;
  }

  private scanComment(): void {
    if (this.match("###")) {
      this.advance();
      this.advance();
      this.advance();
      while (!this.isAtEnd() && !this.match("###")) {
        this.advance();
      }
      if (this.isAtEnd()) {
        this.fail("Unterminated multi-line comment");
      }
      this.advance();
      this.advance();
      this.advance();
      return;
    }

    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
  }

  private scanIdentifier(): void {
    const start = this.location();
    let lexeme = "";

    while (!this.isAtEnd() && isIdentifierPart(this.peek())) {
      lexeme += this.advance();
    }

    if (lexeme === "true") {
      this.addToken("TRUE", lexeme, true, start);
      return;
    }
    if (lexeme === "false") {
      this.addToken("FALSE", lexeme, false, start);
      return;
    }
    if (lexeme === "null") {
      this.addToken("NULL", lexeme, null, start);
      return;
    }
    if (lexeme === "and") {
      this.addToken("AND", lexeme, lexeme, start);
      return;
    }
    if (lexeme === "or") {
      this.addToken("OR", lexeme, lexeme, start);
      return;
    }
    if (lexeme === "not") {
      this.addToken("NOT", lexeme, lexeme, start);
      return;
    }

    this.addToken(keywords.has(lexeme) ? "KEYWORD" : "IDENTIFIER", lexeme, lexeme, start);
  }

  private scanNumber(): void {
    const start = this.location();
    let lexeme = "";

    while (!this.isAtEnd() && isDigit(this.peek())) {
      lexeme += this.advance();
    }

    if (this.peek() === "." && isDigit(this.peekNext())) {
      lexeme += this.advance();
      while (!this.isAtEnd() && isDigit(this.peek())) {
        lexeme += this.advance();
      }
    }

    if (this.peek().toLowerCase() === "e") {
      const sign = this.peekNext();
      const digitOffset = sign === "+" || sign === "-" ? 2 : 1;
      if (isDigit(this.peekAt(digitOffset))) {
        lexeme += this.advance();
        if (this.peek() === "+" || this.peek() === "-") {
          lexeme += this.advance();
        }
        while (!this.isAtEnd() && isDigit(this.peek())) {
          lexeme += this.advance();
        }
      }
    }

    this.addToken("NUMBER", lexeme, Number(lexeme), start);
  }

  private scanString(): void {
    const quote = this.peek();
    const start = this.location();
    let lexeme = "";
    let value = "";

    if (quote === '"' && this.match('"""')) {
      lexeme += this.advance();
      lexeme += this.advance();
      lexeme += this.advance();
      while (!this.isAtEnd() && !this.match('"""')) {
        const char = this.advance();
        lexeme += char;
        value += char;
      }
      if (this.isAtEnd()) {
        this.fail("Unterminated multi-line string", start);
      }
      lexeme += this.advance();
      lexeme += this.advance();
      lexeme += this.advance();
      this.addToken(value.includes("{") && value.includes("}") ? "STRING_TEMPLATE" : "STRING", lexeme, value, start);
      return;
    }

    lexeme += this.advance();
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\n") {
        this.fail("Unterminated string", start);
      }
      const char = this.advance();
      lexeme += char;
      if (char === "\\") {
        if (this.isAtEnd()) {
          this.fail("Unterminated escape sequence", start);
        }
        const escaped = this.advance();
        lexeme += escaped;
        value += decodeEscape(escaped);
      } else {
        value += char;
      }
    }

    if (this.isAtEnd()) {
      this.fail("Unterminated string", start);
    }

    lexeme += this.advance();
    this.addToken(value.includes("{") && value.includes("}") ? "STRING_TEMPLATE" : "STRING", lexeme, value, start);
  }

  private scanOperatorOrPunctuation(): void {
    const start = this.location();
    const two = `${this.peek()}${this.peekNext()}`;

    if (two === "=>") {
      this.advance();
      this.advance();
      this.addToken("ARROW", two, two, start);
      return;
    }
    if (two === "==") {
      this.advance();
      this.advance();
      this.addToken("EQ", two, two, start);
      return;
    }
    if (two === "!=") {
      this.advance();
      this.advance();
      this.addToken("NE", two, two, start);
      return;
    }
    if (two === ">=") {
      this.advance();
      this.advance();
      this.addToken("GTE", two, two, start);
      return;
    }
    if (two === "<=") {
      this.advance();
      this.advance();
      this.addToken("LTE", two, two, start);
      return;
    }
    if (two === "&&") {
      this.advance();
      this.advance();
      this.addToken("AND", two, two, start);
      return;
    }
    if (two === "||") {
      this.advance();
      this.advance();
      this.addToken("OR", two, two, start);
      return;
    }
    if (two === "?.") {
      this.advance();
      this.advance();
      this.addToken("QUESTION", "?", "?", start);
      this.addToken("DOT", ".", ".", { ...start, column: start.column + 1, index: start.index + 1 });
      return;
    }

    const char = this.advance();
    if (char === "!") {
      this.addToken("NOT", char, char, start);
      return;
    }

    const type = singleCharTokens[char];
    if (!type) {
      this.fail(`Unexpected character ${JSON.stringify(char)}`, start);
    }

    if (type === "LPAREN" || type === "LBRACKET" || type === "LBRACE") {
      this.parenDepth += 1;
    } else if (type === "RPAREN" || type === "RBRACKET" || type === "RBRACE") {
      this.parenDepth = Math.max(0, this.parenDepth - 1);
    }

    this.addToken(type, char, char, start);
  }

  private closeOpenLine(): void {
    if (this.pendingLineHasTokens && this.lastToken()?.type !== "NEWLINE") {
      this.pushSynthetic("NEWLINE");
      this.pendingLineHasTokens = false;
    }
  }

  private addToken(type: TokenType, lexeme: string, value: Token["value"], start: SourceLocation): void {
    this.tokens.push({
      type,
      lexeme,
      value,
      start,
      end: this.location(),
    });

    if (type !== "NEWLINE" && type !== "INDENT" && type !== "DEDENT" && type !== "EOF") {
      this.pendingLineHasTokens = true;
    }
  }

  private pushSynthetic(type: TokenType): void {
    const location = this.location();
    this.tokens.push({
      type,
      lexeme: "",
      value: null,
      start: location,
      end: location,
    });
  }

  private advance(): string {
    const char = this.source[this.index] ?? "";
    this.index += 1;
    if (char === "\n") {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
    return char;
  }

  private peek(): string {
    return this.source[this.index] ?? "\0";
  }

  private peekNext(): string {
    return this.peekAt(1);
  }

  private peekAt(offset: number): string {
    return this.source[this.index + offset] ?? "\0";
  }

  private match(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  private isAtEnd(): boolean {
    return this.index >= this.source.length;
  }

  private location(): SourceLocation {
    return {
      line: this.line,
      column: this.column,
      index: this.index,
    };
  }

  private lastToken(): Token | undefined {
    return this.tokens[this.tokens.length - 1];
  }

  private fail(message: string, location = this.location()): never {
    throw new CocoSyntaxError(message, location);
  }
}

export function tokenize(source: string, options?: TokenizeOptions): Token[] {
  return new Lexer(source, options).tokenize();
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

function decodeEscape(char: string): string {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "\\":
      return "\\";
    case '"':
      return '"';
    case "'":
      return "'";
    default:
      return char;
  }
}
