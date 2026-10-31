/**
 * Sub-Store 关键字节点重排脚本（稳健版）
 * 格式要求：在 Sub-Store 参数框直接写： 目标关键词 : 参考关键词, 目标2 : 参考2
 * 示例：香港 01 : 台湾 01, 韩国 : 日本 02
 */
function operator(proxies, arg) {
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) return proxies;
    
    // 如果没有传参数，直接返回原节点，不报错
    if (!arg) return proxies;

    let ruleString = "";

    // 兼容处理：不管 Sub-Store 传过来的是字符串还是对象，都安全转为字符串
    if (typeof arg === 'string') {
        ruleString = arg.trim();
    } else if (typeof arg === 'object' && arg !== null) {
        ruleString = arg.rules || arg.actions || Object.values(arg)[0] || "";
    }

    if (!ruleString) return proxies;

    try {
        // 以逗号分割多组规则，支持半角 (:) 和全角 (：) 冒号
        let actions = ruleString.split(',').map(pair => {
            const parts = pair.split(/[:：]/).map(s => s.trim());
            return parts.length === 2 && parts[0] && parts[1] ? parts : null;
        }).filter(Boolean);

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
    } catch (e) {
        console.error("Sub-Store 重排脚本执行出错:", e);
    }

    return proxies;
}
