const fs = require('fs');
const cheerio = require('cheerio');

var indexHtml = fs.readFileSync("./dist/index.html", "utf-8");
var $ = cheerio.load(indexHtml, {
    xmlMode: true
});

$("link").each((i, el) => {
    var hrefStr = $(el).attr("href");
    $(el).attr("href", "/api/swp?file=" + hrefStr.substr(1));
});
$("script").each((i, el) => {
    var srcStr = $(el).attr("src");
    $(el).attr("src", "/api/swp?file=" + srcStr.substr(1));
});

var finalHtmlStr = $.html();
var uiPage = fs.readFileSync("./src/ui_page.xml");
$ = cheerio.load(uiPage, {
    xmlMode: true
});
$("#app").replaceWith(finalHtmlStr);
var finalUiPageStr = $.html();

fs.writeFileSync("./dist/ui_page.xml", finalUiPageStr);
