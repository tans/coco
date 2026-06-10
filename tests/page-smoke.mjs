import { chromium } from "playwright";

const targetUrl = process.env.COCO_PAGE_URL ?? "http://127.0.0.1:4173";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleIssues = [];

page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    consoleIssues.push(`${message.type()}: ${message.text()}`);
  }
});

await page.goto(targetUrl, { waitUntil: "networkidle" });

const title = await page.title();
const h1 = await page.locator("h1").innerText();

await page.locator('[data-token="operator"]').click();

const preview = await page.locator("#token-preview").innerText();
const selected = await page.locator(".token-card.selected").innerText();

if (title !== "Coco Language") {
  throw new Error(`Expected title "Coco Language", got ${JSON.stringify(title)}`);
}

if (!h1.includes("Coco language tooling")) {
  throw new Error(`Unexpected h1: ${JSON.stringify(h1)}`);
}

if (selected !== "Operators") {
  throw new Error(`Expected Operators selected, got ${JSON.stringify(selected)}`);
}

if (!preview.includes("ARROW") || !preview.includes("PIPE")) {
  throw new Error(`Operator preview did not render expected tokens: ${preview}`);
}

if (consoleIssues.length > 0) {
  throw new Error(consoleIssues.join("\n"));
}

console.log(
  JSON.stringify(
    {
      url: targetUrl,
      title,
      h1,
      selected,
      consoleIssues: consoleIssues.length,
    },
    null,
    2,
  ),
);

await browser.close();
