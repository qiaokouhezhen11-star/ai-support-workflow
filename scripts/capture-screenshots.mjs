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
  await capture(page, "/", "home.png");
  await capture(page, "/inquiries", "inquiries-list.png");
  await capture(page, "/inquiries/sample-billing-001", "inquiry-detail.png");
  await capture(page, "/inquiries/sample-trouble-001", "inquiry-insights.png");
  await capture(page, "/inquiries/sample-billing-001", "audit-log.png");
  await capture(page, "/dashboard", "dashboard.png");
} finally {
  await browser.close();
}
