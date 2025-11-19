// path: src/pages/api/upload-pdf.js
// PDF 업로드 API (settings page)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb', // PDF Base64 payload limit
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, filename } = req.body || {};

    if (!file || !filename) {
      return res.status(400).json({
        success: false,
        error: 'File and filename are required',
      });
    }

    const base64Data = file.replace(/^data:application\/pdf;base64,/, '');

    console.log('[upload-pdf] request:', filename, 'length:', base64Data.length);

    const uploadResponse = await fetch('http://221.139.227.131:8003/upload-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64Data,
        filename,
        mimetype: 'application/pdf',
      }),
    });

    console.log('[upload-pdf] upload server status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[upload-pdf] upload server error:', errorText);
      return res.status(502).json({
        success: false,
        error: 'Upload server error',
        status: uploadResponse.status,
        details: errorText,
      });
    }

    const result = await uploadResponse.json();
    console.log('[upload-pdf] success:', result?.file?.savedName);

    return res.status(200).json({
      success: true,
      filename: result.file?.savedName || filename,
      ...result,
    });
  } catch (error) {
    console.error('[upload-pdf] error:', error);
    return res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error?.message || String(error),
    });
  }
}

