// ip.js - 基于 pingip.cn 源码的精确提取版
function parseIPInfoFromHTML(html) {
    // 辅助函数：通过元素的 id 提取内容
    function extractByPattern(pattern, defaultValue = "未知") {
        let match = html.match(pattern);
        return match ? match[1].trim() : defaultValue;
    }

    // 1. 提取 IP 地址 (基于 id="ipinfo-ip")
    let ip = extractByPattern(/<span[^>]*id="ipinfo-ip"[^>]*>([^<]+)<\/span>/i);
    if (ip === "未知" || ip.includes("加载中")) {
        // 后备：直接匹配第一个 IPv6 或 IPv4 地址
        let fallback = html.match(/\b([0-9a-f:]+:[0-9a-f:]+|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\b/);
        ip = fallback ? fallback[1] : "未检测到IP";
    }

    // 2. 提取地理位置 (基于 id="ipinfo-location-text")
    let location = extractByPattern(/<span[^>]*id="ipinfo-location-text"[^>]*>([^<]+)<\/span>/i);
    if (location === "未知" || location.includes("加载中")) {
        location = "未知";
    }

    // 3. 提取风险评分 (基于 id="risk-score")
    let risk = extractByPattern(/<span[^>]*id="risk-score"[^>]*>([^<]+)<\/span>/i);
    if (risk === "未知" || risk.includes("加载中")) {
        // 如果没找到，尝试直接匹配 "低风险"、"高风险" 等关键词
        let riskMatch = html.match(/(\d+%\s*[极高|高|中|低|极低]*)/);
        risk = riskMatch ? riskMatch[1] : "未知";
    }

    // 4. 判断是否纯净：基于风险评分中的关键词（如“极低”、“低风险”）
    let isClean = risk.includes("极低") || risk.includes("低风险") || risk.includes("低");

    return { ip, location, risk, isClean };
}

function main() {
    console.log("脚本开始执行，目标: pingip.cn (精确提取版)");

    const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
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