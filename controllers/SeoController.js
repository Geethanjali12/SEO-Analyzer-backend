const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
require('dotenv').config();
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
            message: 'URL is required' 
        });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({
        status_code: 400,
        status: false,
        message: 'Invalid URL format',
      });
    }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const htmlContent = await page.content();

      const $ = cheerio.load(htmlContent);

      // Function to extract keywords from the document content
      function extractMostUsedKeywords(limit = 10) {
        const documentText = $('body').text().toLowerCase();
        const words = documentText.match(/\b\w+\b/g) || [];
        const eliminateWords = new Set(['the', 'to', 'you', 'is', 'from', 'in', 'a', 'an', 'can', 'and', 'with', 'use', 'want', 'by', 'that']);
        const keywordMap = {};
        words.forEach(word => {
            if (!eliminateWords.has(word)) {
                keywordMap[word] = (keywordMap[word] || 0) + 1;
            }
        });
        const sortedKeywords = Object.keys(keywordMap).sort((a, b) => keywordMap[b] - keywordMap[a]);
        const mostUsedKeywords = sortedKeywords.slice(0, limit);
        return mostUsedKeywords.join(', ');
    }
    
      // Function to extract image alt attributes
      function getImageAltAttributes() {
        const images = $('img');
        const altAttributes = images.map((index, element) => $(element).attr('alt')).get();
        return altAttributes.join(', ');
      }

      // Function to calculate links ratio
      function calculateLinksRatio() {
        const totalLinks = $('a').length;
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const linksRatio = totalLinks / (textContent.split(' ').length || 1);
        return linksRatio.toFixed(2);
      }

      async function checkRobotsTxt() {
        try {
            const response = await axios.get(`${url}/robots.txt`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async function checkRobotsTxtForXmlSitemap() {
      try {
          const response = await axios.get(`${url}/robots.txt`);
          if (response.status === 200) {
              const lines = response.data.split('\n');
              return lines.some(line => line.trim().toLowerCase().startsWith('sitemap') && line.includes('.xml'));
          }
          return false;
      } catch (error) {
          return false;
      }
    }

    async function fetchSERPPreview(url) {
      console.log('url', url);
      try {
          const key = process.env.GOOGLE_API_KEY;
          console.log('GOOGLE_API_KEY', key);
          if (!key) {
              throw new Error('Google API Key is missing.');
          }
  
          const searchQuery = `site:${url}`;
          const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(searchQuery)}&key=${key}`;
          console.log('apiUrl', apiUrl);
          const response = await axios.get(apiUrl);
          console.log('response', response);
          if (response.status === 200 && response.data.items && response.data.items.length > 0) {
              const firstResult = response.data.items[0];
              const title = firstResult.title;
              const snippet = firstResult.snippet;
  
              return {
                  title,
                  snippet,
              };
          } else if (response.status === 200) {
              return {
                  error: 'No search results found.',
              };
          } else {
              throw new Error(`Error fetching search results. Status Code: ${response.status}`);
          }
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return {
            error: 'Error fetching search results.',
        };
    }
  }

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
        h2Heading: {
          content: $('h2').text() || null,
          status: Boolean($('h2').text()),
        },
        dynamicKeywords: {
          content: extractMostUsedKeywords(10),
          status: Boolean(extractMostUsedKeywords(10)),
        },
        imageAltAttributes: {
          content: getImageAltAttributes(),
          status: Boolean(getImageAltAttributes()),
        },
        linksRatio: {
          content: calculateLinksRatio(),
          status: Boolean(calculateLinksRatio()),
        },
        seoTitle: {
          content: $('title').text() || null,
          status: Boolean($('title').text()),
        },
        canonicalTag: {
          content: $('link[rel=canonical]').attr('href') || null,
          status: Boolean($('link[rel=canonical]').attr('href')),
        },
        noIndexMeta: {
          content: $('meta[name=robots][content*=noindex]').attr('content') || null,
          status: Boolean($('meta[name=robots][content*=noindex]').length),
        },
        robotsTxt: {
          status: await checkRobotsTxt(),
        },
        containsXmlSitemap: {
          status: await checkRobotsTxtForXmlSitemap(),
        },
        serpPreview: await fetchSERPPreview(url),
        created_at: new Date(),
      };
      // await SeoModel.create(seoResult);
      await browser.close();
      res.json({
        status_code: 200,
        status: true,
        message: 'Details Retrieved successfully',
        data: seoResult,
      });
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
          message: errorMessage,
        };
    }
  },
};

module.exports = urlSeoController;
