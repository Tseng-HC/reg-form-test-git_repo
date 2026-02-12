/**
 * 配置編輯器應用邏輯 - 卡片式編輯
 */

let currentConfig = null;
const DEFAULT_FIELD_IDS = ['session', 'realName', 'gender', 'age', 'source', 'remind'];

/**
 * 頁面載入時初始化
 */
window.onload = function () {
    loadDefaultConfig();
};

/**
 * 載入預設配置
 */
async function loadDefaultConfig() {
    try {
        const response = await fetch('./configs/default-config.json');
        currentConfig = await response.json();
        populateForm(currentConfig);
        renderFieldsList();
        updatePreview();
    } catch (error) {
        console.error('載入預設配置失敗:', error);
        alert('無法載入預設配置檔案');
    }
}

/**
 * 更新配置網址
 */
function updateConfigUrl() {
    const configFileName = document.getElementById('configFileName').value.trim();
    const basePath = document.getElementById('basePath').value.trim();
    const urlInput = document.getElementById('configUrl');

    if (!configFileName) {
        urlInput.value = '';
        urlInput.placeholder = '請先設定配置檔名稱';
        return;
    }

    // 取得當前網域
    let baseUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 本機環境：使用相對路徑
        baseUrl = basePath ? `${basePath}/form-template.html` : 'form-template.html';
    } else {
        // 正式環境：使用完整網址
        const protocol = window.location.protocol;
        const host = window.location.host;
        baseUrl = basePath
            ? `${protocol}//${host}${basePath}/form-template.html`
            : `${protocol}//${host}/form-template.html`;
    }

    urlInput.value = `${baseUrl}?config=${configFileName}`;
}

/**
 * 複製配置網址
 */
function copyConfigUrl() {
    const urlInput = document.getElementById('configUrl');

    if (!urlInput.value) {
        alert('請先設定配置檔名稱');
        return;
    }

    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');

        // 視覺回饋
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ 已複製';
        btn.style.background = '#06c755';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (err) {
        // 如果舊方法失敗，嘗試新的 Clipboard API
        navigator.clipboard.writeText(urlInput.value).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✓ 已複製';
            btn.style.background = '#06c755';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }).catch(() => {
            alert('複製失敗，請手動複製網址');
        });
    }
}

/**
 * 填充表單
 */
function populateForm(config) {
    document.getElementById('formTitle').value = config.formMeta.title || '';
    document.getElementById('formVersion').value = config.formMeta.version || '1.0';
    document.getElementById('liffId').value = config.formMeta.liffId || '';
    document.getElementById('lineOaId').value = config.formMeta.lineOaId || '';
    document.getElementById('gasUrl').value = config.formMeta.gasUrl || '';

    // 填充基礎路徑
    if (config.formMeta.basePath) {
        document.getElementById('basePath').value = config.formMeta.basePath;
    }

    // 填充配置檔名
    if (config.formMeta.configFileName) {
        document.getElementById('configFileName').value = config.formMeta.configFileName;
        updateConfigUrl();
    }

    if (config.banner) {
        document.getElementById('bannerEnabled').checked = config.banner.enabled || false;
        document.getElementById('bannerUrl').value = config.banner.imageUrl || '';
        document.getElementById('bannerAlt').value = config.banner.altText || '';
    }

    // 填充活動內容
    if (config.infoBlocks && config.infoBlocks.length > 0) {
        const activityInfo = config.infoBlocks.find(block => block.id === 'activity-info');
        if (activityInfo) {
            document.getElementById('activityInfoEnabled').checked = activityInfo.enabled || false;
            document.getElementById('activityInfoTitle').value = activityInfo.title || '活動內容';
            document.getElementById('activityInfoContent').value = activityInfo.content || '';
        }

        const location = config.infoBlocks.find(block => block.id === 'location');
        if (location) {
            document.getElementById('locationEnabled').checked = location.enabled || false;
            document.getElementById('locationTitle').value = location.title || '地點';
            document.getElementById('locationPlaceName').value = location.placeName || '';
            document.getElementById('locationAddress').value = location.address || '';
            document.getElementById('locationShowMap').checked = location.showMap || false;
        }
    }
}

/**
 * 渲染欄位列表（卡片式）
 */
function renderFieldsList() {
    const container = document.getElementById('fieldsList');
    if (!currentConfig || !currentConfig.formFields) {
        container.innerHTML = '<p style="color: #999;">尚無欄位</p>';
        return;
    }

    let html = '';
    currentConfig.formFields.forEach((field, index) => {
        const isDefault = DEFAULT_FIELD_IDS.includes(field.id);
        const isExpanded = field._isEditing ? 'expanded' : '';

        html += `
            <div class="field-card ${isExpanded} ${isDefault ? 'is-default' : ''}" id="field-card-${index}">
                <div class="field-card-header" onclick="toggleCardExpand(${index})">
                    <div class="field-card-title-section">
                        <div class="field-card-title">${field.title} <span style="color: #999; font-weight: normal; font-size: 13px;">[${field.id}]</span></div>
                        <div class="field-card-meta">
                            <span class="field-type-badge">${getFieldTypeLabel(field.type)}</span>
                            ${isDefault ? '<span class="field-default-badge">預設欄位</span>' : ''}
                        </div>
                    </div>
                    <div class="field-card-controls" onclick="event.stopPropagation()">
                        <div class="toggle-switch ${field.enabled ? 'active' : ''}" 
                             onclick="toggleField(${index})"
                             title="${field.enabled ? '停用' : '啟用'}">
                        </div>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                <div class="field-card-body">
                    ${renderFieldEditForm(field, index, isDefault)}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * 渲染欄位編輯表單
 */
function renderFieldEditForm(field, index, isDefault) {
    let html = `
        <div class="edit-group">
            <label>欄位標題</label>
            <input type="text" id="field-${index}-title" value="${field.title}" 
                   onchange="updateFieldValue(${index}, 'title', this.value)">
        </div>
        
        <div class="edit-group">
            <label>欄位 ID</label>
            <input type="text" value="${field.id}" disabled style="background: #f5f5f5; cursor: not-allowed;">
        </div>
        
        <div class="edit-group">
            <label>欄位類型</label>
            <input type="text" value="${getFieldTypeLabel(field.type)}" disabled style="background: #f5f5f5; cursor: not-allowed;">
        </div>
    `;

    // 根據類型顯示不同的編輯選項
    if (field.type === 'text' || field.type === 'email' || field.type === 'textarea') {
        html += `
            <div class="edit-group">
                <label>佔位符文字 (Placeholder)</label>
                <input type="text" id="field-${index}-placeholder" value="${field.placeholder || ''}" 
                       onchange="updateFieldValue(${index}, 'placeholder', this.value)">
            </div>
        `;
    }

    if (field.type === 'radio' || field.type === 'checkbox') {
        html += `
            <div class="edit-group">
                <label>選項內容</label>
                <ul class="options-list" id="field-${index}-options">
                    ${field.options.map((opt, optIndex) => `
                        <li class="option-item">
                            <input type="text" value="${opt}" 
                                   onchange="updateOptionValue(${index}, ${optIndex}, this.value)">
                            <button class="btn btn-danger" onclick="removeOption(${index}, ${optIndex})">刪除</button>
                        </li>
                    `).join('')}
                </ul>
                <button class="btn btn-secondary btn-add-option" onclick="addOption(${index})">+ 新增選項</button>
            </div>
        `;

        if (field.type === 'radio' && field.layout) {
            html += `
                <div class="edit-group">
                    <label>排列方式</label>
                    <select id="field-${index}-layout" onchange="updateFieldValue(${index}, 'layout', this.value)">
                        <option value="vertical" ${field.layout === 'vertical' ? 'selected' : ''}>垂直</option>
                        <option value="horizontal" ${field.layout === 'horizontal' ? 'selected' : ''}>水平</option>
                    </select>
                </div>
            `;
        }
    }

    if (field.type === 'remind-section') {
        const lineEnabled = field.methods?.line?.enabled || false;
        const emailEnabled = field.methods?.email?.enabled || false;

        html += `
            <div class="edit-group">
                <label>提醒方式設定</label>
                <div class="remind-toggles">
                    <div class="remind-toggle-item">
                        <div class="toggle-switch ${lineEnabled ? 'active' : ''}" 
                             onclick="toggleRemindMethod(${index}, 'line')">
                        </div>
                        <label>LINE 提醒</label>
                    </div>
                    <div class="remind-toggle-item">
                        <div class="toggle-switch ${emailEnabled ? 'active' : ''}" 
                             onclick="toggleRemindMethod(${index}, 'email')">
                        </div>
                        <label>Email 提醒</label>
                    </div>
                </div>
            </div>
        `;
    }

    html += `
        <div class="edit-group">
            <label>
                <input type="checkbox" ${field.required ? 'checked' : ''} 
                       onchange="updateFieldValue(${index}, 'required', this.checked)">
                必填欄位
            </label>
        </div>
    `;

    // 非預設欄位顯示刪除按鈕
    if (!isDefault) {
        html += `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                <button class="btn btn-danger" style="width: 100%;" onclick="deleteField(${index})">
                    🗑️ 刪除此欄位
                </button>
            </div>
        `;
    }

    return html;
}

/**
 * 取得欄位類型標籤
 */
function getFieldTypeLabel(type) {
    const labels = {
        'text': '文字輸入',
        'email': 'Email',
        'textarea': '文字區域',
        'radio': '單選',
        'checkbox': '複選',
        'remind-section': '提醒設定'
    };
    return labels[type] || type;
}

/**
 * 切換卡片展開/收合
 */
function toggleCardExpand(index) {
    const card = document.getElementById(`field-card-${index}`);
    card.classList.toggle('expanded');
}

/**
 * 切換欄位啟用狀態
 */
function toggleField(index) {
    if (currentConfig && currentConfig.formFields[index]) {
        currentConfig.formFields[index].enabled = !currentConfig.formFields[index].enabled;
        renderFieldsList();
        updatePreview();
    }
}

/**
 * 更新欄位值
 */
function updateFieldValue(index, key, value) {
    if (currentConfig && currentConfig.formFields[index]) {
        currentConfig.formFields[index][key] = value;
        updatePreview();
    }
}

/**
 * 更新選項值
 */
function updateOptionValue(index, optIndex, value) {
    if (currentConfig && currentConfig.formFields[index] && currentConfig.formFields[index].options) {
        currentConfig.formFields[index].options[optIndex] = value;
        updatePreview();
    }
}

/**
 * 新增選項
 */
function addOption(index) {
    if (currentConfig && currentConfig.formFields[index] && currentConfig.formFields[index].options) {
        currentConfig.formFields[index].options.push('新選項');
        renderFieldsList();
        updatePreview();
    }
}

/**
 * 刪除選項
 */
function removeOption(index, optIndex) {
    if (currentConfig && currentConfig.formFields[index] && currentConfig.formFields[index].options) {
        if (currentConfig.formFields[index].options.length <= 1) {
            alert('至少需要保留一個選項');
            return;
        }
        currentConfig.formFields[index].options.splice(optIndex, 1);
        renderFieldsList();
        updatePreview();
    }
}

/**
 * 切換提醒方式
 */
function toggleRemindMethod(index, method) {
    const field = currentConfig.formFields[index];
    if (!field.methods) {
        field.methods = { line: { enabled: false }, email: { enabled: false } };
    }
    if (!field.methods[method]) {
        field.methods[method] = { enabled: false };
    }
    field.methods[method].enabled = !field.methods[method].enabled;
    renderFieldsList();
    updatePreview();
}

/**
 * 刪除欄位
 */
function deleteField(index) {
    const field = currentConfig.formFields[index];
    if (DEFAULT_FIELD_IDS.includes(field.id)) {
        alert('預設欄位無法刪除，只能停用');
        return;
    }

    if (confirm(`確定要刪除「${field.title}」欄位嗎？`)) {
        currentConfig.formFields.splice(index, 1);
        renderFieldsList();
        updatePreview();
    }
}

/**
 * 切換新增欄位表單
 */
function toggleAddFieldForm() {
    const form = document.getElementById('addFieldForm');
    form.classList.toggle('active');
    if (form.classList.contains('active')) {
        document.getElementById('newFieldType').value = '';
        document.getElementById('newFieldFormContent').innerHTML = '';
    }
}

/**
 * 更新新增欄位表單
 */
function updateNewFieldForm() {
    const type = document.getElementById('newFieldType').value;
    const container = document.getElementById('newFieldFormContent');

    if (!type) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div class="edit-group">
            <label>欄位標題</label>
            <input type="text" id="newFieldTitle" placeholder="請輸入欄位標題">
        </div>
        
        <div class="edit-group">
            <label>欄位 ID（英文，不可重複）</label>
            <input type="text" id="newFieldId" placeholder="例如: customField1">
        </div>
    `;

    if (type === 'text' || type === 'email' || type === 'textarea') {
        html += `
            <div class="edit-group">
                <label>佔位符文字</label>
                <input type="text" id="newFieldPlaceholder" placeholder="請輸入...">
            </div>
        `;
    }

    if (type === 'radio' || type === 'checkbox') {
        html += `
            <div class="edit-group">
                <label>選項內容（每行一個）</label>
                <textarea id="newFieldOptions" placeholder="選項1\n選項2\n選項3"></textarea>
            </div>
        `;

        if (type === 'radio') {
            html += `
                <div class="edit-group">
                    <label>排列方式</label>
                    <select id="newFieldLayout">
                        <option value="vertical">垂直</option>
                        <option value="horizontal">水平</option>
                    </select>
                </div>
            `;
        }
    }

    html += `
        <div class="edit-group">
            <label>
                <input type="checkbox" id="newFieldRequired">
                必填欄位
            </label>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * 儲存新欄位
 */
function saveNewField() {
    const type = document.getElementById('newFieldType').value;
    const title = document.getElementById('newFieldTitle')?.value;
    const id = document.getElementById('newFieldId')?.value;

    if (!type) {
        alert('請選擇欄位類型');
        return;
    }

    if (!title || !id) {
        alert('請填寫欄位標題和 ID');
        return;
    }

    // 檢查 ID 是否重複
    if (currentConfig.formFields.some(f => f.id === id)) {
        alert('欄位 ID 已存在，請使用其他 ID');
        return;
    }

    const newField = {
        id: id,
        type: type,
        title: title,
        enabled: true,
        required: document.getElementById('newFieldRequired')?.checked || false
    };

    if (type === 'text' || type === 'email' || type === 'textarea') {
        newField.placeholder = document.getElementById('newFieldPlaceholder')?.value || '';
    }

    if (type === 'radio' || type === 'checkbox') {
        const optionsText = document.getElementById('newFieldOptions')?.value || '';
        newField.options = optionsText.split('\n').filter(opt => opt.trim() !== '');

        if (newField.options.length === 0) {
            alert('請至少輸入一個選項');
            return;
        }

        if (type === 'radio') {
            newField.layout = document.getElementById('newFieldLayout')?.value || 'vertical';
        }
    }

    currentConfig.formFields.push(newField);
    cancelAddField();
    renderFieldsList();
    updatePreview();
}

/**
 * 取消新增欄位
 */
function cancelAddField() {
    const form = document.getElementById('addFieldForm');
    form.classList.remove('active');
    document.getElementById('newFieldType').value = '';
    document.getElementById('newFieldFormContent').innerHTML = '';
}

/**
 * 更新預覽
 */
function updatePreview() {
    const config = getCurrentConfig();
    const previewFrame = document.getElementById('previewFrame');
    if (previewFrame && previewFrame.contentWindow) {
        const configJson = JSON.stringify(config);
        localStorage.setItem('preview_config', configJson);
        previewFrame.src = 'form-template.html?preview=true&t=' + Date.now();
    }
}

/**
 * 取得當前配置
 */
function getCurrentConfig() {
    if (!currentConfig) {
        currentConfig = {
            formMeta: {},
            banner: {},
            infoBlocks: [],
            formFields: []
        };
    }

    currentConfig.formMeta.title = document.getElementById('formTitle').value;
    currentConfig.formMeta.version = document.getElementById('formVersion').value;
    currentConfig.formMeta.basePath = document.getElementById('basePath').value.trim();
    currentConfig.formMeta.configFileName = document.getElementById('configFileName').value.trim();
    currentConfig.formMeta.liffId = document.getElementById('liffId').value;
    currentConfig.formMeta.lineOaId = document.getElementById('lineOaId').value;
    currentConfig.formMeta.gasUrl = document.getElementById('gasUrl').value;

    currentConfig.banner.enabled = document.getElementById('bannerEnabled').checked;
    currentConfig.banner.imageUrl = document.getElementById('bannerUrl').value;
    currentConfig.banner.altText = document.getElementById('bannerAlt').value;

    // 更新 infoBlocks
    currentConfig.infoBlocks = [];

    // 活動內容
    const activityInfoEnabled = document.getElementById('activityInfoEnabled').checked;
    const activityInfoTitle = document.getElementById('activityInfoTitle').value;
    const activityInfoContent = document.getElementById('activityInfoContent').value;

    currentConfig.infoBlocks.push({
        id: 'activity-info',
        enabled: activityInfoEnabled,
        title: activityInfoTitle,
        content: activityInfoContent
    });

    // 地點資訊
    const locationEnabled = document.getElementById('locationEnabled').checked;
    const locationTitle = document.getElementById('locationTitle').value;
    const locationPlaceName = document.getElementById('locationPlaceName').value;
    const locationAddress = document.getElementById('locationAddress').value;
    const locationShowMap = document.getElementById('locationShowMap').checked;

    const mapQuery = locationPlaceName && locationAddress
        ? `${locationPlaceName}+${locationAddress}`
        : '';

    currentConfig.infoBlocks.push({
        id: 'location',
        enabled: locationEnabled,
        title: locationTitle,
        placeName: locationPlaceName,
        address: locationAddress,
        showMap: locationShowMap,
        mapQuery: mapQuery
    });

    return currentConfig;
}

/**
 * 匯出 JSON
 */
function exportJSON() {
    const config = getCurrentConfig();
    const json = JSON.stringify(config, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    // 使用設定的配置檔名，如果沒有則詢問
    let filename = config.formMeta.configFileName;
    if (!filename) {
        filename = prompt('檔案名稱 (不含 .json):', 'my-event-config');
        if (!filename) return;
    }

    a.href = url;
    a.download = filename + '.json';
    a.click();

    URL.revokeObjectURL(url);
    alert('配置已匯出！\n\n檔案名稱: ' + filename + '.json\n網址參數: ?config=' + filename);
}

/**
 * 匯出獨立 HTML
 */
async function exportHTML() {
    const config = getCurrentConfig();

    // 讀取 form-renderer.js 的內容
    let rendererCode = '';
    try {
        const response = await fetch('./configs/form-renderer.js');
        rendererCode = await response.text();
    } catch (error) {
        alert('無法讀取 form-renderer.js，請確認檔案存在');
        return;
    }

    const htmlContent = generateStandaloneHTML(config, rendererCode);

    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const filename = prompt('檔案名稱 (不含 .html):', 'registration-form');
    if (!filename) return;

    a.href = url;
    a.download = filename + '.html';
    a.click();

    URL.revokeObjectURL(url);
    alert('獨立 HTML 已匯出！\n\n只需上傳這一個檔案即可使用。');
}

/**
 * 生成獨立 HTML 內容
 */
function generateStandaloneHTML(config, rendererCode) {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.formMeta.title}</title>
    <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <style>
        :root {
            --primary-color: #06c755;
            --primary-hover: #05b34a;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px 10px;
            min-height: 100vh;
        }

        #formContainer {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px 25px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8em;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .section-title {
            display: block;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
            font-size: 1.05em;
            border-left: 4px solid var(--primary-color);
            padding-left: 8px;
        }

        input[type="text"],
        input[type="email"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus,
        input[type="email"]:focus,
        textarea:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .radio-group,
        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .option-label {
            display: flex;
            align-items: center;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            background: white;
        }

        .option-label:hover {
            background: #f8f9fa;
            border-color: var(--primary-color);
        }

        .option-label input[type="radio"],
        .option-label input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .submit-btn {
            width: 100%;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
            background: var(--primary-hover);
        }

        .submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .connect-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }

        .remind-settings {
            display: none;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-top: 15px;
        }

        .remind-sub-item {
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 6px;
        }

        .hidden {
            display: none !important;
        }

        .line-status-text {
            color: var(--primary-color);
            font-weight: bold;
        }

        #successView {
            max-width: 600px;
            margin: 50px auto;
            background: white;
            padding: 40px 30px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .action-area {
            margin-top: 30px;
        }

        /* 圖片和通用樣式 */
        .w-full {
            width: 100%;
        }

        .h-auto {
            height: auto;
        }

        .block {
            display: block;
        }

        .rounded-lg {
            border-radius: 8px;
        }

        .mb-5 {
            margin-bottom: 20px;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
        }

        @media (max-width: 480px) {
            #formContainer {
                padding: 20px 15px;
            }
            
            h1 {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div id="formContainer"></div>
    <div id="successView" class="hidden"></div>

    <script>
        // 嵌入配置
        const CONFIG = ${JSON.stringify(config, null, 2)};

        // 嵌入渲染引擎
        ${rendererCode}

        // 初始化
        (async function() {
            const renderer = new FormRenderer(CONFIG);
            renderer.render('formContainer');
            
            // 如果有 LIFF ID 則初始化 LIFF
            if (CONFIG.formMeta.liffId) {
                await renderer.initLiff();
            }
        })();
    </script>
</body>
</html>`;
}

/**
 * 匯入 JSON
 */
function importJSON() {
    document.getElementById('fileInput').click();
}

/**
 * 處理檔案匯入
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const config = JSON.parse(e.target.result);
            currentConfig = config;
            populateForm(config);
            renderFieldsList();
            updatePreview();
            alert('配置已成功匯入！');
        } catch (error) {
            console.error('解析 JSON 失敗:', error);
            alert('無效的 JSON 檔案');
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

/**
 * 載入配置
 */
async function loadConfig() {
    const configName = prompt('配置檔名稱 (不含 .json):', 'default-config');
    if (!configName) return;

    try {
        const response = await fetch(`./configs/${configName}.json`);
        if (!response.ok) {
            throw new Error('找不到配置檔');
        }

        currentConfig = await response.json();
        populateForm(currentConfig);
        renderFieldsList();
        updatePreview();
        alert('配置已載入！');
    } catch (error) {
        console.error('載入配置失敗:', error);
        alert('無法載入配置檔: ' + configName + '.json');
    }
}
