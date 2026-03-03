export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 瀏覽器測試用
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK - 副 Bot 正常運行", { status: 200 });
    }

    // LINE Webhook
    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      try {
        const body = await request.json();
        
        // 取出訊息
        const event = body.events && body.events[0];
        if (!event || event.type !== "message" || event.message.type !== "text") {
          return new Response("OK", { status: 200 });
        }

        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        console.log(`收到訊息: ${userMessage}`);

        // 目前先簡單回覆（之後會改得更好）
        const replyText = `收到你的訊息：「${userMessage}」\n\n我是電郵助理 Bot，正在開發中...`;

        // 呼叫 LINE 回覆 API
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: "text", text: replyText }]
          })
        });

        return new Response("OK", { status: 200 });

      } catch (err) {
        console.error("錯誤:", err);
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
