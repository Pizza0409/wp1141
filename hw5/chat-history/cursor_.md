
_從所有聊天记录中提取的用户提問_

---

1. 編輯/瀏覽個人首頁：請參考下圖中間欄

- [ ] 在主選單按下 “Profile” 可以編輯可以需修改的個人資料，希望可以更改顯示的名字（（就不是像原本用google登入的那個名字）、可以新增/更改自我介紹）

由上到下，顯示底下這些資訊 (沒有提到的可以不顯示 or 不支援)

- [ ]  姓名 (從 Google/GitHub/Facebook 註冊時取得之姓名, e.g. Chung-Yang Ric Huang)

- [ ]  Number of posts

- [ ]  回到 Home 的左箭頭

- [ ]  背景圖

- [ ]  按下背景圖右下方的 “Edit Profile” 按鈕則會跳出視窗來編輯個人資料

- [ ]  大頭貼 (Avatar)，中間對齊背景圖之底部

- [ ]  姓名, again (從 Google/GitHub/Facebook 註冊時取得之姓名)

- [ ]  @註冊時之 userD (e.g. ric2k1)

- [ ]  Brief description of the user

- [ ]  Number of following; Number of followers

- [ ]  Posts — 你 posts or repost 的文章 (public to all)

- [ ] Likes — 你有給愛心的文章 (only private to you)

在 PO 文中點擊 userID, 則會在中間欄顯示該使用者之個人資料 (READ only)

- [ ] 與 “編輯” 個人檔案不同的地方有：

- [ ]  “Edit Profile” 變成 “Follow” (尚未 follow) or “Following” (已 follow)

- [ ]  Posts 顯示的是該 user 所有 post/repost 過的文章

- [ ]  不可以看到別人有按過哪些愛心 (i.e. 沒有 “Likes” 選項)

---

## From cursor_.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_.md

1. 在自己的profile中點選edit profile沒有反應

2. 應該要可以搜尋其他人的id，點選其他人的profile時edit profile會是follow，像是下面的敘述

與 “編輯” 個人檔案不同的地方有：



- [ ]  “Edit Profile” 變成 “Follow” (尚未 follow) or “Following” (已 follow)

- [ ]  Posts 顯示的是該 user 所有 post/repost 過的文章

- [ ]  不可以看到別人有按過哪些愛心 (i.e. 沒有 “Likes” 選項)

---

## From cursor_.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_.md

edit profile點擊沒有反應

---

## From cursor_.md

- **發表文章：請參考下圖 (沒有提到的可以不顯示 or 不支援)**

    

    <aside>

    - [ ]  在主選單按下 “Post” 按鈕，會 pop up 一個如上圖之小視窗 (modal)，用來發文

    </aside>

- [ ]  按下右下 Post 則發表文章

- [ ]  按下左上 x 則放棄 PO 文 (會跳出小視窗詢問是否放棄)

    

    ⇒ Save, 存成 Draft

    

    ⇒ Discard, 則真的放棄 (無法 undo)

    

- [ ]  按下 “Drafts” 則顯示之前放棄之草稿列表

- [ ]  實現下列發文規範 —



<aside>

💡



- 文章長度為 280 字元，超過則不給繼續輸入 (除非你的 app 支援 “長文” <= 進階功能)

- 文章裡面如有連結，則不管長度該連結皆佔用 23 字元。你的文字輸入應該要能夠辨識連結並建立 hyperlink

- #HashTag 以及 @mention 不算在字元數裡頭，且無上限

- 長文、影音多媒體等為進階功能，在此可以不用支援

- 其他發文相關功能，請自行斟酌設計

</aside>



- **閱讀文章：請參考下圖中間欄 (沒有提到的可以不顯示 or 不支援)**

    

    <aside>

    - [ ]  在主選單按下 “Home” 則中間欄顯示文章列表

    </aside>

- [ ]  最上面的選項可改為 “All”, “Following” 這兩項就好。其中 “All” 顯示所有文章，Following 顯示你所 follow 的人所 post and repost 的文章

- [ ]  文章的排序方法都是從最新到最舊

- [ ]  文章中如有 @mentionSomeone 的連結，點擊後會進入該 mentionSomeone 的個人 profile

- [ ]  最上面為你可以 inline 發表 post 的地方，一但點擊輸入文字匡，則展開跟按主選單的 “Post” 發表文章類似的 layout, 如下圖

> 由於是 inline posting, 所以可以不用有 ‘x’ 刪除 or “Drafts” 的功能



> 

- [ ]  每篇文章應呈現底下資訊：

    - [ ]  作者頭像

    - [ ]  發文時間 (幾秒以前、幾分鐘以前、幾小時以前、幾天前、幾月幾日、或幾年幾月幾日)

    - [ ]  內容皆為完整呈現 (除非長文)

    - [ ]  下方顯示 (從左至右)：留言數、轉發數、按愛心數

        

        > 只支援轉發 (repost) 就好，不用支援 quote

        > 

    - [ ]  點擊留言數、轉發數、按愛心數分別可以留言、轉發、給愛心

        

        > 愛心按下去為 toggling on/off, 愛心為 on 時應要有顏色上的區別

        > 

    - [ ]  ~~(11/06 更新) 在列表中的文章會顯示留言~~

        

        > ~~這個不小心誤植，忘記刪掉。如果同學已經做了任何「在列表中的文章顯示留言」的功能，請可以考慮刪掉，或者是在 README 中說清楚即可。

        留言應該是點擊進去該篇文章才會看得到。~~

        > 

- [ ]  刪除貼文：如果是自己的發文，則在右上方的 “…” 打開選項，可以有 “Delete” 刪除文章的選項 (Note: re-post 的文章不能刪除)

- [ ]  文章/留言為 recursive, 也就是說，如果你點擊一篇文章，則中間欄會 “route” 到該篇文章，然後改成顯示該篇文章以及他所有的留言。而如果你點擊某則留言，則中間欄會 route 到該則留言，然後該留言會像是一篇文章一樣顯示在最上面，底下則為留給該留言的留言。繼續點選下方留言則會在 route 進入下一層畫面。

- [ ]  當我們點擊進入某篇文章或者是某個留言時，最上方會有一個左箭頭 + Post, 讓你可以點擊後回到上一層文章列表/文章/留言



而且使用者應該可以按其他使用者發文的愛心之類的功能

---

## From cursor_.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_.md

我按了別人的follow沒有用

---

## From cursor_.md

我覺得在發表post的功能上還不夠完全
- **發表文章：請參考下圖 **
    <aside>
    - [ ]  在主選單按下 “Post” 按鈕，會 pop up 一個如上圖之小視窗 (modal)，用來發文
    </aside>
- [ ]  按下右下 Post 則發表文章
- [ ]  按下左上 x 則放棄 PO 文 (會跳出小視窗詢問是否放棄)
    
    ⇒ Save, 存成 Draft
    
    ⇒ Discard, 則真的放棄 (無法 undo)
    
- [ ]  按下 “Drafts” 則顯示之前放棄之草稿列表
- [ ]  實現下列發文規範 —

<aside>
💡

- 文章長度為 280 字元，超過則不給繼續輸入 (除非你的 app 支援 “長文” <= 進階功能)
- 文章裡面如有連結，則不管長度該連結皆佔用 23 字元。你的文字輸入應該要能夠辨識連結並建立 hyperlink
- #HashTag 以及 @mention 不算在字元數裡頭，且無上限
- 長文、影音多媒體等為進階功能，在此可以不用支援
- 其他發文相關功能，請自行斟酌設計
</aside>

- 📖 **閱讀文章：請參考下圖中間欄 (沒有提到的可以不顯示 or 不支援)**
    
    <aside>
    👉🏿
    
    - [ ]  在主選單按下 “Home” 則中間欄顯示文章列表
    </aside>
- [ ]  最上面的選項可改為 “All”, “Following” 這兩項就好。其中 “All” 顯示所有文章，Following 顯示你所 follow 的人所 post and repost 的文章
- [ ]  文章的排序方法都是從最新到最舊
- [ ]  文章中如有 @mentionSomeone 的連結，點擊後會進入該 mentionSomeone 的個人 profile
- [ ]  最上面為你可以 inline 發表 post 的地方，一但點擊輸入文字匡，則展開跟按主選單的 “Post” 發表文章類似的 layout, 如下圖：
> 由於是 inline posting, 所以可以不用有 ‘x’ 刪除 or “Drafts” 的功能
> 
- [ ]  每篇文章應呈現底下資訊：
    - [ ]  作者頭像
    - [ ]  發文時間 (幾秒以前、幾分鐘以前、幾小時以前、幾天前、幾月幾日、或幾年幾月幾日)
    - [ ]  內容皆為完整呈現 (除非長文)
    - [ ]  下方顯示 (從左至右)：留言數、轉發數、按愛心數
        
        > 只支援轉發 (repost) 就好，不用支援 quote
        > 
    - [ ]  點擊留言數、轉發數、按愛心數分別可以留言、轉發、給愛心
        
        > 愛心按下去為 toggling on/off, 愛心為 on 時應要有顏色上的區別
        > 
    - [ ]  ~~(11/06 更新) 在列表中的文章會顯示留言~~
        
        > ~~這個不小心誤植，忘記刪掉。如果同學已經做了任何「在列表中的文章顯示留言」的功能，請可以考慮刪掉，或者是在 README 中說清楚即可。
        留言應該是點擊進去該篇文章才會看得到。~~
        > 
- [ ]  刪除貼文：如果是自己的發文，則在右上方的 “…” 打開選項，可以有 “Delete” 刪除文章的選項 (Note: re-post 的文章不能刪除)
- [ ]  文章/留言為 recursive, 也就是說，如果你點擊一篇文章，則中間欄會 “route” 到該篇文章，然後改成顯示該篇文章以及他所有的留言。而如果你點擊某則留言，則中間欄會 route 到該則留言，然後該留言會像是一篇文章一樣顯示在最上面，底下則為留給該留言的留言。繼續點選下方留言則會在 route 進入下一層畫面。
- [ ]  當我們點擊進入某篇文章或者是某個留言時，最上方會有一個左箭頭 + Post, 讓你可以點擊後回到上一層文章列表/文章/留言

---

## From cursor_.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_.md

@zsh (989-1019) 我嘗試在vercel上面deploy但是失敗了

---

## From cursor_.md

@zsh (1025-1040)

---

## From cursor_.md

1. 留言數應該不被算在文章數裡面

2. 留言的時候的形式不應該像是post一樣，像是文字什麼的，他應該要是留言的樣式

---

## From cursor_.md

repost還是應該算在post裡面

---

## From cursor_.md

好像有哪裡計算錯了？

還是X就是這樣計算的？其實我不太確定

---

## From cursor_.md

Posts 顯示的是該 user 所有 post/repost 過的文章

---

## From cursor_.md

這樣是不是在查看别人頁面的時候人家的post的邏輯也要修改

---

## From cursor_.md

像我用pizza查看hello的頁面，但他的頁面顯示了pizza repost的文章並且計入了他的post數

---

## From cursor_.md

@zsh (954-1018)

---

## From cursor_.md

我要怎麼把需要的env上傳到vercel?

---

## From cursor_.md

@zsh (981-1008)

---

## From cursor_.md

@zsh (980-1017)

---

## From cursor_.md

@zsh (1037-1039)

---

## From cursor_.md

我是用了hashtag的功能，但我原本打的是#Coding #颱風假 結果跑出來變成這樣

---

## From cursor_.md

但這樣看起來不支援中文的hashtag?

---

## From cursor_.md

這個有辦法實現嗎？

Hashtag 的完整支援 — 在按下文章裡頭的 #hashtag 以後，會跳到有標記該 hashtag 的所有文章列表，一樣是從最新到最舊排列

---

## From cursor_.md

但我疑似發現一個安全漏洞？就是在登入的時候，我似乎只要直接打UserID就可以登入隨便一個人的帳號兒不用輸入已經連接帳戶的密碼之類的

---

## From cursor_.md

我希望保留userID的功能但是應該是要一樣導回那個連接帳號的登入頁面<

---

## From cursor_.md

如果我在一個無痕的頁面打開在userID輸入一個我已經有的註冊過的，不會跳轉到該知註冊帳號的google emial OAuth

---

## From cursor_.md

幫我修復hashtag那個功能

---

## From cursor_1.md

現在的登入有問題

1. 如果我在userID輸入已經註冊的，像是pizza，我可以直接登入而不用受到任何的驗證

2. 使用userID登入的時候應該重新跳轉到這個ID註冊時的那個OAuth的帳號，不用重新授權但應該要跳轉到那邊登入，不然隨便一個人只要知道別人的ID就可以直接登入了

---

## From cursor_1.md

目前是直接跳出該chrome有註冊過的帳號，但應該是義跳到該userid註冊時的那個gmail才對

---

## From cursor_1.md

功能正常，但我在測試的過程中，

1. 假設我註冊時用了一個userID:1234 mail:1234@test.com ，我登入時用userID:1234 mail:5678@test.com，會顯示錯誤，可是當我試著想用正確的mail登入時會顯示錯誤

2. 先前用userID:1234成功登入後登出，想用另一個userID: 5678登入的時候，會直接顯示登入失敗：請使用註冊時使用的 OAuth 帳號登入

---

## From cursor_1.md

@zsh (1016-1040) npm run build遇到的問題

---

## From cursor_1.md

@zsh (1015-1040)

---

## From cursor_1.md

@zsh (1036-1040)

---

## From cursor_1.md

@zsh (1036-1039) 還是這樣耶

---

## From cursor_1.md

需要我帮你检查需要哪些环境变量

---

## From cursor_1.md

但是我有設置啊

---

## From cursor_1.md

為什麼會這樣

---

## From cursor_1.md

@node (902-1025)

---

## From cursor_1.md

如果這個不設可以嗎？

---

## From cursor_1.md

但我在google已經改了？ 還是我改錯了？

---

## From cursor_1.md

請幫我就現在有個功能改好README，然後下方有一些README規則

3. [**README.md](http://readme.md/) 必須包含：**

    - **Deployed link！Deployed link！Deployed link！**

    - 安全性措施：

        

        如果你不想讓 app 被任意的路人註冊，請提供一組 REG_KEY (亂碼)，寫在 README.md, 讓拿到你作業的人可以用此 REG_KEY 註冊

        

    - 功能清單 (尤其是進階功能，請寫清楚)

    - 架構圖（可手繪或簡圖）

---

## From cursor_1.md

但現在之前說到的userID登入的問題好像又出現了，我可以隨便用一個userID就登入而不會自動跳轉到註冊時的那隻帳號要求選擇，如果是不一樣的mail或是註冊方式就是錯誤

---

## From cursor_1.md

直接点击 OAuth 按钮，但该 email 已用不同 provider 注册 → 应拒绝登录

這一點的話可以改成如果是一樣的email還是可以登入用同樣email但不同OAuth註冊的userID嗎

---

## From cursor_1.md

我發現hashtag的功能似乎不支援中文，可以修正這個問題嗎

---

## From cursor_userid.md

目前使用已註冊userid登入會失敗

---

## From cursor_userid.md

我無法查看到terminal的訊息，因為他就跳掉了，可以讓他顯示在本地這邊的terminal而不是web的f12

---

## From cursor_userid.md

@node (825-845) 

我用pizza登入但terminal上面沒有什麼訊息

---

## From cursor_userid.md

terminal沒有什麼但是web的有

---

## From cursor_x_like1.md

我這次的作業要做一個X-like的網頁

1. - **註冊與登入**

    - [ ]  使用者可以透過 Google/GitHub/Facebook 三者的 OAuth 進行註冊與登入

    - [ ]  註冊時要輸入一個 userID (string), 下次登入時可以使用此 userID 登入即可

        

        > 你可以定義此 userID 的規則 (長度、字元規範 等)

        同一個人如果使用不同的 OAuth providers 應該要註冊成不同的 userIDs

        > 

    - [ ]  登入後要給一個 session, 下次登入時如果 session 還沒有 expire, 可以直接登入

2. 主選單：參考下圖左邊的側邊欄 (點擊進入該功能，沒有提到的可以不顯示 or 不支援)

       - [ ]  Home — 回到 X 的 home

- [ ]  Profile — 進入個人首頁

- [ ]  Post — 發表貼文

- [ ]  你的頭貼與姓名、UserID，點擊後會 pop up “logout” 的選項

<aside>

💡

- 最上面為你這個 tool 之主選單 icon, 請自行設計抽換

- 每項功能前綴之 icon 可以不用跟 X 一樣

- 如圖，Post 的按鈕應該為明亮底色，其他功能的按鈕應與背景相同，mouse hover 時會微亮 highlight

</aside>

先這樣，我要用的技術框架是

- Next.js 全端框架

- NextAuth for OAuth in Next.js

- PostgreSQL or MongoDB 擇一或者混用

- RESTful APIs

- Pusher 互動套件

- Vercel for deploymnet

---

## From cursor_x_like1.md

1. MongoDB

2. 僅英數字與底線，區分大小寫

3. Tailwind CSS

4. 點擊後是開啟彈窗（也算是導向新的route?)

5. 7天

---

## From cursor_x_like1.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_x_like1.md

這在哪？.env.local.example

---

## From cursor_x_like1.md

## Error Type

Runtime ReferenceError



## Error Message

global is not defined





    at module evaluation (lib/mongodb.ts:18:29)

    at module evaluation (lib/auth.ts:6:1)



## Code Frame

  16 | }

  17 |

> 18 | let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

     |                             ^

  19 |

  20 | if (!global.mongoose) {

  21 |   global.mongoose = cached;



Next.js version: 16.0.1 (Turbopack)

---

## From cursor_x_like1.md

@node (998-1011)

---

## From cursor_x_like1.md

我到這裡的時候出現這個錯誤

---

## From cursor_x_like1.md

1. 我先用google oAuth建立了一隻新的帳號，ID: pizza，進去之後登出，打算再用github建立新的一隻帳號，但卻直接連到了ID:pizza的帳戶

2. 如果我想用ID登入，我輸入完pizza後並沒有登入，而是重新刷新了一次的入頁面

---

## From cursor_x_like1.md

等等 那是因為我的github跟google是用同一個email的關係嗎？ 因為我換成另一個google email帳戶就可以成功註冊新的帳號了

---

## From cursor_x_like1.md

那這個問題不用修復，修復userID登入問題就好

1. 用已註冊的userid登入時不會登入，反而是重新跳轉登入頁面

2. 輸入不存在的userid不會跳出此用戶不存在的警示（我希望是在頁面上有一個紅色的匡表示他不存在，類似這種）

---

## From cursor_x_like1.md

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

## From cursor_x_like1.md

1. 我輸入已經註冊過的userid但是卻顯示錯誤

2. 輸入不存在的 userID，應顯示紅色錯誤框，內容為「此用戶不存在」這個應該一直存在，現在是只出現一瞬間那樣

---

## From cursor_x_like1.md

1. 使用已註冊的 userID 登入，無法成功登入

2. 輸入不存在的 userID，應該顯示紅色錯誤框「此用戶不存在」，並且錯誤訊息不會一直顯示

---

## From cursor_x_like1.md

已註冊過的userid沒辦法登入

---

## From cursor_x_like1.md

我用某個email註冊了一個叫userid: hello，但我卻無法用hello登入 @node (1016-1034)

---

## From cursor_x_like1.md

這是gemini給我的建議，但我還是無法修復userid無法登入的問題

這就點出了問題的核心：您的登入流程有兩個不同的後端邏輯，但您的前端只呼叫了其中一個。



您的前端 SignInPage.tsx： 正在呼叫 await signIn('credentials', { userID, ... })。



這個呼叫會觸發： 您在 lib/auth.ts（或您先前稱為 routes.ts 的主設定檔）中定義的 Credentials provider 裡的 authorize 函數。



您的新檔案 route.ts： 這是一個自訂的 API 路由 (例如 api/auth/userid-login)，它永遠不會被 signIn('credentials') 呼叫到。



簡單來說：您前端的按鈕正在呼叫 A，但您正在嘗試修復 B。您需要去修復 A。



真正的問題在哪裡？

問題 100% 在您主要的 lib/auth.ts 檔案中的 authorize 函數裡。



您上次貼出的 lib/auth.ts 中有這段邏輯，這才是 signIn('credentials') 真正執行的程式碼：

lib/auth.ts (您Auth.js設定檔中的相關程式碼)

11月8日 下午12:42



資料庫連線錯誤： 您的 DATABASE_URL 不正確，或者 PostgreSQL 伺服器沒有運作。這會導致 await db.user.findUnique 拋出錯誤，進入 catch 區塊，並回傳 null。



總結

請刪除您剛剛貼出的那個自訂的 route.ts 檔案 (它是不需要的，並且混淆了 Mongoose 和 Prisma)。



然後，專注於偵錯您的 lib/auth.ts 檔案中的 authorize 函數：



打開您執行 npm run dev 的終端機 (Terminal)。



試著用 UserID 登入一次。



查看終端機的日誌，看看 console.error('Credentials authorization error:', error) 是否有印出任何錯誤。



如果它印出了 Prisma 錯誤 (例如 "field userID is not unique")，請使用上面的解法 2。



如果它沒有印出任何錯誤，那代表是解法 1 (您輸入了錯誤的 UserID)。

---

## From cursor_x_like1.md

@node (884-1026) 我用google email登入後成功進到頁面，也顯示了我的userID，但是terminal似乎沒將userID寫入database之類的？

---

## From cursor_x_like1.md

我用pizza這個id登入卻失敗

---

## From cursor_x_like1.md

此用戶不存在

---

## From cursor_x_like1.md

但因為會重新導向有使用者不存在的頁面，我無法在f12去做查看

---
