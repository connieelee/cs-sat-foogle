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
let urlQueue = []

function seedQueue() {
  Queue.findAll({
    limit: 100
  }).then(function(links) {
    let rawQueue = links;
    urlQueue = rawQueue.map(function(item) {
      return item.url;
    })
    rawQueue.forEach(function(item) {
      item.destroy();
    });
  })
}


function crawlPage(url) {

  if (pagesCrawled[url] !== undefined) return;

  turtle.request({
    method: "GET",
    uri: url,
    resolveWithFullResponse: true
  }).then(function(fullResponse) {

    let $ = cheerio.load(fullResponse.body);

    let pageObj = {};

    if (domainsRegistered[fullResponse.request.uri.host] === undefined) {
      domainsRegistered[fullResponse.request.uri.host] = 'something'
      let domainObj = {
        name: fullResponse.request.uri.host
      }
      var domain = Domain.create(domainObj)
    }


    pageObj['status'] = fullResponse.request.responseContent.statusCode;
    pageObj['title'] = $('title').text();
    pageObj['textContent'] = $('body').text()
    pageObj['url'] = fullResponse.request.uri.href

    var page = Page.create(pageObj)


    let allA = $('#bodyContent').find('a')
    for (let i = 0; i < allA.length; i++) {
      let url = allA[i].attribs.href
      if (url[0] === '#') {
        continue;
      }
      if (url.slice(0, 6) === '/wiki/') {
        url = 'http://en.wikipedia.org'.concat(url)
      }
      Queue.create({
        url: url
      })
    }
  })
    .then(function() {
      if (urlQueue.length === 0) {
        setTimeout(seedQueue, 1000);
      }
      crawlPage(urlQueue.shift())
    })
    .catch(function(error) {
      console.log('you fucked up cuz', error)
    });
}

crawlPage(firstUrl);
