如果現在我使用使用者帳號登入
1. 假設這個帳號不存在沒有註冊過，跳出來的訊息只維持了一下下，讓人還沒看清楚就消失了
2. 當我註冊完後，應該會直接跳到登入後的畫面，但卻變成瘋狂在login and dashboard兩個page間瘋狂跳躍，直接崩潰



1. 若登入的使用者帳號等等不存在，沒有訊息顯示不存在，只會重新刷新頁面
2. 當我註冊完帳號密碼後，該要要跳入服務頁面，但卻在login 跟 dashboard 間瘋狂跳轉，然後dashboard似乎還有401的錯誤訊息



Implement the plan as specified. To-do's from the plan have already been created, do not create them again.

Implement the plan as specified. To-do's from the plan have already been created, do not create them again.



最後我發現的問題是，若是在登入的時候使用不存在的帳號，他的提示訊息只會出現一下，然後就重新刷新頁面了，我希望如果是這種狀況的話提示帳號不存在跟帳號密碼錯誤的訊息可以一直留在頁面上



我發現了一些小bugs
1. 若是我使用搜尋的方式搜到那個地點，功能都很正常，但是我沒辦法備註
2. 如果我想在地圖上隨便點擊一個地點新增，一樣沒有地方可以對這個地點進行備註，除此之外如果我改變主意不想新增這個地點了，按取消沒有用，框框還是在
3. 如果我新增的這個地點已經在我的清單了，仍然可以新增，我希望增加一個功能是可以判定這個地點（用地址）是否已經重複出現在我的清單了，若是有的話，跳出提示框顯示：已存在是否人要新增



Implement the plan as specified. To-do's from the plan have already been created, do not create them again.



Implement the plan as specified. To-do's from the plan have already been created, do not create them again.



1. 自定義地點的新增，若是我想取消新增這個地點，按取消沒有反應
2. 不知道為什麼新增完後都會跳到某一個奇怪的地點



Implement the plan as specified. To-do's from the plan have already been created, do not create them again.



我儲存地址後卻跳轉到不是那個地址的位置



現在新增第一個地點沒有問題，但如果我後面新增的其他地點，會跳轉到不是那個地點的位置



我看到的是目前如果我在新增第二個地點後，會跳轉的畫面是整個包含已儲存地點的視野，我希望不論我新增到第幾個地點，都是跳轉到那個地點



