// 脚本名称: IP纯净度检测 (通用脚本版 - 可直接运行)

// 从 HTML 中解析 IP、位置和纯净度信息
function parseIPInfoFromHTML(html) {
    // 提取 IP 地址 (适配常见显示格式)
    let ipMatch = html.match(/(?:当前IP[：:]\s*|>)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})</);
    let ip = ipMatch ? ipMatch[1] : "未检测到IP";

    // 判断是否为纯净 IP (需根据 ippure.com 实际页面内容调整关键词)
    // 这里假设“干净”表示纯净，且不包含“数据中心IP”等提示
    let isClean = !html.includes("数据中心IP") && 
                  !html.includes("代理IP") && 
                  html.includes("干净");

    // 提取地理位置
    let locationMatch = html.match(/(?:所在地[：:]\s*|>)([^<]+)(?=<\/)/);
    let location = locationMatch ? locationMatch[1].trim() : "未知";

    return { ip, isClean, location };
}

// 主函数（通用脚本入口）
async function main() {
    // 固定通知标题（不再依赖外部参数）
    const title = "IP纯净度检测";

    // 使用 Egern 内置的 $httpClient 发起请求
    $httpClient.get("http://ippure.com", function(error, response, data) {
        if (error) {
            console.log("请求失败: " + error);
            $notification.post(title, "错误", "无法访问 ippure.com: " + error);
            $done(); // 必须调用 $done 结束脚本
            return;
        }

        if (response.status !== 200) {
            $notification.post(title, "错误", `网站返回状态码: ${response.status}`);
            $done();
            return;
        }

        // 解析 HTML 内容
        const info = parseIPInfoFromHTML(data);
        
        // 构建通知消息
        let message = `IP: ${info.ip}\n`;
        message += `位置: ${info.location}\n`;
        message += `状态: ${info.isClean ? "✅ 纯净" : "⚠️ 非纯净 (可能是机房IP)"}`;
        
        // 发送系统通知
        $notification.post(title, message, "点击查看详情");
        
        // 在 Egern 控制台输出日志（方便调试）
        console.log(JSON.stringify(info, null, 2));

        // 结束脚本
        $done();
    });
}

// 执行主函数
main();