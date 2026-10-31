/**
 * Sub-Store 关键字节点重排脚本（支持多组 Key-Value 参数）
 * 规则：自动解析所有 key=value 中的值，执行关键词排序
 */
function operator(proxies) {
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) return proxies;
    if (typeof $arguments === 'undefined' || !$arguments) return proxies;

    let ruleStrings = [];

    try {
        // 1. 如果 $arguments 已经被 Sub-Store 解析为对象（如 {a: "...", b: "..."}）
        if (typeof $arguments === 'object' && $arguments !== null) {
            ruleStrings = Object.values($arguments).map(v => String(v));
        } 
        // 2. 如果 $arguments 是字符串（支持 & 分隔 或 换行符 分隔的 key=value）
        else if (typeof $arguments === 'string') {
            let trimmed = $arguments.trim();
            
            // 尝试识别 JSON 字符串
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const obj = JSON.parse(trimmed);
                ruleStrings = Object.values(obj).map(v => String(v));
            } else {
                // 按换行符或 & 拆分出每一行/每一组 key=value
                const pairs = trimmed.split(/[\n&]/);
                pairs.forEach(pair => {
                    const eqIndex = pair.indexOf('=');
                    if (eqIndex !== -1) {
                        // 提取等号后面的 Value 部分
                        const val = pair.substring(eqIndex + 1).trim();
                        if (val) ruleStrings.push(val);
                    } else if (pair.trim()) {
                        // 如果某一行没有等号，则直接当成纯文本规则处理
                        ruleStrings.push(pair.trim());
                    }
                });
            }
        }
    } catch (e) {
        console.error("解析 $arguments 失败:", e);
        return proxies;
    }

    if (ruleStrings.length === 0) return proxies;

    // 收集所有解析出来的重排动作
    let actions = [];
    ruleStrings.forEach(str => {
        // 支持单个 value 内部用逗号写多组规则
        const subRules = str.split(',').map(s => s.trim()).filter(Boolean);
        subRules.forEach(rule => {
            // 支持半角 (:) 和全角 (：) 冒号
            const parts = rule.split(/[:：]/).map(s => s.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                actions.push(parts);
            }
        });
    });

    if (actions.length === 0) return proxies;

    // 依次执行关键词移动
    actions.forEach(([targetKw, refKw]) => {
        const fromIndex = proxies.findIndex(p => p.name && p.name.includes(targetKw));
        const refIndex = proxies.findIndex(p => p.name && p.name.includes(refKw));

        if (fromIndex !== -1 && refIndex !== -1) {
            const [item] = proxies.splice(fromIndex, 1);
            // 实时重新计算参考节点的位置
            const newRefIndex = proxies.findIndex(p => p.name && p.name.includes(refKw));
            proxies.splice(newRefIndex + 1, 0, item);
        }
    });

    return proxies;
}
