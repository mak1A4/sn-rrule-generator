const fs = require('fs');
const cheerio = require('cheerio');

var indexHtml = fs.readFileSync("./dist/index.html", "utf-8");
console.log(indexHtml);
var $ = cheerio.load(indexHtml, {
    xmlMode: true
});

$("link").each((i, el) => {
    var hrefStr = $(el).attr("href");
    $(el).attr("href", "/api/swp?file=" + hrefStr.substr(1));
});

console.log($.html());