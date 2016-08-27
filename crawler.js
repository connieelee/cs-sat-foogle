const Page = require('./index.js').Page
const Domain = require('./index.js').Domain
const Queue = require('./index.js').Queue
const Sequelize = require('sequelize');
const RequestTurtle = require('request-turtle');
const cheerio = require('cheerio')
const turtle = new RequestTurtle({
  limit: 1000
}); // limit rate to 300ms. this is the default

let firstUrl = 'https://en.wikipedia.org/wiki/Cheerios?oldformat=true';

let pagesCrawled = {};
let domainsRegistered = {};


function crawlPage(url) {

  turtle.request({
    method: "GET",
    uri: url,
    resolveWithFullResponse: true
  }).then(function(fullResponse) {

    let $ = cheerio.load(fullResponse.body);

    let pageObj = {};


    pageObj['status'] = fullResponse.request.responseContent.statusCode;
    pageObj['title'] = $('title').text();
    pageObj['textContent'] = $('body').text()
    pageObj['url'] = fullResponse.request.uri.href

    Page.create(pageObj)


    let allA = $('#bodyContent').find('a')
    for (let i = 0; i < allA.length; i++) {
      let url = allA[i].attribs.href
      if (url[0] === '#') {
        continue;
      }
      if (url.slice(0, 4) !== 'http') {
        url = fullResponse.request.uri.host.concat(url)
      }
      crawlPage(url)
    }
  })
    .catch(function(error) {
      console.log('you fucked up cuz', error)
    });
}

crawlPage(firstUrl);
