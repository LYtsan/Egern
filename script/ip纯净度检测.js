// ip.js - 适配 pingip.cn 版本
function parseIPInfoFromHTML(html) {
    // 1. 提取 IP 地址
    let ip = "未检测到IP";
    // 匹配 "IP 地址 | 192.168.1.1" 这种格式
    let ipMatch = html.match(/IP\s*地址\s*[|:]\s*([0-9.]+)/);
    if (ipMatch) ip = ipMatch[1];

    // 2. 提取地理位置 (通常是 "国家 城市")
    let location = "未知";
    let locMatch = html.match(/地理位置\s*[|:]\s*([^<]+)/);
    if (locMatch) location = locMatch[1].trim();

    // 3. 提取风险评分 (这是判断纯净度的关键)
    let risk = "未知";
    // 匹配 "风险 | 低风险" 或 "风险 | 高风险" 等
    let riskMatch = html.match(/风险[^|]*[|:]\s*([^<]+)/);
    if (riskMatch) risk = riskMatch[1].trim();

    // 4. 根据风险评级判断是否"纯净"
    // 如果显示"低风险"或"干净"，认为是纯净；否则标记为可疑
    let isClean = risk.includes("低风险") || risk.includes("干净") || risk.includes("正常");

    return { ip, location, risk, isClean };
}

function main() {
    console.log("脚本开始执行，目标: pingip.cn");

    // 模拟 Chrome 浏览器的请求头
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    };

    $httpClient.get({
        url: "https://pingip.cn",
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

        // 构建通知消息
        let message = `🌐 IP: ${info.ip}\n`;
        message += `📍 位置: ${info.location}\n`;
        message += `⚠️ 风险: ${info.risk}\n`;
        message += `✨ 状态: ${info.isClean ? "✅ 纯净 (低风险)" : "⚠️ 非纯净 (中/高风险)"}`;

        $notification.post("IP纯净度检测", message, "来自 pingip.cn");
        $done();
    });
}

main();