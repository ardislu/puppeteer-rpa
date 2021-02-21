const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 10
    });
    const page = await browser.newPage();

    await page.goto("http://www.rpachallenge.com/");
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelFirstName"]');
        await element.type("John");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelLastName"]');
        await element.type("Doe");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelEmail"]');
        await element.type("example@example.org");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelPhone"]');
        await element.type("1234567890");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelCompanyName"]');
        await element.type("Conteso");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelAddress"]');
        await element.type("123 Fake Rd");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector('input[ng-reflect-name="labelRole"]');
        await element.type("Boss");
    }
    {
        const targetPage = page;
        const frame = targetPage.mainFrame();
        const element = await frame.waitForSelector("aria/Submit");
        await element.click();
    }
    await browser.close();
})();

