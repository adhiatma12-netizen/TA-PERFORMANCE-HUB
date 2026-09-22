import { verifySsoCredentials } from '../src/server/ssoAuthService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    const result = await verifySsoCredentials(username, password);
    res.status(result.statusCode || (result.success ? 200 : 401)).json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error saat verifikasi SSO',
    });
  }
}
