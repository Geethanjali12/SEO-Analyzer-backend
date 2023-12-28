const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
// const SeoModel = require('../models/SeoModel');
const isValidUrl = (url) => {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return urlPattern.test(url);
};
const urlSeoController = {
  postSeoUrl: async (req, res) => {
    const { url } = req.body;
    try {
    if (!url) {
        return res.status(400).json({ 
            status_code: 400,
            status: false,
            error: 'URL is required' 
        });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({
        status_code: 400,
        status: false,
        error: 'Invalid URL format',
      });
    }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const htmlContent = await page.content();

      const $ = cheerio.load(htmlContent);
      const seoResult = {
        url,
        metaKeywords: {
          content: $('meta[name=keywords]').attr('content') || null,
          status: Boolean($('meta[name=keywords]').attr('content')),
        },
        metaDescription: {
          content: $('meta[name=description]').attr('content') || null,
          status: Boolean($('meta[name=description]').attr('content')),
        },
        h1Heading: {
          content: $('h1').text() || null,
          status: Boolean($('h1').text()),
        },
        created_at: new Date(),
      };
      // await SeoModel.create(seoResult);
      await browser.close();
      res.json({
        status_code: 200,
        status: true,
        message: 'Details Retrieved successfully',
        data: seoResult,
      })
      // return {
      //   status_code: 200,
      //   status: true,
      //   message: 'Details Retrieved successfully',
      //   data: seoResult,
      // };
    } catch (error) {
        const statusCode = error.status || 500;
        const errorMessage = error.message || 'Internal Server Error';
        return {
          status_code: statusCode,
          status: false,
          error: errorMessage,
        };
    }
  },
};

module.exports = urlSeoController;
