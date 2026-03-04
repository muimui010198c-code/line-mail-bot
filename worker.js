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

        // ==================== Debug 開始 ====================
        console.log("=== LINE Webhook Debug ===");
        console.log("你的白名單 UID (env):", env.LINE_ALLOWED_USER_ID || "【未設定！】");
        console.log("收到事件的 source 完整內容:", JSON.stringify(event.source));
        console.log("提取到的 fromUserId:", event?.source?.userId);
        // ==================== Debug 結束 ====================

        // 白名單判斷
        const fromUserId = event?.source?.userId;

        if (!fromUserId) {
          console.log("❌ 拿不到 userId，可能是群組權限問題");
          return new Response("OK", { status: 200 });
        }

        if (fromUserId !== env.LINE_ALLOWED_USER_ID) {
          console.log(`❌ 非白名單用戶 → fromUserId: ${fromUserId}`);
          return new Response("OK", { status: 200 });
        }

        console.log(`✅ 白名單通過！收到訊息: ${userMessage}`);

        // 回覆訊息
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

        if (!resp.ok) {
          console.error("Reply API 失敗:", resp.status);
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
