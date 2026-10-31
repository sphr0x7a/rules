/**
 * Sub-Store 关键字节点重排脚本
 * 规则：将包含【目标关键词】的节点，移动到包含【参考关键词】的节点后面
 * 格式：目标关键词 : 参考关键词，多组用逗号隔开
 */
function operator(proxies, arg) {
    if (!proxies || proxies.length === 0) return proxies;
    if (!arg) return proxies;

    let actions = [];

    try {
        // 1. 支持 JSON 格式，例如：[["香港 01", "台湾 01"], ["US", "JP"]]
        if (typeof arg === 'string' && arg.trim().startsWith('[')) {
            actions = JSON.parse(arg);
        } 
        // 2. 支持简易文本格式，用冒号 (:) 隔开，多组用逗号 (,) 隔开
        else if (typeof arg === 'string') {
            actions = arg.split(',').map(pair => {
                const parts = pair.split(':').map(s => s.trim());
                return parts.length === 2 ? parts : null;
            }).filter(Boolean);
        } 
        // 3. 如果本身就是数组
        else if (Array.isArray(arg)) {
            actions = arg;
        }
    } catch (e) {
        console.error("解析关键词排序参数失败:", e);
        return proxies;
    }

    if (!actions || actions.length === 0) return proxies;

    // 依次执行每组关键词移动
    actions.forEach(([targetKw, refKw]) => {
        if (!targetKw || !refKw) return;

        // 动态查找当前状态下包含关键词的节点下标
        const fromIndex = proxies.findIndex(p => p.name.includes(targetKw));
        const refIndex = proxies.findIndex(p => p.name.includes(refKw));

        // 只有当两个节点都能通过关键词找到时才执行移动
        if (fromIndex !== -1 && refIndex !== -1) {
            // 1. 剪切出要移动的节点
            const [item] = proxies.splice(fromIndex, 1);
            // 2. 重新定位参考节点当前的实际下标（防止因为前面的改动导致位置偏移）
            const newRefIndex = proxies.findIndex(p => p.name.includes(refKw));
            // 3. 插入到参考节点后面
            proxies.splice(newRefIndex + 1, 0, item);
        }
    });

    return proxies;
}
