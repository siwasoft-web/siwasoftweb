import bcrypt from 'bcrypt'
import { connectDB } from '@/Utils/db'

const dbName = process.env.DB_NAME || "siwasoftweb";

export default async function handler(req, res)
{
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if(req.method === "OPTIONS"){
        res.status(200).end();
        return;
    }

    if(req.method !== "POST"){
        return res.status(405).json({ success: false, message: '허용되지 않은 메서드' });
    }

    try{
        console.log('/api/auth/signup', req.body);
        
        const { name, email, password } = req.body;
        
        // 필수 필드 검증
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '모든 필드를 입력해주세요.' 
            });
        }

        // 이메일 중복 확인
        let db = (await connectDB).db(dbName);
        const existingUser = await db.collection('user').findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: '이미 존재하는 이메일입니다.' 
            });
        }

        // 비밀번호 암호화
        const hash = await bcrypt.hash(password, 10);
        
        // 사용자 데이터 생성
        const userData = {
            name,
            email,
            password: hash,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // DB에 저장
        const result = await db.collection('user').insertOne(userData);
        
        if (result.insertedId) {
            return res.status(200).json({ 
                success: true, 
                message: '회원가입이 완료되었습니다.',
                userId: result.insertedId
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: '회원가입 중 오류가 발생했습니다.' 
            });
        }
        
    }catch(error){
        console.error('회원가입 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
}