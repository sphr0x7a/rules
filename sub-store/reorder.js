/**
 * Sub-Store 关键字节点重排脚本（支持 Key-Value 参数解析）
 * 规则：支持传入键值对，自动提取规则内容并执行重排
 */
function operator(proxies, arg) {
    if (!proxies || proxies.length === 0) return proxies;
    if (!arg) return proxies;

    let rawString = "";

    try {
        // 情况 1：如果 arg 本身是对象（JSON 格式传入）
        if (typeof arg === 'object' && arg !== null) {
            // 优先读取 rules 或 actions 键，如果没有则取第一个键的值
            rawString = arg.rules || arg.actions || Object.values(arg)[0] || "";
        } 
        // 情况 2：如果 arg 是字符串
        else if (typeof arg === 'string') {
            let trimmed = arg.trim();
            
            // 2.1 尝试解析为 JSON 字符串
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const parsedObj = JSON.parse(trimmed);
                rawString = parsedObj.rules || parsedObj.actions || Object.values(parsedObj)[0] || "";
            } 
            // 2.2 尝试解析为 key=value 形式（如 rules=香港 01 : 台湾 01）
            else if (trimmed.includes('=')) {
                const parts = trimmed.split('=');
                rawString = parts.slice(1).join('=').trim(); // 提取 value 部分
            } 
            // 2.3 普通纯文本直接使用
            else {
                rawString = trimmed;
            }
        }
    } catch (e) {
        console.error("解析参数失败:", e);
        return proxies;
    }

    if (!rawString) return proxies;

    // 解析规则：以逗号分多组，每组用冒号（支持半角 : 和全角 ：）分隔目标与参考关键词
    let actions = rawString.split(',').map(pair => {
        const parts = pair.split(/[:：]/).map(s => s.trim());
        return parts.length === 2 ? parts : null;
    }).filter(Boolean);

    if (actions.length === 0) return proxies;

    // 依次执行关键词移动
    actions.forEach(([targetKw, refKw]) => {
        if (!targetKw || !refKw) return;

        const fromIndex = proxies.findIndex(p => p.name.includes(targetKw));
        const refIndex = proxies.findIndex(p => p.name.includes(refKw));

        if (fromIndex !== -1 && refIndex !== -1) {
            const [item] = proxies.splice(fromIndex, 1);
            const newRefIndex = proxies.findIndex(p => p.name.includes(refKw));
            proxies.splice(newRefIndex + 1, 0, item);
        }
    });

    return proxies;
}
