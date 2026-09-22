/**
 * SSO / LDAP Authentication Verification Service
 * Menargetkan: http://madiunjuara.com/
 * 
 * Sifat integrasi: HANYA UNTUK VERIFIKASI (Binary Check).
 * Sistem TIDAK meminta akses penuh, tidak mengambil token otorisasi luas,
 * dan TIDAK menyimpan kredensial pengguna ke dalam database atau spreadsheet.
 */

export interface SsoVerifyResult {
  success: boolean;
  user?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Melakukan binary check autentikasi ke http://madiunjuara.com/
 * @param username UserID yang dimasukkan pengguna
 * @param password Password yang dimasukkan pengguna
 */
export async function verifySsoCredentials(
  username?: string,
  password?: string
): Promise<SsoVerifyResult> {
  const trimmedUser = (username || '').trim();
  const trimmedPass = (password || '').trim();

  if (!trimmedUser || !trimmedPass) {
    return {
      success: false,
      message: 'Username dan password SSO wajib diisi.',
      statusCode: 400,
    };
  }

  // Target endpoint SSO (default: http://madiunjuara.com/)
  const ssoTargetUrl = process.env.SSO_LDAP_URL || 'http://madiunjuara.com/';

  try {
    const formData = new URLSearchParams();
    // Parameter form madiunjuara.com: i_userid & i_password
    formData.append('i_userid', trimmedUser);
    formData.append('i_password', trimmedPass);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(ssoTargetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': ssoTargetUrl,
      },
      body: formData.toString(),
      signal: controller.signal,
      redirect: 'manual', // Jangan otomatis follow agar bisa mendeteksi redirect sukses
    });

    clearTimeout(timeoutId);

    // 1. Cek jika server mengembalikan HTTP redirect (301, 302, 303)
    // Pada arsitektur web form PHP, login sukses umumnya me-redirect ke dashboard/home
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || '';
      // Jika diarahkan kembali ke form login dengan error parameter
      if (location.toLowerCase().includes('login') && location.toLowerCase().includes('error')) {
        return {
          success: false,
          message: 'Username atau password SSO salah',
          statusCode: 401,
        };
      }
      return {
        success: true,
        user: trimmedUser,
        message: 'Verifikasi SSO berhasil',
        statusCode: 200,
      };
    }

    // 2. Cek status HTTP error standar (401 Unauthorized, 403 Forbidden)
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Username atau password SSO salah',
        statusCode: 401,
      };
    }

    // 3. Jika status 200 OK, periksa apakah body respons mengandung indikator error
    if (response.status === 200) {
      const text = await response.text();

      // Periksa pesan error spesifik madiunjuara.com:
      // Contoh: <div style="margin:10px 0 10px 0;color:red">testuser: Anda salah memasukan Password</div>
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
        return {
          success: false,
          message: 'Username atau password SSO salah',
          statusCode: 401,
        };
      }

      // Periksa kemungkinan format JSON (jika backend madiunjuara.com dikonfigurasi sebagai REST API)
      try {
        const jsonData = JSON.parse(text);
        if (jsonData.success === false || jsonData.status === 'error' || jsonData.authenticated === false) {
          return {
            success: false,
            message: 'Username atau password SSO salah',
            statusCode: 401,
          };
        }
      } catch {
        // Bukan format JSON, respons berupa HTML valid
      }

      // Respons 200 OK tanpa pesan penolakan berarti verifikasi binary sukses
      return {
        success: true,
        user: trimmedUser,
        message: 'Verifikasi SSO berhasil',
        statusCode: 200,
      };
    }

    return {
      success: false,
      message: 'Username atau password SSO salah',
      statusCode: 401,
    };
  } catch (err: any) {
    console.error('[SSO Service] Gagal verifikasi SSO:', err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Server SSO waktu tunggu habis (timeout). Silakan gunakan metode Local.',
        statusCode: 504,
      };
    }
    return {
      success: false,
      message: 'Gagal terhubung ke server SSO. Silakan gunakan metode Local.',
      statusCode: 502,
    };
  }
}
