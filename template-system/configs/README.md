# 設定檔資料夾

## 📁 用途

此資料夾存放**系統設定檔**和**程式碼**，供編輯器和樣板系統使用。

## 📝 檔案說明

### 系統設定檔

#### default-config.json
- 預設配置範本
- 開啟編輯器時自動載入
- 可作為新活動的起點
- **空白範本**，不含個人資料

#### template-config.json
- 完全空白的配置範本
- 所有欄位都是空字串
- 適合從零開始建立

#### field-library.json
- 欄位庫
- 包含常用欄位的定義
- 編輯器會讀取此檔案

### 程式碼檔案

#### editor-app.js
- 配置編輯器的核心邏輯
- 處理欄位編輯、匯出等功能

#### form-renderer.js
- 表單渲染引擎
- 負責將配置轉換成實際表單

## ⚠️ 重要提醒

### 此資料夾的用途

- ✅ 存放系統設定檔（default-config.json, field-library.json）
- ✅ 存放程式碼（editor-app.js, form-renderer.js）
- ❌ **不要**在此存放活動配置檔
- ❌ **不要**直接編輯這些檔案（除非您了解技術細節）

### 活動配置檔請放在 configs-export/

實際使用的活動配置檔應該放在 `configs-export/` 資料夾：
```
configs-export/
├── event-2026-01.json
├── event-2026-02.json
└── lecture-spring.json
```

## 🔄 檔案關係

```
configs/                        # 系統設定和程式碼
├── default-config.json         # 編輯器載入
├── field-library.json          # 編輯器參考
├── editor-app.js               # 編輯器使用
└── form-renderer.js            # 表單樣板使用

configs-export/                 # 實際活動配置
├── event-2026-01.json          # 網站讀取
└── event-2026-02.json          # 網站讀取
```

## 📋 總結

- **configs/** = 系統檔案（設定 + 程式碼）
- **configs-export/** = 活動配置檔（實際使用）
