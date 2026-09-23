# 書匣 BookReader

讀 AI 寫的書用的閱讀器，整個程式就是一個 `index.html`，用 GitHub Pages 發佈：

**https://agan0617.github.io/BookReader/**

- 書架資料（書目、書檔、閱讀進度）**不在這個 repo**，而在私有 repo [BookShelf](https://github.com/agan0617/BookShelf)
- 頁面用 GitHub REST API 讀寫 BookShelf，需要的 token 由使用者在每台裝置貼一次，只存在那台裝置的 `localStorage`
- 這個 repo 是公開的（免費方案的 Pages 只能發佈公開 repo），但裡面只有程式、沒有書

## 第一次在新裝置上使用

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token
2. Repository access：**Only select repositories** → 只選 `BookShelf`
3. Permissions：**Contents** 設成 **Read and write**（Metadata 會自動變成唯讀，其他都不用開）
4. 打開書匣，點右上角的連線狀態 → 貼上 token → 連線

## 功能

- 匯入 .md／.txt（手機走檔案挑選器，電腦可以拖進視窗），多檔可以合併成一本
- 自動切章節、目錄、字級／行高／字體／底色／版寬
- 朗讀（Web Speech API），可以定時停止
- **本機副本**：每台裝置的瀏覽器用 IndexedDB 存一份完整書架（書目、書檔、進度）。打開時先顯示本機的，再跟 BookShelf 比對：補下載新書與改版、清掉已下架的，沒網路也能讀
- 閱讀進度同步：換章、回書架、離開頁面時各 commit 一次到 `BookShelf/progress.json`；同一章讀很久時最多每 3 分鐘補存一次；離線時讀的進度下次連上時補傳
- 朗讀設定（語音、速度、音量、定時停止）每台裝置各自記在 localStorage

## 資料格式

見 BookShelf 的 README。
