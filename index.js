const Apify = require('apify');
const fs = require('fs');

const PAGE_LOAD_TIME = 5000;
const PAGE_CONTENT_SELECTOR = '.main-content';
const MAX_PAGES = 10;

const url = process.argv.slice(-1)[0];

// delete the request queue because this persists between runs
fs.rmdirSync('apify_storage/request_queues', { recursive: true });

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url });

    const handlePageFunction = async ({ page }) => {
      const title = await page.title();
      console.log(title);

      await page.waitFor(PAGE_LOAD_TIME);

      const element = await page.$(PAGE_CONTENT_SELECTOR);
      const textContent = await element.getProperty('innerText');
      const text = await textContent.jsonValue();
      console.log(text);

      await Apify.utils.puppeteer.enqueueLinksByClickingElements({
        page,
        requestQueue,
        selector: 'a'
      })
    }

    const crawler = new Apify.PuppeteerCrawler({
      requestQueue,
      handlePageFunction,
      maxRequestsPerCrawl: MAX_PAGES,
    });

    await crawler.run();
});