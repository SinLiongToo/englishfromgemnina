# 📚 Gemini 英文怎麼說：互動學習工具 (English from Gemini)

> 🚀 **本專案旨在將您在 Gemini 中詢問過的所有「英文怎麼說」與情境表達完整提取、結構化整理，並打造成高互動、高質感的單頁 HTML 學習工具。**  
> 🌐 **GitHub Pages 線上直接體驗**：[https://sinliongtoo.github.io/englishfromgemnina/](https://sinliongtoo.github.io/englishfromgemnina/)

---

## 🌟 核心特色

1. **🎴 3D 擬真翻牌卡片（Flashcards）**：
   - 正面顯示詢問情境、反思導引與關鍵字。
   - 翻面揭曉道地美式核心片語、深入用法解析。
   - 支援鍵盤快速操作（`[空白鍵]` 翻牌、`[← / →]` 上下一題）。
2. **🔊 Web Speech API 語音朗讀與連續自動播放**：
   - 支援真人語音合成朗讀（美音 `en-US`、英音 `en-GB`）。
   - **🔤 單獨純英文連續播放（English Only Auto-Play）**：
     - 卡片固定在英文展示面，依序連續朗讀**核心英文片語 + 4 組完整英文例句**。
     - 朗讀到哪一句，該句即時以科技藍光聚焦高亮（Active Highlighting）。
     - 讀完該頁全部英文後，自動切換至下一題繼續朗讀，形成沉浸式的純英文聽力廣播！
   - **🔄 雙語思考翻牌輪播（Bilingual Flip）**：正面停留 3.5 秒思考 ➔ 翻面朗讀英文 ➔ 自動跳轉下一題。
   - **🔤 單獨英文視覺模式（English Only Mode）**：頂部導航一鍵切換，中文翻譯自動模糊遮罩（滑鼠懸停顯示），建立直接以英語思維理解的習慣。
   - 可依個人習慣調整語速（0.6x ~ 1.4x）與句間停頓秒數。
3. **📑 精華手冊條列總覽（Comprehensive Guide）**：
   - 12 大主題情境、詳細文化語境、同義詞替換。
   - 每題均收錄 **4 組高頻真實例句**（中英對照、單句發音、實用場合標註）。
   - 即時模糊搜尋與主題分類篩選（成語俗諺、職場溝通、理財哲學、情緒表達等）。
4. **🎯 實戰隨堂測驗（Interactive Quiz）**：
   - 動態題目生成：核心口語四選一、情境例句辨析。
   - 即時答題回饋、詳盡解析與發音提示。
5. **📊 本地進度追蹤與星號收藏**：
   - 支援「未精通 / 已精通」狀態切換。
   - 星號重點收藏（Starred Items），資料安全持久化儲存於瀏覽器 `localStorage`。
6. **📤 多元格式匯出**：
   - 一鍵匯出 **Markdown** 學習筆記（支援 Obsidian / Notion）。
   - 一鍵匯出 **Anki 牌組 CSV**（可直接匯入手機 Anki 記憶）。
   - 一鍵匯出結構化 **JSON** 數據。

---

## 📂 專案檔案架構

```text
englishfromgemnina/
├── index.html                  # 🎨 互動式學習工具（雙擊即可於任何瀏覽器直接開啟）
├── data.json                   # 📦 完整結構化問答與例句數據
├── Gemini_英文學習手冊.md       # 📖 Markdown 完整版雙語筆記手冊
└── README.md                   # 📄 專案說明文件
```

---

## 💡 收錄之 12 大 Gemini 英文核心主題

| 編號 | 原始提問 | 核心道地表達 | 實戰情境分類 |
| :---: | :--- | :--- | :--- |
| **01** | 事後諸葛的英文 | `Hindsight is 20/20` / `Monday-morning quarterback` | 成語俗諺 / 職場應對 |
| **02** | 修飾過度 擦脂抹粉英文 | `Sugarcoat the truth` / `Put lipstick on a pig` | 職場溝通 / 說話藝術 |
| **03** | 無可後非（無可指責/無可非議） | `Beyond reproach` / `Above suspicion` | 評價評語 / 正式書面 |
| **04** | 免不了，英文 | `Inevitable` / `Bound to happen` | 生活哲理 / 職場日常 |
| **05** | 大暴走的英文怎麼說 | `Go on a rampage` / `Go ballistic` | 情緒表達 / 生動口語 |
| **06** | 量入為出英文 | `Live within one's means` | 理財智慧 / 生活哲學 |
| **07** | 隨時補充水份英文 | `Stay hydrated at all times` | 健康運動 / 日常生活 |
| **08** | 注重 功能性而非奢華 英文 | `Prioritize functionality over luxury` | 產品設計 / 價值觀念 |
| **09** | 置身事外的英文 | `Remain aloof from` / `Stay out of it` | 人際處世 / 職場智慧 |
| **10** | 後見之明英文 | `With the benefit of hindsight` / `Hindsight bias` | 心理學認知 / 邏輯思維 |
| **11** | 陰魂不散，英文 | `Keep haunting someone` / `Linger on` | 情緒心理 / 記憶感受 |
| **12** | 你這個人不主觀也不客觀英文怎麼說 | `Neither subjective nor objective` | 論辯邏輯 / 人格批評 |

---

## 🚀 如何使用

1. **直接開啟**：
   - 在檔案總管中，對著 [`index.html`](file:///./index.html) 點兩下（雙擊）即可在 Edge、Chrome 或 Safari 瀏覽器中離線運行。
2. **學習模式**：
   - 點擊頂部標籤可在 **「3D 卡牌抽測」**、**「精華手冊總覽」** 與 **「實戰隨堂測驗」** 之間自由切換。
   - 點擊右上角 🔊 圖示可微調發音嗓音、語速與自動播放秒數。
