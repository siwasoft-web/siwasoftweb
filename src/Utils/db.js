// npm install mongodb
// 몽고DB 접속을 위한 코드

import { MongoClient } from "mongodb";
const url = `${process.env.MONGODB_URL}?retryWrites=true&w=majority`
const options = {};

if(process.env.NODE_ENV === 'development') {
    // 디버깅 2번실행에 대해 중복생성 방지
    if(!global._mongo){
        global._mongo = new MongoClient(url, options).connect()
    }
    connectDB = global._mongo
}
else{
    // npm run build 배포용 진짜 실행파일 일때
    connectDB = new MongoClient(url, options).connect()
}
export {connectDB};         // 몽고DB 연결을 다른 파일에서 사용할 수 있게 export

/*
    // 다른 파일에서 사용법
    const db = (await connectDB).db('데이터베이스명')                   // 필수

    let allData = await db.collection('컬렉션명').find().toArray();             // 전체 검색
    let data = await db.collection('컬렉션명').findOne({'키':'값'});          // 조건에 맞는 것 검색
    await db.collection('컬렉션명').insertOne({'키1':'값1', '키2':'값2'})   // 새로 입력
    await db.collection('컬렉션명').updateOne({'키':'원래값'}, {$set:{'키':'바꿀값'}});    // 변경
    await db.collection('컬렉션명').deleteOne({'키':'값'});         // 해당 항목 삭제
*/