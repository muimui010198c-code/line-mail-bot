export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 瀏覽器測試
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK", { status: 200 });
    }

    // LINE Webhook
    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      try {
        const body = await request.json();
        
        console.log("=== 收到 LINE 訊息 ===");
        console.log(JSON.stringify(body, null, 2));

        // 簡單回應（之後我們會改成更有用的回覆）
        return new Response("OK", { 
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });

      } catch (err) {
        console.error("錯誤:", err);
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
