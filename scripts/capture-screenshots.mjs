import { chromium } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = "docs/screenshots";

async function capture(page, path, fileName, wait = 600) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  await page.screenshot({
    path: `${outputDir}/${fileName}`,
    fullPage: true,
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

try {
  await capture(page, "/", "home-readme.png");
  await capture(page, "/inquiries", "inquiries-list-readme.png");
  await capture(page, "/inquiries/sample-billing-001", "inquiry-detail-readme.png");
  await capture(page, "/inquiries/sample-trouble-001", "inquiry-insights-readme.png");
  await capture(page, "/inquiries/sample-billing-001", "audit-log-readme.png");
  await capture(page, "/dashboard", "dashboard-readme.png");
} finally {
  await browser.close();
}
