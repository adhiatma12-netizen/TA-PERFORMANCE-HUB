import { parseCSV } from './googleSheets';

export interface UserAccount {
  user: string;
  password: string;
  previlage: 'OWNER' | 'USER' | string;
}

export const SPREADSHEET_ID = '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE';
export const SHEET_NAME = 'list user';

export const FALLBACK_USER_ACCOUNTS: UserAccount[] = [
  { user: '25890026', password: '', previlage: 'OWNER' },
  { user: '11223344', password: '11223344', previlage: 'USER' },
  { user: 'admin', password: 'adminpassword', previlage: 'OWNER' },
  { user: 'owner', password: 'ownerpassword', previlage: 'OWNER' },
];

/**
 * Fetch list of valid users, passwords, and previlages directly from Google Sheets
 * Spreadsheet ID: 1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE
 * Sheet name: "list user"
 * Column A: USER
 * Column B: PASWORD
 * Column C: PREVILAGE ('OWNER' | 'USER')
 */
export async function fetchUserAccounts(): Promise<{ accounts: UserAccount[]; isLive: boolean; error?: string }> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  let csvText = '';
  let isLive = false;
  let fetchError = '';

  try {
    let response = await fetch(gvizUrl);
    if (!response.ok) {
      response = await fetch(exportUrl);
    }
    if (response.ok) {
      csvText = await response.text();
      isLive = true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.warn('Gagal mengunduh user list dari Google Sheets:', err);
    fetchError = err.message || 'Gagal terhubung ke Google Sheets';
  }

  const accounts: UserAccount[] = [];

  if (csvText) {
    const rows = parseCSV(csvText);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 1) continue;

      const userVal = (row[0] || '').trim();
      const passVal = (row[1] || '').trim();
      const prevVal = (row[2] || 'USER').trim().toUpperCase();

      // Skip header row if present
      if (
        i === 0 &&
        (userVal.toLowerCase() === 'user' || userVal.toLowerCase() === 'username') &&
        (passVal.toLowerCase().includes('pasword') || passVal.toLowerCase().includes('password') || prevVal.toLowerCase().includes('previlage'))
      ) {
        continue;
      }

      if (userVal) {
        accounts.push({
          user: userVal,
          password: passVal,
          previlage: prevVal === 'OWNER' ? 'OWNER' : 'USER'
        });
      }
    }
  }

  // If live fetch returned nothing, use reliable fallback
  const finalAccounts = accounts.length > 0 ? accounts : FALLBACK_USER_ACCOUNTS;

  return { accounts: finalAccounts, isLive, error: fetchError };
}

/**
 * Validates user input against registered user list
 * Supports accounts with empty password in sheet (e.g. user 25890026)
 */
export function validateLogin(userInput: string, passInput: string, accounts: UserAccount[]): {
  success: boolean;
  userAccount?: UserAccount;
  message?: string;
} {
  const trimmedUser = userInput.trim();
  const trimmedPass = passInput.trim();

  if (!trimmedUser) {
    return {
      success: false,
      message: 'Username wajib diisi!'
    };
  }

  const userList = accounts && accounts.length > 0 ? accounts : FALLBACK_USER_ACCOUNTS;

  // Find user match (case-insensitive for username)
  const match = userList.find(
    acc => acc.user.toLowerCase() === trimmedUser.toLowerCase()
  );

  if (match) {
    // If account has empty password in Google Sheet, permit entry with empty or any password
    const isPasswordEmptyInDb = !match.password || match.password === '';
    
    if (isPasswordEmptyInDb || match.password === trimmedPass) {
      return {
        success: true,
        userAccount: match
      };
    }

    return {
      success: false,
      message: 'Password salah! Periksa kembali password Anda.'
    };
  }

  return {
    success: false,
    message: 'silahkan hubungi admin untuk registrasi user'
  };
}

export type AuthMethod = 'local' | 'ldap';

export interface LdapAuthResult {
  success: boolean;
  user?: string;
  role?: string;
  message?: string;
}

/**
 * Melakukan verifikasi autentikasi LDAP / SSO terhadap target (http://madiunjuara.com/)
 * Binary check: Hanya membaca status sukses atau gagal, tanpa menyimpan kredensial.
 */
export async function verifyLdapLogin(userInput: string, passInput: string): Promise<LdapAuthResult> {
  const trimmedUser = userInput.trim();
  const trimmedPass = passInput.trim();

  if (!trimmedUser) {
    return {
      success: false,
      message: 'Username SSO / User ID wajib diisi!',
    };
  }

  if (!trimmedPass) {
    return {
      success: false,
      message: 'Password SSO wajib diisi!',
    };
  }

  // Coba endpoint utama dan alias untuk kompatibilitas penuh di AI Studio (Express) & Vercel (Serverless)
  const candidateEndpoints = ['/api/auth/ldap', '/api/auth-ldap', '/api/auth/sso'];
  let lastErrorMessage = '';

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
        }),
      });

      // Jika endpoint mengembalikan 404 atau 405 (route belum terpetakan di host), coba kandidat berikutnya
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      // Pastikan respons bertipe JSON, bukan fallback HTML (index.html SPA)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        continue;
      }

      const data = await res.json().catch(() => null);
      if (!data) {
        continue;
      }

      // Jika berhasil login
      if (res.ok && data.success) {
        return {
          success: true,
          user: data.user || trimmedUser,
          role: data.role || 'USER',
          message: data.message || 'Verifikasi SSO berhasil',
        };
      }

      // Jika server secara eksplisit mengembalikan gagal autentikasi (401 / 400 / 502 / dsb)
      return {
        success: false,
        message: data.message || 'Username atau password SSO kantor salah',
      };
    } catch (err: any) {
      console.warn(`[SSO] Gagal menghubungi ${endpoint}:`, err);
      lastErrorMessage = err?.message || '';
    }
  }

  return {
    success: false,
    message: lastErrorMessage
      ? `Gagal terhubung ke service verifikasi SSO (${lastErrorMessage}). Silakan gunakan metode Local.`
      : 'Gagal terhubung ke service verifikasi SSO di hosting ini. Silakan gunakan metode Local.',
  };
}
