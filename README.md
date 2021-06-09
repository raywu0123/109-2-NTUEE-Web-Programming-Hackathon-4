# 109-2 NTUEE Web Programming Hackathon 4 - README
# Pandemic Tracking System

## 準備工作
1. 請先按照 preREADME 的指示安裝好 npm package。
2. 從 Ceiba 上下載 `hack4.zip` 。請直接在 `/wp1092/hack4/` 底下解壓縮，若有重複的檔案一律直接覆蓋。請注意是否有將 .babelrc 一起移過去。
    > macOS 可能會解壓縮出另一個資料夾，請將資料夾裡的檔案全部移到 hack3 底下。
3. 檔案結構如下
    ```
    wp1092/
    ├─── hack4
    |    ├─── .gitignore
    |    ├─── README.md
    |    ├─── frontend
    |    |    ├─── public
    |    |    |    └─── ...
    |    |    ├─── node_modules
    |    |    ├─── package.json
    |    |    ├─── src
    |    |    |    ├─── index.js
    |    |    |    ├─── App.js
    |    |    |    ├─── components
    |    |    |    |    ├─── Uploader.js
    |    |    |    |    ├─── WatchList.js
    |    |    |    |    ├─── ...
    |    |    |    ├─── containers
    |    |    |    |    ├─── Stats.js
    |    |    |    |    ├─── Upload.js
    |    |    |    |    └─── ...
    |    |    |    └─── ...
    |    |    └─── ...
    |    ├─── backend
    |    |    ├─── .babelrc
    |    |    ├─── .gitignore
    |    |    ├─── node_modules
    |    |    ├─── cypress.json
    |    |    ├─── package.json
    |    |    ├─── src
    |    |    |    ├─── db.js
    |    |    |    ├─── data.json
    |    |    |    ├─── invalid-data.json
    |    |    |    ├─── valid-data.json
    |    |    |    ├─── index.js
    |    |    |    └─── ...
    |    |    ├─── cypress
    |    |    |    ├─── integration
    |    |    |    |    └─── public.spec.js
    |    |    |    └─── fixtures
    |    |    |         └─── people.csv
    |    |    └─── ...
    |    └─── ...
    └─── ...
    ```

## 概述
這次黑客松題目是一個追蹤確診個案的系統。
前端有兩個界面。使用方法可參考 [DEMO 影片](https://youtu.be/Fu-bNFHnWas)。
1. 上傳界面
![](https://i.imgur.com/COVl45U.png)
* 點選 Choose File 按鈕選擇 csv 檔案，選擇後就會**直接上傳**。
![](https://i.imgur.com/UcU3kd9.png)
* 範例檔案請用 `/backend/cypress/fixtures/people.csv`，以下示意圖會展示使用這個檔案的結果。
* 同一個檔案名稱選擇第二次不會觸發上傳。

2. 監控界面: 即時更新個縣市的累計確診數
* 初始畫面
![](https://i.imgur.com/iWx5FoI.png)

* 上傳`/backend/cypress/fixtures/people.csv`後，數字會即時更新
![](https://i.imgur.com/kAZzbcz.png)

## 注意事項
* 前端大部分的檔案 parsing， UI 都已經寫好了。**不要改到** DOM Structure。
* 只需要接上 GraphQL。需要新的檔案請自行新增在 `frontend/src` 之下。
* 後端 GraphQL 需要從 schema 開始寫，完成 resolver 等等。需要新的檔案請自行新增在 `backend/src` 之下。
* 你可以先完成後端並利用 graphql-playground 測試，再接上前端。 
* 提供的檔案裡要寫的地方都有標記 `// TODO`， **不要改到**提供給你但是沒有 `// TODO` 的檔案。批改的時候不會採用那些檔案。
* `valid-data.json` 和 `invalid-data.json` 是備份，不應該改到它們。

### DB
* 後端的 db 是一個 file-system DB，請把它當成普通的 Object 操作。
* 每次操作都會讀取 `backend/src/data.json`，並且把更新後的結果寫回去。這是方便測試用的。如果遇到問題可以把 `backend/src/db.js` 直接改成
    ```javascript
    const fs = require('fs');
    const db = JSON.parse(fs.readFileSync('./src/data.json'));
    module.exports = db;
    ```
* 一開始提供的檔案 `data.json` 和 `valid-data.json` 是一樣的。這是用來測試正常狀況 (database 正常) 的預設資料，如果需要測試 database 出錯的狀況請用 `invalid-data.json` 覆蓋掉 `data.json`。
* 操作 db 的方法:
    ```javascript
    import db from './db';
    
    // 像 Object 一樣操作它
    const collection = db.people;  // 這是個 Array
    
    // 測試過以下這些操作 其他的不確定可不可以
    console.log(db);
    
    collection[index]
    Object.keys(collection[index])
    collection.filter(...)
    collection.findIndex(...)
    collection.splice(...)
    collection.push(...)
    console.log(collectoin)
    JSON.stringify(collection)
    ```

## 名詞解釋
* ssn: 身份證字號
* severity: 代表健康狀況的 status code，只有以下幾種
    * 0: HEALTHY
    * 1: RAPID_TEST_POSITIVE
    * 2: CPR_TEST_POSITIVE  
> 可以用 severity >= 1 判斷確診

## Specs
### Easy - Schema & Query
0. Schema - 型態請自行推斷
    * Person 
        ```
        ssn
        name
        location {
            name
            description
        }
        severity
        ```
    * 全部都是必須的欄位

1. Common Behavior:
    * 不同 filter argument 的關係是 "and"。
    * 沒有傳入參數代表沒有限制。
    * 沒有寫 optional 的參數代表必須傳入。

2. (20%) Query: `statsCount`
    根據傳入的關鍵字回傳 match 到 severity 高於參數的人數
    * parameters:
        ```
        severity (optional)
        locationKeywords: [String]
        ```
    * response: [Int]，長度和 locationKeywords 相同。
    * behavior:
        * 回傳每個 locationKeyword 包含於 person.location.description （且 person.severity >= severity，如果有傳 severity 參數) 的人數。
        * 請用 String.includes 判斷字串包含關係。
        * 失敗請回傳 null。
    * 雖然前端之後會固定只有傳 severity = 1，但後端不能寫死。
    * 確診者如果康復 count 會減少。count 不是累計案例，是目前數量。

### Medium
3. (20%) Mutation: `insertPeople`
    插入新的資料或是更新欄位
    * parameters:
        ```
        data: [Person]
        ```
    * response: Boolean
    * behavior:
        * 若是 ssn 重複則更新資料，不要有重複的 ssn。
        * insert 失敗 return false，成功則 return true。

        

4. (20%) 串接前端 - 各縣市統計表
    * 路徑在 `localhost:3000/`，也可以點畫面上方的 "統計表" 按鈕。
    * 請將 `frontend/src/components/WatchList.js` 串接 `statsCount` query。
    * 顯示各縣市確診人數，也就是 severity >= 1 的人數
    * 縣市名稱寫在 `frontend/src/constans.js` 中的 `constants.watchList`。 請當作 `locationKeywords`。
    * 請將回傳結果存在前述 component 的 `counts` 變數。

5. (20%) 串接前端 - 資料上傳界面
    * 路徑在 `localhost:3000/upload`，也可以點畫面上方的 "上傳" 按鈕。
    * 將 mutation function 從 `frontend/src/containers/Upload.js` 的 mutation props 傳入 Uploader。
    * 在 `frontend/src/components/Uploader.js` 呼叫 mutation function。

### Hard
6. (20%) 使用 subscription 動態更新統計表
    * 請自行設計後端要回傳什麼資料，後端 api 沒有 spec 也不會測，只會 end-to-end 測試，要在前端看到正確結果才有分。
    * web-socket 在(開發時)後端重啟後會斷線，請重新整理頁面。

## 開啟開發環境
1. 開啟後端
    ```
    cd backend/
    npm start
    ```
    * `localhost:5000/` 會有 graphql-playground 可以測試。
    
2. 開啟前端
    ```
    cd frontend/
    npm start
    ```
## 跑測試
1. 開啟前後端 server。
2.  ```
    cd backend
    npm test
    ```
* 測試會改動到 `backend/src/data.json`，如果要接著手動測請注意。
* 測試時不會每個測資重新啟動後端，如果中間某個測資導致你的 server crash，後面會全錯。

## 考試規定
* 不能用提供的 `package.json` 規定以外的套件。
* 必須用 GraphQL 實做。
* 完成後請將 code push 到 github
    ```
    git add hack4
    git commit -m "COMMIT_MESSAGE"
    git push origin master
    ```