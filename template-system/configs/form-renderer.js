/**
 * 表單渲染引擎
 * 負責根據 JSON 配置動態生成表單
 */

class FormRenderer {
    constructor(config) {
        this.config = config;
        this.userProfile = { userId: '', displayName: '' };
        this.isGuest = true;
        this.lineMessageSent = false; // 追蹤是否已發送 Line 訊息
    }

    /**
     * 初始化 LIFF
     */
    async initLiff() {
        if (!this.config.formMeta.liffId) {
            console.warn('未設定 LIFF ID');
            return;
        }

        try {
            await liff.init({ liffId: this.config.formMeta.liffId });

            // 還原表單資料
            this.restoreFormData();

            if (liff.isLoggedIn()) {
                this.isGuest = false;
                const profile = await liff.getProfile();
                this.userProfile.userId = profile.userId;
                this.userProfile.displayName = profile.displayName;
                this.updateLineStatusUI(true);
            } else {
                this.isGuest = true;
                this.updateLineStatusUI(false);
            }
        } catch (err) {
            console.error('LIFF Init Error:', err);
            this.showStatus('系統初始化失敗,請重新整理。', 'error');
        }
    }

    /**
     * 渲染完整表單
     */
    render(containerId = 'formContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('找不到容器元素:', containerId);
            return;
        }

        let html = '';

        // 版本號
        html += this.renderVersion();

        // 標題
        html += this.renderTitle();

        // 橫幅
        if (this.config.banner && this.config.banner.enabled) {
            html += this.renderBanner();
        }

        // 資訊區塊
        if (this.config.infoBlocks) {
            this.config.infoBlocks.forEach(block => {
                if (block.enabled) {
                    html += this.renderInfoBlock(block);
                }
            });
        }

        // 表單開始
        html += '<form id="mainForm">';

        // 表單欄位
        if (this.config.formFields) {
            this.config.formFields.forEach(field => {
                if (field.enabled) {
                    html += this.renderField(field);
                }
            });
        }

        // 提交按鈕
        html += this.renderSubmitButton();

        // 表單結束
        html += '</form>';

        // 狀態訊息
        html += '<div id="status"></div>';

        container.innerHTML = html;

        // 綁定事件
        this.bindEvents();
    }

    /**
     * 渲染版本號
     */
    renderVersion() {
        return `
            <div style="text-align: right; font-size: 12px; color: #aaa; margin-bottom: 0;">
                ${this.config.formMeta.title} ver${this.config.formMeta.version}
            </div>
        `;
    }

    /**
     * 渲染標題
     */
    renderTitle() {
        return `<h1>📝 ${this.config.formMeta.title}</h1>`;
    }

    /**
     * 渲染橫幅
     */
    renderBanner() {
        return `
            <div class="w-full mb-5">
                <img src="${this.config.banner.imageUrl}" 
                     alt="${this.config.banner.altText || '活動橫幅'}" 
                     class="w-full h-auto block rounded-lg">
            </div>
        `;
    }

    /**
     * 渲染資訊區塊
     */
    renderInfoBlock(block) {
        if (block.id === 'location') {
            return this.renderLocationBlock(block);
        }

        return `
            <div class="form-group">
                <div style="margin-bottom: 10px; font-weight: bold; color: #333; font-size: 1.05em; border-left: 4px solid var(--primary-color); padding-left: 8px;">
                    ${block.title}
                </div>
                <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff; line-height: 1.5;">
                    <div style="color: #666; font-size: 16px;">
                        ${block.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染地點區塊
     */
    renderLocationBlock(block) {
        return `
            <div class="form-group">
                <div style="margin-bottom: 10px; font-weight: bold; color: #333; font-size: 1.05em; border-left: 4px solid var(--primary-color); padding-left: 8px;">
                    ${block.title}
                </div>
                <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff; line-height: 1.5;">
                    <div style="font-weight: bold; font-size: 1.1em; color: #333; margin-bottom: 4px;">
                        ${block.placeName}
                    </div>
                    <div style="color: #666; font-size: 16px; margin-bottom: 10px;">
                        ${block.address}
                    </div>
                    ${block.showMap ? `
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.mapQuery)}" 
                           target="_blank" 
                           style="display: inline-flex; align-items: center; color: var(--primary-color); text-decoration: none; font-weight: bold; font-size: 0.9em; border: 1px solid var(--primary-color); padding: 6px 12px; border-radius: 20px;">
                            📍 開啟 Google 地圖
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染欄位
     */
    renderField(field) {
        switch (field.type) {
            case 'text':
            case 'email':
                return this.renderTextInput(field);
            case 'radio':
                return this.renderRadio(field);
            case 'checkbox':
                return this.renderCheckbox(field);
            case 'contact-section':
                return this.renderContactSection(field);
            case 'remind-section':
                return this.renderRemindSection(field);
            case 'textarea':
                return this.renderTextarea(field);
            default:
                console.warn('未知的欄位類型:', field.type);
                return '';
        }
    }

    /**
     * 渲染文字輸入
     */
    renderTextInput(field) {
        return `
            <div class="form-group">
                <label class="section-title" for="${field.id}">${field.title}${field.required ? '<span style="color: #e53935;"> *</span>' : ''}</label>
                <input type="${field.type}" 
                       id="${field.id}" 
                       placeholder="${field.placeholder || ''}" 
                       ${field.required ? 'required' : ''}>
            </div>
        `;
    }

    /**
     * 渲染單選
     */
    renderRadio(field) {
        const isHorizontal = field.layout === 'horizontal';
        const options = field.options.map((option, index) => `
            <label class="option-label" style="${isHorizontal ? 'flex:1' : ''}">
                <input type="radio" 
                       name="${field.id}" 
                       value="${option}" 
                       ${index === 0 && field.required ? 'required' : ''}>
                ${option}
            </label>
        `).join('');

        return `
            <div class="form-group">
                <label class="section-title">${field.title}${field.required ? '<span style="color: #e53935;"> *</span>' : ''}</label>
                <div class="radio-group" style="${isHorizontal ? 'flex-direction: row; gap: 20px;' : ''}">
                    ${options}
                </div>
            </div>
        `;
    }

    /**
     * 渲染複選
     */
    renderCheckbox(field) {
        const options = field.options.map(option => `
            <label class="option-label">
                <input type="checkbox" name="${field.id}" value="${option}">
                ${option}
            </label>
        `).join('');

        return `
            <div class="form-group">
                <label class="section-title">${field.title}${field.required ? '<span style="color: #e53935;"> *</span>' : ''}</label>
                <div class="checkbox-group">
                    ${options}
                </div>
            </div>
        `;
    }

    /**
     * 渲染聯絡方式區塊
     */
    renderContactSection(field) {
        // Line OA ID for add friend link
        const lineOaId = this.config.formMeta.lineOaId || '';
        const lineAddFriendUrl = lineOaId ? `https://line.me/R/ti/p/${lineOaId}` : '#';

        return `
            <div class="form-group">
                <label class="section-title">
                    ${field.title}
                    <span style="font-size: 0.8em; color: #666; font-weight: normal; margin-left: 5px;">
                        (${field.description || '至少擇一填寫'})
                    </span>
                    ${field.required ? '<span style="color: #e53935;"> *</span>' : ''}
                </label>
                
                <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #fafafa;">
                    
                    <!-- 手機 -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">${field.mobile.title || '手機'}</label>
                        <input type="tel" 
                               id="contact_mobile" 
                               placeholder="${field.mobile.placeholder || ''}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>

                    <!-- Line -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">${field.line.title || 'Line'}</label>
                        <div style="background: white; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                            <div style="margin-bottom: 10px; font-size: 0.9em; color: #666;">
                                1. 請先 <a href="${lineAddFriendUrl}" target="_blank" style="color: #06c755; font-weight: bold; text-decoration: none;">加入官方帳號好友</a><br>
                                2. 點擊下方按鈕連結帳號
                            </div>

                            <button type="button" 
                                    id="contact_btnLineLogin" 
                                    class="connect-btn" 
                                    style="background-color: #06c755; width: 100%;"
                                    onclick="window.handleLineLogin()">
                                ${field.line.buttonText || '連結 Line 帳號'}
                            </button>
                            
                            <div id="contact_lineStatusText" 
                                    class="line-status-text hidden" 
                                    style="color: #06c755; font-weight: bold; text-align: center; padding: 8px;">
                                <!-- 動態填入狀態 -->
                            </div>
                        </div>
                    </div>

                    <!-- Email -->
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">${field.email.title || 'Email'}</label>
                        <input type="email" 
                               id="contact_email" 
                               placeholder="${field.email.placeholder || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>

                </div>
            </div>
        `;
    }

    /**
     * 渲染文字區域
     */
    renderTextarea(field) {
        return `
            <div class="form-group">
                <label class="section-title" for="${field.id}">${field.title}${field.required ? '<span style="color: #e53935;"> *</span>' : ''}</label>
                <textarea id="${field.id}" 
                          placeholder="${field.placeholder || ''}" 
                          rows="4"
                          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; font-family: inherit;"
                          ${field.required ? 'required' : ''}></textarea>
            </div>
        `;
    }

    /**
     * 渲染提醒設定區塊
     */
    renderRemindSection(field) {
        return `
            <div class="form-group">
                <label class="section-title">${field.title}${field.required ? '<span style="color: #e53935;"> *</span>' : ''}</label>
                
                <div id="remindDetails" class="remind-settings" style="display: block; border: none; padding: 0; background: none; margin-top: 10px;">
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">${field.description || '請選擇提醒方式 (預設不提醒)：'}</div>
                    
                    ${field.methods.line.enabled ? `
                    <div class="remind-sub-item" style="border-bottom: 1px solid #eee; margin-bottom: 15px; padding-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="checkLine">
                            <span style="font-weight: bold; margin-left: 5px;">Line 提醒</span>
                        </label>
                        <div style="font-size: 0.85em; color: #ff9800; margin-top: 5px; margin-left: 25px;">
                            ⚠️ 需先在「聯絡方式」完成 Line 連結或訊息驗證
                        </div>
                    </div>
                    ` : ''}

                    ${field.methods.email.enabled ? `
                    <div class="remind-sub-item" style="border: none;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="checkEmail">
                            <span style="font-weight: bold; margin-left: 5px;">Email 提醒</span>
                        </label>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染提交按鈕
     */
    renderSubmitButton() {
        return `
            <div class="action-area">
                <button type="button" id="btnSubmit" class="submit-btn" onclick="window.handleSubmit()">
                    送出報名
                </button>
            </div>
        `;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 將方法綁定到 window 供 HTML 使用
        window.toggleRemindSection = this.toggleRemindSection.bind(this);
        window.toggleLineInput = this.toggleLineInput.bind(this);
        window.toggleEmailInput = this.toggleEmailInput.bind(this);
        window.handleLineLogin = this.handleLineLogin.bind(this);
        window.handleSubmit = this.handleSubmit.bind(this);
    }

    /**
     * 切換提醒區域顯示
     */
    toggleRemindSection(show) {
        // Deprecated: Remind section is always visible
    }

    /**
     * 切換 Line 連結按鈕顯示
     */
    toggleLineInput() {
        const isChecked = document.getElementById('checkLine')?.checked;
        const area = document.getElementById('lineConnectArea');
        if (area) {
            area.style.display = isChecked ? 'block' : 'none';
        }
    }

    /**
     * 切換 Email 輸入框顯示
     */
    toggleEmailInput() {
        const isChecked = document.getElementById('checkEmail')?.checked;
        const area = document.getElementById('emailInputArea');
        if (area) {
            area.style.display = isChecked ? 'block' : 'none';
            if (isChecked) {
                document.getElementById('emailInput')?.focus();
            }
        }
    }

    /**
     * 更新 Line 狀態 UI
     */
    updateLineStatusUI(isLoggedIn) {
        const uiSets = [
            { btn: 'btnLineLogin', txt: 'lineStatusText' },
            { btn: 'contact_btnLineLogin', txt: 'contact_lineStatusText' }
        ];

        const displayName = this.userProfile.displayName;

        uiSets.forEach(set => {
            const btn = document.getElementById(set.btn);
            const txt = document.getElementById(set.txt);

            if (btn && txt) {
                if (isLoggedIn) {
                    btn.classList.add('hidden');
                    txt.classList.remove('hidden');
                    txt.innerText = `✅ 已連結 (${displayName})`;
                } else {
                    btn.classList.remove('hidden');
                    txt.classList.add('hidden');
                    btn.innerText = '連結 Line 帳號';
                }
            }
        });
    }


    /**
     * 處理 Line 登入
     */
    handleLineLogin() {
        if (!liff.isLoggedIn()) {
            this.saveFormData();
            liff.login({ redirectUri: window.location.href });
        }
    }

    // handleSendLineMessage removed

    /**
     * 處理表單提交
     */
    async handleSubmit() {
        const form = document.getElementById('mainForm');

        // 基本驗證
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // 收集表單資料
        const formData = this.collectFormData();

        // 自訂驗證
        if (!this.validateFormData(formData)) {
            return;
        }

        // 準備提交
        const btnSubmit = document.getElementById('btnSubmit');
        btnSubmit.disabled = true;
        btnSubmit.innerText = '資料傳送中...';

        try {
            // 嘗試發送 Line 訊息 (Safe Block)
            try {
                if (!this.isGuest && this.userProfile.userId && liff.isLoggedIn()) {
                    const formTitle = this.config.formMeta ? this.config.formMeta.title : '活動';
                    const sessionVal = formData.session || '';
                    // 使用換行符號 \n 來分行顯示
                    const message = `報名\n${formTitle}\n${sessionVal}`;

                    // 使用 liff.isInClient() 判斷環境，與預約系統邏輯一致
                    if (liff.isInClient()) {
                        try {
                            await liff.sendMessages([{ type: 'text', text: message }]);
                            console.log('Line message sent');
                            this.lineMessageSent = true;
                        } catch (lineErr) {
                            console.error('Line sendMessages failed:', lineErr);
                            // 在 Client 內發送失敗才提示
                            alert('注意：無法發送報名紀錄到您的 Line (可能權限不足)。\n但我們已收到您的報名資料。');
                        }
                    } else {
                        // 非 Line Client 環境 (如外部瀏覽器)，直接跳過不發送，不報錯
                        console.log('Not in Line Client, skip sending message.');
                    }
                }
            } catch (e) {
                console.error('Line logic error:', e);
                // Swallow error to allow form submission
            }

            await this.submitToGAS(formData);
            this.showSuccessView(formData);
        } catch (error) {
            console.error('Submit Error:', error);
            this.showStatus('❌ 傳送失敗,請檢查網路或稍後再試', 'error');
            btnSubmit.disabled = false;
            btnSubmit.innerText = '送出報名';
        }
    }

    /**
     * 收集表單資料
     */
    collectFormData() {
        const data = {
            uid: this.isGuest ? 'guest' : this.userProfile.userId,
            lineName: this.isGuest ? '' : this.userProfile.displayName
        };

        // 收集所有欄位
        this.config.formFields.forEach(field => {
            if (!field.enabled) return;

            switch (field.type) {
                case 'text':
                case 'email':
                case 'textarea':
                    const input = document.getElementById(field.id);
                    if (input) data[field.id] = input.value.trim();
                    break;

                case 'radio':
                    const radio = document.querySelector(`input[name="${field.id}"]:checked`);
                    if (radio) data[field.id] = radio.value;
                    break;

                case 'checkbox':
                    const checkboxes = document.querySelectorAll(`input[name="${field.id}"]:checked`);
                    data[field.id] = Array.from(checkboxes).map(cb => cb.value).join(', ');
                    break;

                case 'contact-section':
                    const mobile = document.getElementById('contact_mobile')?.value.trim();
                    const email = document.getElementById('contact_email')?.value.trim();
                    const isLineLinked = !this.isGuest && !!this.userProfile.userId;

                    data.contact_mobile = mobile || '';
                    data.contact_email = email || '';
                    data.contact_line_linked = isLineLinked;
                    data.contact_line_id = isLineLinked ? this.userProfile.userId : '';
                    data.contact_line_message_sent = this.lineMessageSent || false;
                    break;

                case 'remind-section':
                    const checkLine = document.getElementById('checkLine')?.checked;
                    const checkEmail = document.getElementById('checkEmail')?.checked;

                    data.lineRemind = checkLine ? '是' : '否';
                    data.emailRemind = checkEmail ? '是' : '否';
                    data.needRemind = (checkLine || checkEmail) ? '是' : '否';

                    // 計算提醒日期
                    if ((checkLine || checkEmail) && data.session) {
                        const dateMatch = data.session.match(/(\d+)\/(\d+)/);
                        if (dateMatch) {
                            const year = new Date().getFullYear();
                            data.remindDate = `${year}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
                        }
                    }
                    break;
            }
        });

        return data;
    }

    /**
     * 驗證表單資料
     */
    validateFormData(data) {
        // 驗證來源複選
        const sourceField = this.config.formFields.find(f => f.id === 'source' && f.enabled);
        if (sourceField && (!data.source || data.source === '')) {
            alert('請至少選擇一項「從哪得知」');
            return false;
        }

        // 驗證提醒設定
        const checkLine = document.getElementById('checkLine')?.checked;
        const checkEmail = document.getElementById('checkEmail')?.checked;

        if (checkLine && this.isGuest) {
            alert('勾選 Line 通知提醒需先連結帳號，請至「聯絡方式」區塊完成 Line 連結或發送訊息。');
            return false;
        }

        if (checkEmail && !data.contact_email) {
            alert('勾選 Email 提醒需填寫電子信箱，請至「聯絡方式」區塊填寫 Email。');
            document.getElementById('contact_email')?.focus();
            return false;
        }

        // 驗證聯絡方式 (至少擇一)
        const contactSection = this.config.formFields.find(f => f.type === 'contact-section' && f.enabled);
        if (contactSection) {
            const hasMobile = data.contact_mobile && /^09\d{8}$/.test(data.contact_mobile);
            const hasEmail = data.contact_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email);

            // 如果啟用訊息驗證模式，檢查是否已發送訊息
            const hasLine = data.contact_line_linked;

            // 驗證格式 (如果有填寫的話)
            if (data.contact_mobile && !hasMobile) {
                alert('請輸入有效的手機號碼 (格式: 09xxxxxxxx)');
                document.getElementById('contact_mobile')?.focus();
                return false;
            }

            if (data.contact_email && !hasEmail) {
                alert('請輸入有效的電子郵件格式');
                document.getElementById('contact_email')?.focus();
                return false;
            }

            if (!hasMobile && !hasEmail && !hasLine) {
                alert(`請在「聯絡方式」中，至少完成一項 (手機、Line連結、或 Email)，以便我們能聯繫您。`);
                return false;
            }
        }

        return true;
    }

    /**
     * 提交到 GAS
     */
    async submitToGAS(data) {
        await fetch(this.config.formMeta.gasUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * 顯示成功畫面
     */
    showSuccessView(data) {
        localStorage.removeItem('liff_form_temp');
        document.getElementById('formContainer').style.display = 'none';

        const successView = document.getElementById('successView');
        if (successView) {
            successView.classList.remove('hidden');
            if (data.needRemind === '是') {
                const remindMsg = document.getElementById('remindMsg');
                if (remindMsg) remindMsg.style.display = 'inline';
            }

            // 動態生成成功畫面內容
            const lineOaId = this.config.formMeta.lineOaId || '@246trduk';
            const lineUrl = `https://line.me/R/ti/p/${lineOaId}`;

            successView.innerHTML = `
                <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
                <h2 style="color: var(--primary-color); margin-top: 0;">報名成功！</h2>
                <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                    我們已收到您的報名資訊。<br>
                    ${data.needRemind === '是' ? '<span style="color: #ff9800;">屆時將會發送提醒通知給您。</span>' : ''}
                </p>

                <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                    
                    <a href="${lineUrl}" target="_blank" style="text-decoration: none;">
                        <button style="
                            width: 280px;
                            background-color: #06c755; 
                            color: white; 
                            border: none; 
                            padding: 14px 0;
                            border-radius: 8px; 
                            font-size: 16px; 
                            font-weight: bold; 
                            cursor: pointer; 
                            box-shadow: 0 4px 10px rgba(6, 199, 85, 0.3);
                            display: flex; align-items: center; justify-content: center;
                        ">
                            <span style="font-size: 1.3em; margin-right: 8px;">💬</span>
                            加入官方帳號好友
                        </button>
                    </a>

                    <button onclick="liff.closeWindow()" style="
                        width: 280px;
                        background-color: #f0f0f0; 
                        color: #666; 
                        border: 1px solid #ddd; 
                        padding: 14px 0;
                        border-radius: 8px; 
                        font-size: 16px; 
                        font-weight: bold; 
                        cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                    ">
                        關閉視窗
                    </button>
                    
                </div>

                <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
                    加入後如有疑問可直接傳訊諮詢
                </p>
            `;
        }
    }

    /**
     * 顯示狀態訊息
     */
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = type === 'error' ? 'red' : '#666';
        }
    }

    /**
     * 儲存表單資料
     */
    saveFormData() {
        const formData = this.collectFormData();
        localStorage.setItem('liff_form_temp', JSON.stringify(formData));
    }

    /**
     * 還原表單資料
     */
    restoreFormData() {
        const saved = localStorage.getItem('liff_form_temp');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            // 延遲還原,等待 DOM 渲染完成
            setTimeout(() => {
                Object.keys(data).forEach(key => {
                    // Try to finding input by key ID
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = data[key];
                    }

                    // 還原單選
                    const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                    if (radio) radio.click();
                });

                // 特別處理提醒複選框的還原
                if (data.lineRemind === '是') {
                    const checkLine = document.getElementById('checkLine');
                    if (checkLine) {
                        checkLine.checked = true;
                        this.toggleLineInput();
                    }
                }
                if (data.emailRemind === '是') {
                    const checkEmail = document.getElementById('checkEmail');
                    if (checkEmail) {
                        checkEmail.checked = true;
                        this.toggleEmailInput();
                    }
                }

            }, 100);
        } catch (e) {
            console.error('Restore Error', e);
        }
    }
}

// 匯出供外部使用
window.FormRenderer = FormRenderer;
