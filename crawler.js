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


    var wordCounts = {};
    var words = $('body').text().split(/\W/)

    // console.log(words)

    var badWords = ['the', 'and', ' ', 'a', 'an', '', 'by', 'to', 'of', 'is', 'was', 'in', 'The', 'with', 'that', 'on', 'as', 'from', 's', 'edit', 'In', 'var', 'if', 'for', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'function', '0', 'document', 'ext', 'jquery']

    for (var i = 0; i < words.length; i++) {

      if (badWords.indexOf(words[i]) === -1) {

        wordCounts[words[i]] = (wordCounts[words[i]] || 0) + 1;
      }
    }

    keysSorted = Object.keys(wordCounts).sort(function(a, b) {
      return wordCounts[b] - wordCounts[a]
    })
    // console.log(keysSorted.slice(0, 10)); // bar,me,you,foo

    pageObj['topWords'] = keysSorted.slice(0, 10)

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
