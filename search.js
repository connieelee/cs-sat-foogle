var pg = require('pg');
var postgresUrl = 'postgres://localhost:5432/webcrawler';
var Sequelize = require('Sequelize');
var sequelize = new Sequelize('postgres://localhost:5432/webcrawler');
var client = new pg.Client(postgresUrl);
var chalk = require('chalk');
var elasticlunr = require('elasticlunr');

var userQuery = 'Cheerios',
cleanQuery = userQuery.replace(/\W+/g, " ");
// change to lowerCase

//to do later filter out stopWordsFilter
// var stopWordsArray = array.prototype.slice().apply(stopWordsFilter);

var filteredQuery = cleanQuery;
client.connect();

var index = elasticlunr(function () {
   this.addField('title');
   this.addField('topWords')
   this.setRef('title');
});


sequelize.query('SELECT id, title, "topWords" FROM pages WHERE "title" LIKE ?',   { replacements: ['\%' + filteredQuery + '\%'], type: sequelize.QueryTypes.SELECT })
.then(function(pageTitles){
     console.log(chalk.green('Here are your results'));

     var count = 0;
     pageTitles.forEach(function(pageTitle){
           var cleanContent = pageTitle.topWords.join(', ');
           var doc  = {
               "title" : pageTitle.title,
               "topWords": cleanContent
           }
         count++;
         index.addDoc(doc);
     });

     console.log(chalk.green('We got this many results ', count))
     console.log(chalk.blue('heres the clean query'), cleanQuery)
     console.log(chalk.blue('elasticlunr at work'), index.search(cleanQuery));
})
.catch(function(err){
   console.log(chalk.red('heres the error '), err)
})
