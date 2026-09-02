import { chromium } from "playwright";
import sharp from "sharp";

const browser = await chromium.launch();
const dir = "C:/Users/KacperStoltmann/Documents/projects/smc/@web/public/assets/static";

const hideCss = `
  a[href="#mods-showcase"],
  section:has(a[href*="sparkedhost"]),
  #mods-showcase,
  #latest,
  footer { display: none !important; }
`;

for (const lang of ["en", "pl"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:3000/smc/${lang}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: hideCss });
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));

  const buf = await page.screenshot({ type: "png" });
  await page.close();

  const out = `${dir}/og-default${lang === "pl" ? "-pl" : ""}.png`;
  await sharp(buf)
    .resize(1200, 630, { fit: "cover", position: "top" })
    .png()
    .toFile(out);
  console.log(`Saved ${lang}`);
}

await browser.close();
