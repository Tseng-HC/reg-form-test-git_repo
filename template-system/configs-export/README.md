# 活動配置檔資料夾

## 📁 用途

此資料夾用於存放**實際使用的活動配置檔**。

## 🌐 網站讀取

網站會從這個資料夾讀取配置檔：
```
網址：form-template.html?config=event-2026-01
讀取：configs-export/event-2026-01.json
```

## 📝 使用方式

### 1. 從編輯器匯出配置
- 在 `config-editor.html` 中完成編輯
- 點擊「匯出 JSON」按鈕
- **直接儲存到此資料夾**

### 2. 測試配置
- 在本機開啟 `form-template.html?config=您的檔名`
- 確認表單顯示正確

### 3. 部署到網站
- 將此資料夾上傳到伺服器
- 或推送到 GitHub

## 💡 檔案命名建議

```
格式：[活動類型]-[年月].json

範例：
- event-2026-01.json
- lecture-2026-02.json
- workshop-spring-2026.json
```

## 🔄 工作流程

```
1. 在編輯器中編輯配置
   ↓
2. 匯出 JSON 到此資料夾
   ↓
3. 本機測試確認
   ↓
4. 上傳到伺服器
```

## ⚠️ 注意事項

### 可以做的事
- ✅ 儲存從編輯器匯出的配置檔
- ✅ 保留多個版本（例如：event-v1.json, event-v2.json）
- ✅ 隨時新增、修改、刪除檔案
- ✅ 上傳到伺服器供網站使用

### 不要做的事
- ❌ 不要在此存放系統設定檔（default-config.json 等）
- ❌ 不要直接手動編輯 JSON（請使用編輯器）

## 📂 與 configs/ 的差異

| 資料夾              | 用途              | 內容                                          |
| ------------------- | ----------------- | --------------------------------------------- |
| **configs/**        | 系統設定 + 程式碼 | default-config.json, field-library.json, *.js |
| **configs-export/** | 活動配置檔        | event-2026-01.json, lecture-feb.json 等       |

## 🎯 範例

假設您有三個活動：

```
configs-export/
├── event-2026-01.json          # 一月活動
├── event-2026-02.json          # 二月活動
└── workshop-shoulder.json      # 肩頸工作坊
```

對應的網址：
```
form-template.html?config=event-2026-01
form-template.html?config=event-2026-02
form-template.html?config=workshop-shoulder
```

## 📤 部署

### 需要上傳的檔案：
```
template-system/
├── form-template.html          # 表單樣板
├── configs/
│   ├── form-renderer.js        # 渲染引擎
│   └── (其他系統檔案)
└── configs-export/             # ⭐ 此資料夾
    ├── event-2026-01.json
    └── event-2026-02.json
```

### 不需要上傳的檔案：
- `config-editor.html` - 編輯器（本機使用）
- `configs/editor-app.js` - 編輯器邏輯（本機使用）
- `configs/default-config.json` - 預設範本（本機使用）
