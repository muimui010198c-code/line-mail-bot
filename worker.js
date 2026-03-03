export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 瀏覽器測試用
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK - 副 Bot 正常運行（已加入保護）", { status: 200 });
    }

    // LINE Webhook
    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      try {
        const body = await request.json();
        const event = body.events && body.events[0];

        if (!event || event.type !== "message" || event.message.type !== "text") {
          return new Response("OK", { status: 200 });
        }

        const userId = event.source.userId;
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        console.log(`收到訊息 | UserID: ${userId} | 內容: ${userMessage}`);

        // === 白名單保護：只有你能使用 ===
        if (userId !== env.ALLOWED_USER_ID) {
          console.log("非授權用戶，忽略訊息");
          return new Response("OK", { status: 200 });
        }

        // 只允許你使用時的回覆
        const replyText = `收到你的訊息：「${userMessage}」\n\n我是你的電郵助理 Bot。\n目前正在開發中，有什麼可以幫到你？`;

        // 回覆給你
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
