export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 瀏覽器測試
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK - 副 Bot 正常運行", { status: 200 });
    }

    // LINE Webhook
    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      try {
        const body = await request.json();
        const event = body.events && body.events[0];

        if (!event || event.type !== "message" || event.message.type !== "text") {
          return new Response("OK", { status: 200 });
        }

        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // 白名單：只允許指定的 userId 控制（你的個人 UID）
        const fromUserId = event?.source?.userId;

        // 如果拿不到 userId，或不是白名單 → 直接忽略、不回覆
        if (!fromUserId || fromUserId !== env.LINE_ALLOWED_USER_ID) {
          console.log(`已忽略非白名單訊息，fromUserId=${fromUserId}`);
          return new Response("OK", { status: 200 });
        }

        console.log(`收到白名單訊息: ${userMessage}`);

        // 簡單回覆
        const replyText = `收到：「${userMessage}」\n\n我是你的電郵助理 Bot。\n有什麼可以幫到你？`;

        const resp = await fetch("https://api.line.me/v2/bot/message/reply", {
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

        // 方便你 debug：如果 LINE 回覆 API 出錯，印出狀態碼
        if (!resp.ok) {
          const t = await resp.text();
          console.error("Reply API 失敗:", resp.status, t);
        }

        return new Response("OK", { status: 200 });

      } catch (err) {
        console.error("錯誤:", err);
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
