// ✅ pages/api/rpa/[...path].js
export default async function handler(req, res) {
  // ✅ OPTIONS 요청은 사전 승인 (CORS preflight)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  console.log("💡 Proxy triggered:", req.method, req.url);

  try {
    // ✅ path 배열 안정화
    let { path } = req.query;
    if (!path) path = [];
    if (!Array.isArray(path)) path = [path];

    // ✅ 백엔드 주소
    const backendUrl = `http://221.139.227.131:8010/api/v1/rpa/${path.join("/")}`;
    console.log(`[Proxy] ${req.method} → ${backendUrl}`);

    // ✅ 헤더 구성
    const headers = {};
    if (req.headers["x-user-id"] && req.headers["x-user-id"] !== "undefined") {
      headers["x-user-id"] = req.headers["x-user-id"];
    }

    // ✅ GET은 Content-Type 빼기 (preflight 방지)
    if (req.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    // ✅ fetch 옵션 구성
    const options = { method: req.method, headers };

    if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    // ✅ FastAPI로 프록시
    const response = await fetch(backendUrl, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`[Proxy Response] ${response.status}`);
    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error);
    res.status(500).json({
      error: "Proxy request failed",
      message: error.message,
    });
  }
}
