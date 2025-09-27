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

    try{
        console.log('/api/auth/signup')
        if(req.method === "POST"){
            let hash = await bcrypt.hash(req.body?.password, 10);       // DB에 암호화해서 저장
            req.body.password = hash;       // 암호화한 것으로 교체

            let db = (await connectDB).db(dbName)
            await db.collection('user').insertOne(req.body);
            res.redirect(302, '/api/auth/signin');       // 회원가입 됬으면 로그인 페이지로 돌아가게
            return;             // 변경
        }
    }catch(error){
        res.status(500).json({error:'signup failed: '+error})
        return;                 // 변경
    }
}