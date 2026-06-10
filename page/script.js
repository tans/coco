const previews = {
  layout: [
    ["KEYWORD", "if"],
    ["IDENTIFIER", "ok"],
    ["NEWLINE", "\\n"],
    ["INDENT", ""],
    ["IDENTIFIER", "print"],
    ["STRING_TEMPLATE", '"Hello {name}"'],
    ["NEWLINE", "\\n"],
    ["DEDENT", ""],
    ["EOF", ""],
  ],
  literal: [
    ["IDENTIFIER", "age"],
    ["ASSIGN", "="],
    ["NUMBER", "18"],
    ["STRING", '"Tom"'],
    ["TRUE", "true"],
    ["FALSE", "false"],
    ["NULL", "null"],
  ],
  operator: [
    ["EQ", "=="],
    ["NE", "!="],
    ["GTE", ">="],
    ["LTE", "<="],
    ["AND", "and"],
    ["OR", "or"],
    ["NOT", "not"],
    ["ARROW", "=>"],
    ["PIPE", "|"],
  ],
  keyword: [
    ["KEYWORD", "const"],
    ["KEYWORD", "fn"],
    ["KEYWORD", "async"],
    ["KEYWORD", "return"],
    ["KEYWORD", "if"],
    ["KEYWORD", "for"],
    ["KEYWORD", "class"],
    ["KEYWORD", "export"],
  ],
};

const preview = document.querySelector("#token-preview");
const buttons = document.querySelectorAll("[data-token]");

function renderPreview(name) {
  const rows = previews[name] ?? previews.layout;
  preview.textContent = JSON.stringify(
    rows.map(([type, lexeme]) => ({ type, lexeme })),
    null,
    2,
  );
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    for (const item of buttons) {
      item.classList.toggle("selected", item === button);
    }
    renderPreview(button.dataset.token);
  });
}

renderPreview("layout");
