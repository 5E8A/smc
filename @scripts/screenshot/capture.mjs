/* global document, window */
const SCROLL_SETTLE_MS = 120;
const FINAL_SETTLE_MS = 600;
const MENU_SETTLE_MS = 400;

const openMobileMenu = async (page) => {
  const button = page.getByRole("button", { name: "Open main menu" });
  await button.click();
  await page.waitForTimeout(MENU_SETTLE_MS);
  await page.locator("nav div.md\\:hidden a").first().waitFor({ state: "visible", timeout: 5000 });
};

const scrollLazyContent = async (page) => {
  const { height, viewportHeight } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  for (let y = 0; y < height; y += viewportHeight) {
    await page.evaluate((offset) => window.scrollTo(0, offset), y);
    await page.waitForTimeout(SCROLL_SETTLE_MS);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0), {
      timeout: 15000,
    })
    .catch(() => {});
  await page.waitForTimeout(FINAL_SETTLE_MS);
};

export const capturePage = async (context, { url, fullPath, foldPath, openMenu }) => {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 20000 });
    } catch {
      // third-party stat APIs may stall - proceed once the page has settled
    }
    await page.evaluate(() => document.fonts.ready);
    if (openMenu) await openMobileMenu(page);
    await scrollLazyContent(page);
    if (foldPath) await page.screenshot({ path: foldPath });
    await page.screenshot({ path: fullPath, fullPage: true });
  } finally {
    await page.close();
  }
};
