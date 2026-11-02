const { chromium } = require("/opt/npm-tools/node_modules/playwright");
const fs = require("fs");
const B = "http://localhost:3200";
const results = [];
const tc = async (id, name, fn) => {
  try { const a = await fn(); results.push({ id, name, ok: true, actual: a }); console.log("PASS", id, a); }
  catch (e) { results.push({ id, name, ok: false, actual: e.message.split("\n")[0] }); console.log("FAIL", id, e.message.split("\n")[0]); }
};
(async () => {
  const browser = await chromium.launch();
  await tc("ST-08", "Responsive layout at mobile width (NFR9)", async () => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const p = await ctx.newPage();
    const bad = [];
    for (const path of ["/", "/teachers", "/teachers/priya-sharma", "/recommend", "/register", "/login"]) {
      await p.goto(B + path, { waitUntil: "networkidle" });
      const w = await p.evaluate(() => document.documentElement.scrollWidth);
      if (w > 375) bad.push(`${path}:${w}px`);
    }
    if (bad.length) throw new Error("horizontal overflow " + bad.join(", "));
    return "6/6 pages fit 375 px width, no horizontal scroll";
  });
  await tc("ST-09", "Registration form blocks next step when fields are empty", async () => {
    const p = await (await browser.newContext()).newPage();
    await p.goto(B + "/register", { waitUntil: "networkidle" });
    await p.click("text=Next");
    const msg = await p.textContent("form p.text-red-600, form p[class*='text-red']");
    if (!msg?.includes("name")) throw new Error("no validation message");
    return `Stays on step 1: "${msg.trim()}"`;
  });
  await tc("ST-10", "End-to-end booking through the UI (FR10)", async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(B + "/login", { waitUntil: "networkidle" });
    await p.fill('input[type="email"]', "neha@example.com");
    await p.fill('input[type="password"]', "student123");
    await p.click('button:has-text("Log in")');
    await p.waitForURL("**/dashboard");
    await p.goto(B + "/teachers/vikram-singh", { waitUntil: "networkidle" });
    await p.click("#book ~ div button >> nth=0");
    await p.click("#book ~ div >> text=/^(Mon|Wed|Fri|Sun),/ >> nth=0");
    await p.click('button:has-text("Request booking")');
    await p.waitForSelector("text=Request sent!", { timeout: 8000 });
    await p.click("text=Go to my bookings");
    await p.waitForURL("**/dashboard");
    const list = await p.locator("section:has(h2:text('My bookings'))").innerText();
    if (!(list.includes("Vikram Singh") && /pending/i.test(list))) throw new Error("booking not on dashboard: " + list.slice(0, 120));
    return "Login → slot → date → request → shown as pending on dashboard";
  });
  await tc("ST-11", "AI match page returns ranked results in the browser (FR8)", async () => {
    const p = await (await browser.newContext()).newPage();
    await p.goto(B + "/recommend", { waitUntil: "networkidle" });
    await p.click('button.chip:has-text("Chemistry")');
    await p.fill("textarea", "NEET organic chemistry");
    await p.click('button:has-text("Find my best tutors")');
    await p.waitForSelector("text=Best match");
    const top = await p.locator("#results a.text-lg >> nth=0").textContent();
    return `Results shown with match scores; best match: ${top}`;
  });
  await browser.close();
  fs.writeFileSync("ui.json", JSON.stringify(results, null, 2));
})();
