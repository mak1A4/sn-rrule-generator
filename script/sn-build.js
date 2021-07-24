const fs = require('fs');
const YAML = require('yaml');
const cheerio = require('cheerio');
const configObj = YAML.parse(fs.readFileSync('./sn.deploy.config.yml', 'utf-8'));
const apiPath = configObj.apiPath + configObj.uiPageName;

var indexHtml = fs.readFileSync("./dist/index.html", "utf-8");
var $ = cheerio.load(indexHtml, {}, false);

$("link").each((i, el) => {
    var hrefStr = $(el).attr("href");
    $(el).attr("href", apiPath + "?file=" + hrefStr.substr(1));
});
$("script").each((i, el) => {
    var srcStr = $(el).attr("src");
    $(el).attr("src", apiPath + "?file=" + srcStr.substr(1));
});

var finalHtmlStr = $.html();
console.log(finalHtmlStr);
var uiPage = fs.readFileSync("./src/ui_page.xml");
$ = cheerio.load(uiPage, {}, false);
$("#app").replaceWith(finalHtmlStr);
var finalUiPageStr = $.html();

fs.writeFileSync("./dist/ui_page.xml", finalUiPageStr);
