export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 健康檢查
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK - 副 Bot 正常運行", { status: 200 });
    }

    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-line-signature");

        // ✅ 簽名驗證
        if (!signature || !(await verifySignature(rawBody, signature, env.LINE_CHANNEL_SECRET))) {
          console.warn("簽名驗證失敗或無簽名");
          return new Response("Forbidden", { status: 403 });
        }

        const body = JSON.parse(rawBody);
        if (!body.events || body.events.length === 0) {
          return new Response("OK", { status: 200 });
        }

        // ✅ 逐一處理所有事件
        for (const event of body.events) {
          // 過濾非文字訊息
          if (event.type !== "message" || event.message.type !== "text") {
            continue;
          }

          // ✅ 過濾官方測試事件（超重要！）
          if (event.replyToken.match(/^(0{32}|f{32})$/)) {
            continue;  // 直接跳過，不回覆
          }

          const userMessage = event.message.text.trim();
          const replyToken = event.replyToken;
          const userId = event.source.userId;

          console.log(`[${userId}] ${userMessage}`);

          // ✅ Rate Limit（每人 2 秒只能發一次）
          const rateKey = `rate:${userId}`;
          const lastTime = await env.KV.get(rateKey);
          const now = Date.now();

          if (lastTime && now - parseInt(lastTime) < 2000) {
            console.log(`Rate limit: ${userId}`);
            continue;  // 不回覆，直接跳過
          }
          await env.KV.put(rateKey, now.toString(), { expirationTtl: 10 });

          // ✅ 超強髒話過濾（2025終極版，符號隔開、火星文都擋得住）
          const badWords = ["pussy","cunt","nigger","nigga","屌","屌你","屌那","柒頭","撚樣","撚你","𨳒","𨳊","𨳍","屄","屪","閪","尻","傻𨳊","傻閪","操你媽","操妳媽","操你妈","操妳妈","肏","干你娘","幹你娘","幹你妈","幹你媽","雞巴","雞芭","雞掰","機掰","機巴","雞歪","靠北","靠杯","靠背","靠腰","靠妖","媽逼","媽批"];

          const hasBadWord = badWords.some(word => {
            const regex = new RegExp(word.split('').join('[\\s\\S]{0,2}'), 'i');
            return regex.test(userMessage);
          });

          if (hasBadWord) {
            await replyMessage(env, replyToken, "唔好講粗口啦～❤️\n我會打冷震㗎🥶🤧！");
            continue;
          }

          // ✅ 正常回覆
          const replyText = `收到：「${userMessage}」\n\n我是你的電郵助理 Bot。\n有什麼可以幫到你？`;
          await replyMessage(env, replyToken, replyText);
        }

        return new Response("OK", { status: 200 });

      } catch (err) {
        console.error("Webhook 嚴重錯誤:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

// ✅ 簽名驗證函數（完美）
async function verifySignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

// ✅ 獨立回覆函數（避免重複程式碼）
async function replyMessage(env, replyToken, text) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`LINE API 錯誤 ${res.status}: ${err}`);
  }
}
