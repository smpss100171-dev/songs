# 🎃 BOO! 萬聖節猜歌闖關（GitHub Pages）

這是一個純 HTML、CSS、JavaScript 的個人猜歌網站，不需要 Python、資料庫或建置工具。歌曲由公開的 iTunes Search API 取得試聽資訊；分數存在玩家自己的瀏覽器。

## 最簡單的發布方式（GitHub Pages）

1. 到 https://github.com/ 建立或登入帳號。
2. 點右上角 **+** → **New repository**。
3. Repository name 輸入 `boo-halloween-guessing-game`，選 **Public**，按 **Create repository**。
4. 在新 repository 頁面按 **Add file** → **Upload files**。
5. 把這個資料夾中的 `index.html`、`style.css`、`script.js` 三個檔案拖進去。也可以另外上傳 README。
6. 按 **Commit changes**。
7. 到 repository 的 **Settings** → 左側 **Pages**。
8. 在 **Build and deployment** 裡，Source 選 **Deploy from a branch**；Branch 選 `main`，資料夾選 `/(root)`，按 **Save**。
9. 等待一兩分鐘，重新整理 Pages 設定頁。畫面會出現公開網址，格式通常是 `https://你的GitHub帳號.github.io/boo-halloween-guessing-game/`。
10. 用手機開網址測試，再把網址傳給朋友。

## 遊戲內容
- 繁體中文、萬聖節紫色／南瓜橘色介面、手機版排版。
- 以暱稱開始 10 題猜歌，每題 20 秒。
- 從 iTunes Search API 搜尋歌曲，使用回傳的預覽音訊。
- 四選一、快速答對最高 1000 分、答案回顧、徽章與個人最高分。
- 個人最佳成績儲存在瀏覽器 `localStorage`；不同裝置之間不會同步。

## 重要限制
- 這是**個人闖關**，不是即時多人房間；沒有 PIN、共享排行榜或共享歌單。
- 歌曲試聽的可用性由 iTunes / Apple Music API 和地區授權決定。部分歌曲可能沒有預覽或無法播放。
- 若要換歌曲搜尋詞，編輯 `script.js` 中的 `terms` 陣列即可。
- GitHub Pages 是靜態託管；網站不會讀取玩家的 Apple Music 帳號或私人資料。
