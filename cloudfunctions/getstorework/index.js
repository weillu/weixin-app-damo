// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
  // env: 'damo-test-xk8dw'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database()
  const $ = db.command.aggregate
  const _ = db.command

  console.log(event)
  const storeid = event.storeid
  const res = await db.collection('bunks')
        .where({
          storeid
        })
    .orderBy('bed', 'desc')
        .get()

  console.log(res)
  let temp = res.data
  console.log(temp)
  for (let i = 0; i < temp.length; i++) {
    let te = await db.collection('worksheet').where({
      'bedid': temp[i]._id,
      'date': event.date
      })
      .orderBy('bed', 'desc')
      .get()
    console.log(te)
    temp[i].bunksList = te.data 

  }
  return temp      
}