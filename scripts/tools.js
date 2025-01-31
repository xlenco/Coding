var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const crypto = require('crypto');
const { exit } = require('process');
const log = require('hexo-log')({
    debug: false,
    silent: false
  })
// 从环境变量里面拿到github token
const github_token = process.env.GITHUB_TOKEN;

// 找出来所有的描述
var pages = 1;
var is_end = false;
var page_list = [];
var id_list = [];
var used_hash = [];
var Is_Load_Github = false;

function Load_Github(){
    // for 循环找出所有gist
    while (!is_end) {                
        // 首先获取到全部的gist
        var request = new XMLHttpRequest();
        log.info(`GIST: 正在查找第${pages}页`)
        request.open("GET", "https://api.github.com/gists?per_page=100" + `&page=${pages}`, false);
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Authorization", "token " + github_token);
        request.send(null);
        data_json = JSON.parse(request.responseText);
        // 如果没有gist就结束
        if (data_json.length == 0) {
            is_end = true;
            break;
        } else {
            // 如果有gist就把gist加入到page_list
            data_json.forEach(element => {
                page_list.push(element["description"]);
                id_list.push(element["id"]);
            });
            pages = pages + 1;
        }
    }
}
// scripts/plantuml.js
const rBacktick = /^((?:[^\S\r\n]*>){0,3}[^\S\r\n]*)(`{3,}|~{3,})[^\S\r\n]*((?:.*?[^`\s])?)[^\S\r\n]*\n((?:[\s\S]*?\n)?)(?:(?:[^\S\r\n]*>){0,3}[^\S\r\n]*)\2[^\S\r\n]?(\n+|$)/gm;
// 另一种正则：```(\w+?\n)([\s\S]+?)```

hexo.extend.filter.register('before_post_render', function (data) {
    if (!Is_Load_Github){
        Load_Github();
        Is_Load_Github = true;
    }

    const dataContent = data.content;
    if ((!dataContent.includes('```') && !dataContent.includes('~~~'))) return;

    data.content = dataContent.replace(rBacktick, (match, start, $2, _args, _content, end) => {
        let gh_content = _content
            .replace(/\n$/, '')
            .replace(/^>\s/mg, '');
        // 如果有 _args 就用 _args 如果没有就默认为js
        let lang = _args ? _args : 'js';
        lang_list = {
            "javascript": "js",
            "python": "py",
            "SQL": "sql",
            "Python": "py",
            "JavaScript": "js",
            "Javascript": "js",
            "html": "html",
            "HTML": "html",
            "JS": "js",
            "Js": "js"
        }
        lang = lang_list[lang] ? lang_list[lang] : lang;
        const hash = crypto.createHash('md5');
        hash.update(lang, 'utf8');
        hash.update(gh_content, 'utf8');
        const md5 = hash.digest('hex');
        process.stdout.write("INFO  |--MD5--|" + md5 + "|----|");
        if (page_list.includes(md5)) {
            // 推送到used_hash
            used_hash.push(md5);
            // 找到是第几个元素
            let index = page_list.indexOf(md5);
            // 找到对应的id
            var id = id_list[index];
        }else{
            // 如果没有找到就新建一个gist
            console.log("该gist不存在，新建一个gist");
            console.log(gh_content);
            console.log('-------------')
            var id = createGist(md5, gh_content, lang);
            console.log("新建gist，id：" + id);
        }
        console.log('\x1B[32m', "|--ID--|" + id + "|----|")
        // // 查看这个gist的嵌入代码
        // var request = new XMLHttpRequest();
        // let gist_url = "https://gist.github.com/zkeq/" + id + ".js"
        // console.log(gist_url);
        // request.open("GET", gist_url, false);
        // request.send();
        // let gist_code = request.responseText;
        // str = "<script>" + gist_code + "</script>";
            // iframe_ele = document.createElement('iframe');
            // iframe_ele.style = "border:none;width:100%;max-height:50vh";
            // iframe_ele.setAttribute("onload", "javascript:this.style.height=`${this.contentWindow.document.body.offsetHeight}px`;this.contentWindow.document.getElementsByClassName('gist-data')[0].style.height=`${this.clientHeight-65}px`;")
            // iframe_ele.setAttribute("srcdoc", `<head><base target='_blank'/></head><body><script src='https://gist.onmicrosoft.cn/zkeq/${id}.js'></script></body>`)
        // 输出该代码片段一共有几行
        let line_num = gh_content.split('\n').length;
        return `

<iframe 
style="border:none;width:100%;max-height:66vh;"
onload="javascript:this.style.height=\`\${this.contentWindow.document.body.offsetHeight===0?${line_num * 22 + 36}+5:this.contentWindow.document.body.offsetHeight+5}px\`;this.contentWindow.document.getElementsByClassName('gist-data')[0].style.height==\`\${this.clientHeight-40}px\`;setTimeout(() => {this.contentWindow.document.body.offsetHeight===98?this.style.height=\`\${${line_num * 22 + 36}+5}px\`:console.log('Not Safari')}, 1000);"
srcdoc='<meta name="description" content="Instantly share code, notes, and snippets. You can&#39;t perform that action at this time. You signed in with another tab or window. You signed out in another tab or window. Reload to refresh your session. Reload to refresh your session."><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="twitter:widgets:csp" content="on"><meta name="robots" content="noindex"><base target="_blank"><style>body {text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-family: "ff-tisa-web-pro", Georgia, Cambria, "Times New Roman", Times, serif; font-weight: 400; color: #333332; font-size: 18px; line-height: 1.4; margin: 0; background-color: white; overflow: hidden;}iframe {max-width: 100%;}</style></head><body><style>.gist .gist-file { margin-bottom: 0 !important; }.gist { text-rendering: auto; }.gist-meta a:nth-child(2) {display: none;} html {overflow: hidden;text-overflow: ellipsis;display: inline-block;} * {margin: 0}</style><script src="https://gist.onmicrosoft.cn/zkeq/${id}.js" charset="utf-8"></script><script>var height = -1; var delayMs = 200; if (document) {document.domain = document.domain;}function notifyResize(height) {height = height ? height : document.documentElement.offsetHeight; var resized = false; if (window.donkey && donkey.resize) {donkey.resize(height);var elements = document.getElementsByClassName("gist-data"); for (var i = 0; i < elements.length; i++) {elements[i].style.overflow = "visible"}resized = true;}if (parent && parent._resizeIframe) {var obj = {iframe: window.frameElement, height: height}; parent._resizeIframe(obj); resized = true;}if (window.location && window.location.hash === "#amp=1" && window.parent && window.parent.postMessage) {window.parent.postMessage({sentinel: "amp", type: "embed-size", height: height}, "*");}if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.resize) {window.webkit.messageHandlers.resize.postMessage(height); resized = true;} setTimeout(function () { document.getElementsByClassName("gist-data")[0].setAttribute("style", "max-height: 90vh");(document.documentElement.offsetHeight===0||document.documentElement.offsetHeight===98)?document.styleSheets[0].insertRule(".gist .blob-code {white-space: pre  !important;}"):console.log("no need to add css");}, 200);return resized;}function maybeResize() {try {if (document.documentElement.offsetHeight != height && notifyResize()) {height = document.documentElement.offsetHeight;}delayMs = Math.min(delayMs * 2, 1000000); setTimeout(maybeResize, delayMs);} catch(error) {console.log("maybeResize error: ", error)}}maybeResize();</script>'
>
</iframe>

`;
    });
}, 9);

function createGist (md5, gh_content, lang){
    let response = ''
    let requestData = {
        "description": md5,
        "public": false,
        "files": {
            [md5 + "." + lang]: {
                "content": gh_content
            }
        }
    };
    var request = new XMLHttpRequest();
    // POST
    request.open("POST", "https://api.github.com/gists", false);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Authorization", "token " + github_token);
    request.send(JSON.stringify(requestData));
    response = request.responseText;
    // 如果状态码不是200就报错
    if (request.status != 201) {
        console.log(response);
        console.log('\x1B[31m', "|--ERR POST--|" + md5 + "|--ERR POST--|", '\x1B[0m');
        // 当前上传量达到 Github API 限制，请隔一段时间再来上传
        return createGist(md5, gh_content, lang);
    }
    return JSON.parse(response)["id"];
}

function isMd5(str) {
    return /^[a-f0-9]{32}$/i.test(str);
}

function deleteGist(hash) {
    var request = new XMLHttpRequest();
    // DELETE
    request.open("DELETE", `https://api.github.com/gists/${hash}`, false);
    // Accept: application/vnd.github+json
    request.setRequestHeader("Accept", "application/vnd.github+json");
    // X-GitHub-Api-Version: 2022-11-28
    request.setRequestHeader("X-GitHub-Api-Version", "2022-11-28");
    request.setRequestHeader("Authorization", "token " + github_token);
    request.send();
    // 如果状态码不是204就报错
    if (request.status !== 204 && request.status !== 404) {
        console.log('\x1B[31m', "|--ERR DEL--|" + hash + "|----|")
        console.log(request.responseText);
        return deleteGist(hash);
    }else{
        console.log('\x1B[34m', "|--DEL--|" + hash + "|----|")
    }
}


hexo.extend.filter.register('before_exit', function(){
    // for循环遍历所有的gist
    for (let i = 0; i < page_list.length; i++) {
        // 如果 当前项在列表中有重复的，就删除该gist
        if (isMd5(page_list[i]) && page_list.indexOf(page_list[i]) !== i) {
            deleteGist(id_list[i]);
        }
        // 如果在 used_hash 中没有找到该gist的hash，并且该hash是个hash
        if (!used_hash.includes(page_list[i]) && isMd5(page_list[i])) {
            // 删除该gist
            deleteGist(id_list[i]);
        }
    }
  });