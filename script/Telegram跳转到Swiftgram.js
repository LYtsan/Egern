/**
 * 强制将 t.me 链接跳转到 Swiftgram 客户端
 * 支持公开链接、邀请链接、贴纸包、分享链接等
 * 适用于 Loon
 */

const SWIFTGRAM_SCHEME = "sg";

// 从查询字符串中提取指定参数
function getQueryValue(qs, key) {
    if (!qs) return "";
    const re = new RegExp("(?:^|&)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^&]*)");
    const match = qs.match(re);
    return match ? decodeURIComponent(match[1]) : "";
}

// 生成 Swiftgram 深度链接
function buildSwiftgramDeepLink(path, qs) {
    const parts = path.split("/").filter(Boolean);
    if (!parts[0]) return "";

    // 邀请链接: t.me/+xxx
    if (parts[0][0] === "+") {
        return `sg://join?invite=${encodeURIComponent(parts[0].slice(1))}`;
    }
    // 旧邀请链接: t.me/joinchat/xxx
    if (parts[0] === "joinchat" && parts[1]) {
        return `sg://join?invite=${encodeURIComponent(parts[1])}`;
    }
    // 贴纸包: t.me/addstickers/xxx
    if (parts[0] === "addstickers" && parts[1]) {
        return `sg://addstickers?set=${encodeURIComponent(parts[1])}`;
    }
    // 分享链接: t.me/share/url?url=...&text=...
    if (parts[0] === "share" && parts[1] === "url") {
        return `sg://msg_url?url=${encodeURIComponent(getQueryValue(qs, "url"))}&text=${encodeURIComponent(getQueryValue(qs, "text"))}`;
    }
    // 带消息 ID: t.me/username/123
    if (parts[1] && /^\d+$/.test(parts[1])) {
        return `sg://resolve?domain=${encodeURIComponent(parts[0])}&post=${encodeURIComponent(parts[1])}`;
    }
    // 默认公开链接: t.me/username (频道/群组/用户)
    return `sg://resolve?domain=${encodeURIComponent(parts[0])}`;
}

export default async function (ctx) {
    const url = ctx.request.url;
    const match = url.match(/^https?:\/\/t\.me\/(.+)$/i);
    if (!match) return;

    let tail = match[1];
    // 移除可能的 /s/ 前缀
    if (tail.startsWith("s/")) tail = tail.slice(2);

    const questionIndex = tail.indexOf("?");
    const path = questionIndex < 0 ? tail : tail.slice(0, questionIndex);
    const qs = questionIndex < 0 ? "" : tail.slice(questionIndex + 1);

    const swiftgramLink = buildSwiftgramDeepLink(path, qs);
    if (!swiftgramLink) return;

    return ctx.respond({
        status: 302,
        headers: {
            Location: swiftgramLink,
            "Cache-Control": "no-store, no-cache",
        },
        body: "",
    });
}