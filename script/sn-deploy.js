const fs = require('fs');
const YAML = require('yaml');
const mime = require("mime-types");
const oauth = require('sn-oauth').default;
const axios = require('axios').default;
const configObj = YAML.parse(fs.readFileSync('./sn.config.yml', 'utf-8'));

const tokenPath = './.sn-token';
var accessToken, instanceUrl, tableApiUrl;
if (fs.existsSync(tokenPath)) {
  let tokenObj = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  instanceUrl = "https://" + tokenObj.instanceName + ".service-now.com";
  tableApiUrl = `${instanceUrl}/api/now/table`;
  accessToken = tokenObj.accessToken;
}

async function getUiPageRecord(name, authHeader) {
  try {
    let getUrl = `${tableApiUrl}/sys_ui_page?sysparm_query=name=${name}`;
    let response = await axios.get(getUrl, { headers: authHeader });
    return {
      "result": response.data.result[0],
      "status": response.status
    };
  } catch (err) {
    if (err.response.status) return { "status": 401 };
  }
}

async function deployUiPage(method, name, authHeader, uiPageSysId) {
  try {
    let postUrl = `${tableApiUrl}/sys_ui_page`;
    if (method == "PUT" && uiPageSysId) {
      postUrl += "/" + uiPageSysId;
    }
    let response = await axios({
      "method": method,
      "url": postUrl,
      "data": JSON.stringify({
        "name": name,
        "direct": true,
        "html": fs.readFileSync("./dist/ui_page.xml", "utf-8")
      }),
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": authHeader["Authorization"]
      }
    });
    return {
      "result": response.data.result,
      "status": response.status
    };
  } catch (err) {
    console.log(err);
  }
}

async function deployUiPageAttachments(uiPageSysId, authHeader) {
  let attachmentApiUrl = `${instanceUrl}/api/now/attachment`;
  let getUrl = `${attachmentApiUrl}?sysparm_query=table_name=sys_ui_page^table_sys_id=${uiPageSysId}`
  let attachmentResponse = await axios.get(getUrl, { headers: authHeader });
  for (const attm of attachmentResponse.data.result) {
    await axios({
      "method": "DELETE",
      "url": `${attachmentApiUrl}/${attm.sys_id}`,
      "headers": authHeader
    });
  }

  var fileList = fs.readdirSync("./dist", "utf-8").filter((f) => {
    if (f.endsWith(".js") || f.endsWith(".css")) return true;
    return false;
  }).map((f) => {
    var fpath = `./dist/${f}`;
    return {
      "name": f,
      "contentType": mime.lookup(fpath),
      "content": fs.readFileSync(fpath, "utf-8")
    };
  });

  var result = [];
  for (const fileObj of fileList) {
    try {
      var postUrl = `${attachmentApiUrl}/file?table_name=sys_ui_page&table_sys_id=${uiPageSysId}&file_name=${fileObj.name}`;
      var insertResponse = await axios({
        "method": "POST",
        "url": postUrl,
        "data": Buffer.from(fileObj.content, "utf-8"),
        "headers": {
          "Accept": "application/json",
          "Content-Type": fileObj.contentType,
          "Authorization": authHeader["Authorization"]
        }
      });
      result.push(insertResponse.data);
    } catch (err) {
      console.log(err);
    }
  }
  return result;
}

(async function () {
  if (!fs.existsSync(tokenPath)) {
    let tokenObj = await oauth();
    instanceUrl = "https://" + tokenObj.instanceName + ".service-now.com";
    tableApiUrl = `${instanceUrl}/api/now/table`;
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(tokenPath, JSON.stringify(tokenObj));
  }
  var authHeader = { 'Authorization': `Bearer ${accessToken}` }
  var uiPageResult = await getUiPageRecord(configObj.uiPageName, authHeader);
  if (uiPageResult.status == 401) {
    let tokenObj = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    tokenObj = await oauth(tokenObj.instanceName, tokenObj.clientId, tokenObj.clientSecret, tokenObj.refreshToken);
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(tokenPath, JSON.stringify(tokenObj));
    uiPageResult = await getUiPageRecord(configObj.uiPageName, authHeader);
  }
  if (!uiPageResult.result) {
    uiPageResult = await deployUiPage("POST", configObj.uiPageName, authHeader);
  } else {
    uiPageResult = await deployUiPage("PUT", configObj.uiPageName, authHeader, uiPageResult.result.sys_id);
  }
  var attmResult = await deployUiPageAttachments(uiPageResult.result.sys_id, authHeader);
  console.log("Finished with deployment of UI-Page and " + attmResult.length + " attachments.");
})();