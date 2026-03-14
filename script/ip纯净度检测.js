// ip.js - 添加请求头版
function parseIPInfoFromHTML(html) {
    let ip = "未检测到IP";
    // 更通用的IP匹配（匹配第一个出现的IPv4地址）
    let ipMatch = html.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    if (ipMatch) ip = ipMatch[0];

    // 判断是否纯净（关键词需根据实际网页调整）
    let isClean = html.includes("干净") && !html.includes("数据中心") && !html.includes("代理");

    let location = "未知";
    let locMatch = html.match(/所在地[：:]\s*([^<]+)/);
    if (locMatch) location = locMatch[1].trim();

    return { ip, isClean, location };
}

function main() {
    console.log("脚本开始执行");

    // 设置请求头，模拟 Chrome 浏览器
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    };

    // 尝试使用 HTTPS 访问（更现代）
    $httpClient.get({
        url: "https://ippure.com",
        headers: headers
    }, function(error, response, data) {
        if (error) {
            console.log("请求失败: " + error);
            $notification.post("IP检测", "错误", error);
            $done();
            return;
        }
        console.log("HTTP状态码: " + response.status);
        if (response.status !== 200) {
            $notification.post("IP检测", "错误", "状态码 " + response.status);
            $done();
            return;
        }
        console.log("响应内容长度: " + data.length);
        const info = parseIPInfoFromHTML(data);
        console.log("解析结果: " + JSON.stringify(info));
        let msg = `IP: ${info.ip}\n位置: ${info.location}\n状态: ${info.isClean ? "✅纯净" : "⚠️非纯净"}`;
        $notification.post("IP纯净度检测", msg, "");
        $done();
    });
}

main();