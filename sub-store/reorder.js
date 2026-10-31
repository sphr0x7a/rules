/**
 * Sub-Store 关键字节点重排脚本（支持自然排序 & 关键词带引号）
 */
function operator(proxies) {
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) return proxies;
    if (typeof $arguments === 'undefined' || !$arguments) return proxies;

    let ruleStrings = [];

    try {
        if (typeof $arguments === 'object' && $arguments !== null) {
            // 核心修复：使用自然排序 (numeric: true)，确保 r9 在 r10 之前，解决字典序错乱问题
            const sortedKeys = Object.keys($arguments).sort((a, b) => {
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });
            ruleStrings = sortedKeys.map(k => String($arguments[k]));
        } else if (typeof $arguments === 'string') {
            let trimmed = $arguments.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const obj = JSON.parse(trimmed);
                const sortedKeys = Object.keys(obj).sort((a, b) => {
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                });
                ruleStrings = sortedKeys.map(k => String(obj[k]));
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
            const parts = rule.split(/[:：]/).map(s => {
                let cleaned = s.trim();
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
