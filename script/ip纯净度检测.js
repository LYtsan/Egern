// ip.js - 适配 pingip.cn (增强解析版)
function parseIPInfoFromHTML(html) {
    // 辅助函数：使用多个正则尝试匹配
    function extract(pattern, str, defaultValue = "未知") {
        let match = str.match(pattern);
        return match ? match[1].trim() : defaultValue;
    }

    // 1. 提取 IP 地址
    // 尝试匹配常见格式： "IP 地址</td><td>1.2.3.4" 或 "IP 地址 | 1.2.3.4"
    let ip = extract(/IP\s*地址[：:|\s]*<\/?[^>]*>\s*([0-9.]+)/i, html);
    if (ip === "未知") {
        // 后备：直接匹配页面中第一个出现的IPv4地址
        let fallback = html.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
        ip = fallback ? fallback[1] : "未检测到IP";
    }

    // 2. 提取地理位置
    let location = extract(/地理位置[：:|\s]*<\/?[^>]*>\s*([^<]+)/i, html);
    if (location === "未知") {
        // 可能显示为 "中国 北京"
        let locMatch = html.match(/(?:[>]?\s*)([\u4e00-\u9fa5]+\s*[\u4e00-\u9fa5]*)(?=<\/)/);
        location = locMatch ? locMatch[1] : "未知";
    }

    // 3. 提取风险评级
    let risk = extract(/风险[^>]*>[^<]*<\/[^>]*>\s*([^<]+)/i, html);
    if (risk === "未知") {
        // 直接查找 "低风险"、"高风险" 等关键词
        let riskMatch = html.match(/(低风险|高风险|干净|可疑|正常)/);
        risk = riskMatch ? riskMatch[1] : "未知";
    }

    // 4. 判断是否纯净
    let isClean = risk.includes("低风险") || risk.includes("干净") || risk.includes("正常");

    // 调试：打印部分HTML前500字符
    console.log("HTML片段: " + html.substring(0, 500).replace(/\s+/g, ' '));

    return { ip, location, risk, isClean };
}

function main() {
    console.log("脚本开始执行，目标: pingip.cn");

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

        let message = `🌐 IP: ${info.ip}\n`;
        message += `📍 位置: ${info.location}\n`;
        message += `⚠️ 风险: ${info.risk}\n`;
        message += `✨ 状态: ${info.isClean ? "✅ 纯净 (低风险)" : "⚠️ 非纯净 (中/高风险)"}`;

        $notification.post("IP纯净度检测", message, "来自 pingip.cn");
        $done();
    });
}

main();