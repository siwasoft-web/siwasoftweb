import bcrypt from 'bcrypt';
import { connectDB } from "../../util/db";

const dbName = process.env.DB_NAME || "siwasoftweb";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '허용되지 않은 메서드' });
  }

  const { email, password } = req.body;

  try {
    const db = (await connectDB).db(dbName);
    const user = await db.collection('user').findOne({ email });

    if (!user) {            // 못찾았다
      return res.status(401).json({ success: false, message: '등록되지 않은 이메일입니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);                  // 둘이 같은지 비교
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 로그인 성공 시
    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.email,
        token: '1'
      },
    });

  } catch (err) {
    console.error('[로그인 오류]', err);
    return res.status(500).json({ success: false, message: '서버 오류: ' + err });
  }
}