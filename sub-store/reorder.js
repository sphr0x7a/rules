/**
 * Sub-Store 关键字节点重排脚本（支持多组 Key-Value 参数 & 关键词带引号）
 * 规则：自动解析 key=value，支持对关键词加双引号/单引号包裹
 */
function operator(proxies) {
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) return proxies;
    if (typeof $arguments === 'undefined' || !$arguments) return proxies;

    let ruleStrings = [];

    try {
        if (typeof $arguments === 'object' && $arguments !== null) {
            ruleStrings = Object.values($arguments).map(v => String(v));
        } else if (typeof $arguments === 'string') {
            let trimmed = $arguments.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const obj = JSON.parse(trimmed);
                ruleStrings = Object.values(obj).map(v => String(v));
            } else {
                const pairs = trimmed.split(/[\n&]/);
                pairs.forEach(pair => {
                    const eqIndex = pair.indexOf('=');
                    if (eqIndex !== -1) {
                        const val = pair.substring(eqIndex + 1).trim();
                        if (val) ruleStrings.push(val);
                    } else if (pair.trim()) {
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

    let actions = [];
    ruleStrings.forEach(str => {
        const subRules = str.split(',').map(s => s.trim()).filter(Boolean);
        subRules.forEach(rule => {
            // 分割冒号（支持半角和全角）
            const parts = rule.split(/[:：]/).map(s => {
                let cleaned = s.trim();
                // 核心：如果关键词被双引号或单引号包裹，自动剥离外层引号
                if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                    cleaned = cleaned.slice(1, -1).trim();
                }
                return cleaned;
            });

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
            const newRefIndex = proxies.findIndex(p => p.name && p.name.includes(refKw));
            proxies.splice(newRefIndex + 1, 0, item);
        }
    });

    return proxies;
}
