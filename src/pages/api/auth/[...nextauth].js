// npm install next-auth
// npm install bcrypt
// npm i --save-dev @types/bcrypt
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import NaverProvider from "next-auth/providers/naver"
import KakaoProvider from "next-auth/providers/kakao"
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";            // 비밀번호 암호화용
import { connectDB } from "@/Utils/db";

// 구글로그인 OAuth
// 깃허브로그인 OAuth
// 자체DB로그인
const googleId = process.env.GOOGLE_ID || "";
const googleSecret = process.env.GOOGLE_SECRET || "";
const naverId = process.env.NAVER_CLIENT_ID || "";
const naverSecret = process.env.NAVER_CLIENT_SECRET || "";
const kakaoId = process.env.KAKAO_CLIENT_ID || "";
const kakaoSecret = process.env.KAKAO_CLIENT_SECRET || "";
const nextauthSecret = process.env.NEXTAUTH_SECRET || "siwasoftweb";
const DBName = process.env.DB_NAME || "siwasoftweb";

export const authOptions = {
    providers: [
        GoogleProvider({
            // 구글 로그인
            clientId: googleId,
            clientSecret: googleSecret,
            authorization: {
                params: {
                    prompt: "select_account"
                }
            }
        }),
        NaverProvider({
            // 네이버 로그인
            clientId: naverId,
            clientSecret: naverSecret
        }),
        KakaoProvider({
            // 카카오 로그인
            clientId: kakaoId,
            clientSecret: kakaoSecret,
            authorization: {
                params: {
                    prompt: "select_account"
                }
            }
        }),
        CredentialsProvider({
            // 자체DB 로그인
            name : "credentials",
            credentials:{
                email:{label:"email", type:"text"},
                password:{label:"password", type:"password"}
            },
            
            // 로그인 시도
            async authorize(credentials){
                let db = (await connectDB).db(DBName)
                let user = await db.collection('user').findOne({email:credentials?.email});
                if(!user) return null;

                const ok = await bcrypt.compare(credentials?.password ?? "", user.password);
                if(!ok) return null;

                return{
                    id:String((user)._id),
                    name:(user).name,
                    email:(user).email
                 }
            }
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
    },
    session:{
        strategy:'jwt',
        maxAge: 2 * 60 * 60
    },
    callbacks:{
        signIn: async({ user, account, profile }) => {
            // 소셜 로그인인 경우에만 DB에 저장
            if (account?.provider !== 'credentials') {
                try {
                    const db = (await connectDB).db(DBName);
                    
                    // 이미 존재하는 사용자인지 확인
                    const existingUser = await db.collection('user').findOne({ 
                        email: user.email 
                    });
                    
                    if (!existingUser) {
                        // 새로운 사용자 정보 생성
                        const userData = {
                            name: user.name || profile?.name || 'Unknown',
                            email: user.email,
                            provider: account.provider,
                            providerId: account.providerAccountId,
                            image: user.image || profile?.picture,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        
                        // DB에 저장
                        await db.collection('user').insertOne(userData);
                        console.log('소셜 로그인 사용자 DB 저장 완료:', user.email);
                    } else {
                        // 기존 사용자의 경우 업데이트 시간만 갱신
                        await db.collection('user').updateOne(
                            { email: user.email },
                            { $set: { updatedAt: new Date() } }
                        );
                    }
                } catch (error) {
                    console.error('소셜 로그인 사용자 DB 저장 오류:', error);
                    // DB 저장 실패해도 로그인은 허용
                }
            }
            return true;
        },
        jwt: async({token, user}) =>{
            if(user){
                token.user={};
                token.user.name = user.name;
                token.user.email = user.email;
            }
            return token;
        },
        session: async({session, token})=>{
            session.user = token.user;
            return session;
        }
    },
    secret:nextauthSecret
}

export default NextAuth(authOptions);