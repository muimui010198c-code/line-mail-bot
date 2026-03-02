export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 瀏覽器測試：打開根目錄
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK", { status: 200 });
    }

    // LINE webhook：POST /webhook/mail
    if (request.method === "POST" && url.pathname === "/webhook/mail") {
      // 立刻回 200，先確保 LINE 不會 timeout
      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
};
