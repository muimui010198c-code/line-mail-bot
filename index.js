const express = require('express');
const app = express();

app.use(express.json());

// 健康檢查（瀏覽器打開會顯示 OK）
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// 副 Bot 的 Webhook 接收點（這是給 LINE 用的）
app.post('/webhook/mail', (req, res) => {
  // 最重要的：立刻回應 200 OK，讓 LINE 不會 timeout
  res.status(200).send('OK');

  // 之後我們可以在這裡看到收到的訊息（暫時先記錄在 console）
  console.log('=== 收到訊息 ===');
  console.log(JSON.stringify(req.body, null, 2));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`副 Bot Webhook 已在運行，端口: ${PORT}`);
});
