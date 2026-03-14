// ip.js - pingip.cn 混合模式（HTML + API 探测）
function main() {
    console.log("脚本开始执行，目标: pingip.cn (混合模式)");

    const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9"
    };

    // 第一步：请求 HTML 页面
    $httpClient.get({
        url: "https://pingip.cn",
        headers: headers
    }, function(error, response, data) {
        if (error) {
            $notification.post("IP检测", "错误", error);
            $done();
            return;
        }
        if (response.status !== 200) {
            $notification.post("IP检测", "错误", "状态码 " + response.status);
            $done();
            return;
        }

        console.log("HTML 长度: " + data.length);

        // 尝试从 HTML 中提取 data-real-ip 属性（如果服务器端已填充）
        let realIpMatch = data.match(/data-real-ip=["']([^"']+)["']/);
        if (realIpMatch && realIpMatch[1] && !realIpMatch[1].includes('-')) {
            console.log("从 data-real-ip 提取到 IP: " + realIpMatch[1]);
            let info = extractFromHTML(data);
            sendNotification(info);
            $done();
        } else {
            console.log("HTML 中未找到实际 IP，尝试请求 API");
            tryAPI();
        }
    });

    // 从 HTML 提取信息（备用，当 data-real-ip 存在时使用）
    function extractFromHTML(html) {
        let ip = "未知";
        let realIp = html.match(/data-real-ip=["']([^"']+)["']/);
        if (realIp && realIp[1] && !realIp[1].includes('-')) {
            ip = realIp[1];
        } else {
            let ipMatch = html.match(/<span[^>]*id="ipinfo-ip"[^>]*>([^<]+)<\/span>/);
            ip = ipMatch ? ipMatch[1].trim() : "未检测到IP";
        }

        let location = "未知";
        let locMatch = html.match(/<span[^>]*id="ipinfo-location-text"[^>]*>([^<]+)<\/span>/);
        if (locMatch) location = locMatch[1].trim();

        let risk = "未知";
        let riskMatch = html.match(/<span[^>]*id="risk-score"[^>]*>([^<]+)<\/span>/);
        if (riskMatch) risk = riskMatch[1].trim();

        let isClean = risk.includes("极低") || risk.includes("低风险") || risk.includes("低");
        return { ip, location, risk, isClean };
    }

    // 尝试多个可能的 API 端点
    function tryAPI() {
        const apiEndpoints = [
            "https://pingip.cn/api/ip",
            "https://pingip.cn/api/v1/ip",
            "https://pingip.cn/myip",
            "https://pingip.cn/ip.json",
            "https://pingip.cn/json"  // 常见路径
        ];

        function attempt(index) {
            if (index >= apiEndpoints.length) {
                $notification.post("IP检测", "错误", "无法从 API 获取数据");
                $done();
                return;
            }

            let url = apiEndpoints[index];
            console.log("尝试 API: " + url);
            $httpClient.get({
                url: url,
                headers: headers
            }, function(err, resp, data) {
                if (!err && resp.status === 200) {
                    try {
                        let json = JSON.parse(data);
                        console.log("API 返回: " + JSON.stringify(json).substring(0, 200));
                        let info = parseAPIResponse(json);
                        sendNotification(info);
                        $done();
                    } catch (e) {
                        console.log("解析失败，尝试下一个");
                        attempt(index + 1);
                    }
                } else {
                    console.log("请求失败，尝试下一个");
                    attempt(index + 1);
                }
            });
        }

        function parseAPIResponse(json) {
            // 根据常见字段名猜测
            let ip = json.ip || json.query || json.address || json.IP || "未知";
            let location = json.location || json.city || json.country || json.region || "未知";
            if (json.country && json.city) location = json.country + " " + json.city;
            let risk = json.risk || json.score || json.abuse_score || "未知";
            let riskStr = risk.toString();
            let isClean = riskStr.includes("极低") || riskStr.includes("低风险") || riskStr.includes("低") || (typeof risk === 'number' && risk < 20);
            return { ip, location, risk: riskStr, isClean };
        }

        attempt(0);
    }

    function sendNotification(info) {
        let message = `🌐 IP: ${info.ip}\n`;
        message += `📍 位置: ${info.location}\n`;
        message += `⚠️ 风险: ${info.risk}\n`;
        message += `✨ 状态: ${info.isClean ? "✅ 纯净 (低风险)" : "⚠️ 非纯净 (中/高风险)"}`;
        $notification.post("IP纯净度检测", message, "来自 pingip.cn");
    }
}

main();