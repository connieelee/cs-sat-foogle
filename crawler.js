const Page = require('./index.js').Page
const Domain = require('./index.js').Domain
const Sequelize = require('sequelize');
const RequestTurtle = require('request-turtle');
const cheerio = require('cheerio')
const turtle = new RequestTurtle({
  limit: 1000
}); // limit rate to 300ms. this is the default

let urlsToCrawl = ['https://en.wikipedia.org/wiki/Cheerios?oldformat=true']


function crawlPage(url) {

  turtle.request({
    method: "GET",
    uri: url,
    resolveWithFullResponse: true
  }).then(function(fullResponse) {

    let $ = cheerio.load(fullResponse.body);

    let pageObj = {};
    let domainObj = {
      name: fullResponse.request.uri.host
    }

    pageObj['status'] = fullResponse.request.responseContent.statusCode;
    pageObj['title'] = $('title').text();
    pageObj['textContent'] = $('body').text()
    pageObj['url'] = fullResponse.request.uri.href

    var page = Page.create(pageObj)
      // var domain = Domain.build(domainObj)
      // page.addDomain(domain, domainObj)
      // page.save()

    let allA = $('#bodyContent').find('a')
    for (let i = 0; i < allA.length; i++) {
      let url = allA[i].attribs.href
      if (url[0] === '#') {
        continue;
      }
      if (url.slice(0, 6) === '/wiki/') {
        url = 'http://en.wikipedia.org'.concat(url)
      }
      urlsToCrawl.push(url);
    }
  })
    .catch(function(error) {
      console.log('you fucked up cuz', error)
    });

  // urlsToCrawl.forEach(function(url) {
  //   crawlPage(url)
  // })
}
urlsToCrawl.forEach(function(url) {
  crawlPage(url)
})
