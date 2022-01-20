import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

(async () => {
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 10
    });
    const page = await browser.newPage();

    await page.goto("https://jec.fyi/demo/recorder");
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector("aria/your email");
        await element.type("example@example.org");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector("aria/your name");
        await element.type("John");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector("aria/your age");
        await element.type("23");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector("html > body > main > form");
        await element.evaluate(form => form.submit());
    }
    await browser.close();
})();

