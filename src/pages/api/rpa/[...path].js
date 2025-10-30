// src/pages/api/rpa/[...path].js

export default async function handler(req, res) {
  try {
    // URL 경로 파싱 (예: /api/rpa/project/add → ["project", "add"])
    const { path = [] } = req.query;
    const backendUrl = `http://221.139.227.131:8010/api/v1/rpa/${path.join("/")}`;

    console.log(`[Proxy] ${req.method} → ${backendUrl}`);

    // 요청 옵션 구성
    const options = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers["x-user-id"] && { "x-user-id": req.headers["x-user-id"] }),
      },
    };

    // POST / PUT 등에서는 body 포함
    if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    // 실제 FastAPI 서버에 요청
    const response = await fetch(backendUrl, options);
    const data = await response.json();

    // FastAPI 응답 그대로 반환
    res.status(response.status).json(data);

  } catch (error) {
    console.error("❌ [RPA Proxy Error]", error);
    res.status(500).json({
      error: "RPA Proxy request failed",
      details: error.message,
    });
  }
}
