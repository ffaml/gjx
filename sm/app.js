
// 全局状态
let tags = [];
let currentFilter = 'all';
let editingId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTags();
    renderTags();
    setupEventListeners();
    // 启动实时时间更新
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// 从 LocalStorage 加载数据
function loadTags() {
    const storedTags = localStorage.getItem('tagbox_data');
    if (storedTags) {
        tags = JSON.parse(storedTags);
    } else {
        // 默认示例数据，包含 URL 字段
        tags = [
            { id: 1, content: 'Google', url: 'https://www.google.com', category: 'work', color: '#3B82F6', note: '搜索引擎', createdAt: Date.now() },
            { id: 2, content: 'TailwindCSS', url: 'https://tailwindcss.com', category: 'study', color: '#F59E0B', note: '原子化 CSS 框架', createdAt: Date.now() - 10000 },
            { id: 3, content: '购物清单', url: 'https://gzd.de5.net', category: 'life', color: '#10B981', note: '牛奶、鸡蛋、面包', createdAt: Date.now() - 20000 },
            { id: 4, content: '手机app', url: 'https://4002681192.share.123pan.cn/123pan/h4tzMh-gBZQd', category: 'sjapp', color: '#10B981', note: '喜马拉雅、oracle、mt管理器、网易云音乐、             小薇直播（纯净版）、ai万能写作', createdAt: Date.now() - 20000 },
           { id: 5, content: '数据库', url: 'https://4002681192.share.123pan.cn/123pan/h4tzMh-l20Qd', category: 'sjk', color: '#10B981', note: '数据库11g、数据库10g、数据库19c、plsql工具', createdAt: Date.now() - 20000 }


        ];
        saveToStorage();
    }
}

// 保存到 LocalStorage
function saveToStorage() {
    localStorage.setItem('tagbox_data', JSON.stringify(tags));
}

// 渲染标签列表
function renderTags() {
    const container = document.getElementById('tags-container');
    const emptyState = document.getElementById('empty-state');
    const statsText = document.getElementById('stats-text');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    container.innerHTML = '';

    // 过滤逻辑
    const filteredTags = tags.filter(tag => {
        const matchesCategory = currentFilter === 'all' || tag.category === currentFilter;
        const matchesSearch = tag.content.toLowerCase().includes(searchTerm) || 
                              (tag.note && tag.note.toLowerCase().includes(searchTerm)) ||
                              (tag.url && tag.url.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    // 更新统计
    statsText.textContent = `共找到 ${filteredTags.length} 个标签`;

    if (filteredTags.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        // 排序：最新的在前面
        filteredTags.sort((a, b) => b.createdAt - a.createdAt).forEach(tag => {
            const card = createTagCard(tag);
            container.appendChild(card);
        });
    }
}

// 创建标签卡片 DOM
function createTagCard(tag) {
    const div = document.createElement('div');
    div.className = 'tag-card bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative group fade-in hover:shadow-md transition-shadow duration-200';
    
    // 分类映射
    const categoryMap = {
        'work': '工作',
        'study': '学习',
        'life': '生活',
  'sjapp': '软件',
  'sjk': '数据库',
        'other': '其他'
    };

    // 判断是否有 URL，决定内容的展示方式
    const hasUrl = tag.url && tag.url.trim() !== '';
    const contentHtml = hasUrl 
        ? `<a href="${tag.url}" target="_blank" class="text-lg font-semibold text-gray-900 truncate block tag-link hover:text-indigo-600 transition-colors" title="${tag.content} (点击跳转)">
             ${tag.content} <i class="fa-solid fa-arrow-up-right-from-square text-xs text-gray-400 ml-1"></i>
           </a>`
        : `<h4 class="text-lg font-semibold text-gray-900 truncate" title="${tag.content}">${tag.content}</h4>`;

    // 复制按钮的逻辑：如果有 URL，复制 URL；否则复制内容
    const copyText = hasUrl ? tag.url : tag.content;
    // 对单引号进行转义以防 JS 注入错误
    const safeCopyText = copyText.replace(/'/g, "\\'");

    div.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3 overflow-hidden flex-grow">
                <div class="w-1.5 h-12 rounded-full flex-shrink-0" style="background-color: ${tag.color}"></div>
                <div class="min-w-0 flex-grow">
                    ${contentHtml}
                    <div class="flex items-center mt-1 space-x-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            ${categoryMap[tag.category] || '其他'}
                        </span>
                        <span class="text-xs text-gray-400">${new Date(tag.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button onclick="editTag(${tag.id})" class="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition" title="编辑">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteTag(${tag.id})" class="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition" title="删除">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        ${tag.note ? `<p class="mt-3 text-sm text-gray-500 line-clamp-2 border-t pt-2 border-gray-50">${tag.note}</p>` : ''}
        <button onclick="copyToClipboard('${safeCopyText}')" class="mt-3 w-full py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-xs font-medium rounded border border-gray-200 hover:border-indigo-200 transition flex items-center justify-center group/btn">
            <i class="fa-regular fa-copy mr-1.5 group-hover/btn:hidden"></i> 
            <i class="fa-solid fa-check mr-1.5 hidden group-hover/btn:inline text-green-500"></i>
            ${hasUrl ? '复制链接' : '复制内容'}
        </button>
    `;
    return div;
}

// 打开模态框
function openModal(isEdit = false) {
    const modal = document.getElementById('tag-modal');
    const title = document.getElementById('modal-title');
    
    modal.classList.remove('hidden');
    
    if (!isEdit) {
        title.textContent = '新建标签';
        document.getElementById('tag-content').value = '';
        document.getElementById('tag-url').value = ''; // 清空 URL
        document.getElementById('tag-category').value = 'work';
        document.getElementById('tag-color').value = '#4F46E5';
        document.getElementById('tag-note').value = '';
        editingId = null;
    }
    
    // 聚焦输入框
    setTimeout(() => document.getElementById('tag-content').focus(), 100);
}

// 关闭模态框
function closeModal() {
    document.getElementById('tag-modal').classList.add('hidden');
    editingId = null;
}

// 保存标签（新增或更新）
function saveTag() {
    const content = document.getElementById('tag-content').value.trim();
    const url = document.getElementById('tag-url').value.trim();
    const category = document.getElementById('tag-category').value;
    const color = document.getElementById('tag-color').value;
    const note = document.getElementById('tag-note').value.trim();

    if (!content) {
        showToast('标签内容不能为空', 'error');
        return;
    }

    // 简单的 URL 格式校验（如果填写了的话）
    if (url && !/^https?:\/\//i.test(url)) {
        showToast('链接请以 http:// 或 https:// 开头', 'error');
        return;
    }

    if (editingId) {
        // 更新现有标签
        const index = tags.findIndex(t => t.id === editingId);
        if (index !== -1) {
            tags[index] = { ...tags[index], content, url, category, color, note };
            showToast('标签已更新');
        }
    } else {
        // 新增标签
        const newTag = {
            id: Date.now(),
            content,
            url,
            category,
            color,
            note,
            createdAt: Date.now()
        };
        tags.push(newTag);
        showToast('标签创建成功');
    }

    saveToStorage();
    renderTags();
    closeModal();
}

// 编辑标签
function editTag(id) {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;

    editingId = id;
    document.getElementById('modal-title').textContent = '编辑标签';
    document.getElementById('tag-content').value = tag.content;
    document.getElementById('tag-url').value = tag.url || ''; // 填充 URL
    document.getElementById('tag-category').value = tag.category;
    document.getElementById('tag-color').value = tag.color;
    document.getElementById('tag-note').value = tag.note || '';
    
    openModal(true);
}

// 删除标签
function deleteTag(id) {
    if (confirm('确定要删除这个标签吗？')) {
        tags = tags.filter(t => t.id !== id);
        saveToStorage();
        renderTags();
        showToast('标签已删除');
    }
}

// 分类筛选
function filterByCategory(category) {
    currentFilter = category;
    
    // 更新按钮样式
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
            btn.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
        } else {
            btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
            btn.classList.remove('bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
        }
    });

    renderTags();
}

// 搜索监听
function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', renderTags);
    
    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败', 'error');
    });
}

// 导出数据 - 统一出口
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tags));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tagbox_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('数据导出成功');
}

// 实时当前时间更新函数
function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (!timeElement) return;
    const now = new Date();
    const formattedTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');
    timeElement.innerText = formattedTime;
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = toast.querySelector('i');

    msgEl.textContent = message;
    
    if (type === 'error') {
        iconEl.className = 'fa-solid fa-circle-exclamation text-red-400 mr-2';
        toast.querySelector('div').classList.replace('border-green-400', 'border-red-400');
    } else {
        iconEl.className = 'fa-solid fa-check-circle text-green-400 mr-2';
        toast.querySelector('div').classList.replace('border-red-400', 'border-green-400');
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}
