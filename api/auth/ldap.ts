/**
 * Vercel Serverless Function: POST /api/auth/ldap
 * Verifikasi kredensial SSO / LDAP ke web kantor (http://madiunjuara.com/)
 * Binary check: Hanya mengecek validitas kredensial tanpa menyimpan data/password.
 */

async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const body = await parseRequestBody(req);
    const { username, password } = body || {};

    const trimmedUser = (username || '').toString().trim();
    const trimmedPass = (password || '').toString().trim();

    if (!trimmedUser || !trimmedPass) {
      res.status(400).json({
        success: false,
        message: 'Username dan password SSO kantor wajib diisi.',
        statusCode: 400,
      });
      return;
    }

    const ssoTargetUrl = process.env.SSO_LDAP_URL || 'http://madiunjuara.com/';

    const formData = new URLSearchParams();
    formData.append('i_userid', trimmedUser);
    formData.append('i_password', trimmedPass);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(ssoTargetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': ssoTargetUrl,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      body: formData.toString(),
      signal: controller.signal,
      redirect: 'manual',
    });

    clearTimeout(timeoutId);

    // 1. Cek Redirect HTTP 30x (PHP login form redirect ke dashboard)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || '';
      if (location.toLowerCase().includes('login') && location.toLowerCase().includes('error')) {
        res.status(401).json({
          success: false,
          message: 'Username atau password SSO kantor salah',
          statusCode: 401,
        });
        return;
      }
      res.status(200).json({
        success: true,
        user: trimmedUser,
        role: 'USER',
        message: 'Verifikasi SSO berhasil',
        statusCode: 200,
      });
      return;
    }

    // 2. HTTP error 401/403
    if (response.status === 401 || response.status === 403) {
      res.status(401).json({
        success: false,
        message: 'Username atau password SSO kantor salah',
        statusCode: 401,
      });
      return;
    }

    // 3. HTTP 200 OK (Periksa body respons)
    if (response.status === 200) {
      const text = await response.text();

      // Deteksi error khas EasyUI madiunjuara.com:
      // <div style="margin:10px 0 10px 0;color:red">...: Anda salah memasukan Password</div>
      const redErrorMatch = text.match(/<div[^>]*color:\s*red[^>]*>([\s\S]*?)<\/div>/i);
      const redErrorText = redErrorMatch ? redErrorMatch[1].trim() : '';

      const hasAuthError =
        text.includes('Anda salah memasukan Password') ||
        text.includes('salah memasukan Password') ||
        text.toLowerCase().includes('password salah') ||
        text.toLowerCase().includes('user tidak ditemukan') ||
        text.toLowerCase().includes('login gagal') ||
        redErrorText.length > 0;

      if (hasAuthError) {
        res.status(401).json({
          success: false,
          message: 'Username atau password SSO kantor salah',
          statusCode: 401,
        });
        return;
      }

      // Deteksi jika server mengembalikan JSON
      try {
        const jsonData = JSON.parse(text);
        if (jsonData.success === false || jsonData.status === 'error' || jsonData.authenticated === false) {
          res.status(401).json({
            success: false,
            message: 'Username atau password SSO kantor salah',
            statusCode: 401,
          });
          return;
        }
      } catch {
        // Bukan JSON, respons HTML normal tanpa error div
      }

      res.status(200).json({
        success: true,
        user: trimmedUser,
        role: 'USER',
        message: 'Verifikasi SSO berhasil',
        statusCode: 200,
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Username atau password SSO kantor salah',
      statusCode: 401,
    });
  } catch (err: any) {
    console.error('[Vercel SSO Auth Handler] Error:', err);
    if (err.name === 'AbortError') {
      res.status(504).json({
        success: false,
        message: 'Server SSO kantor (madiunjuara.com) waktu tunggu habis (timeout). Silakan gunakan metode Local.',
        statusCode: 504,
      });
      return;
    }
    res.status(502).json({
      success: false,
      message: 'Gagal terhubung ke server SSO kantor (madiunjuara.com). Silakan gunakan metode Local.',
      statusCode: 502,
    });
  }
}
