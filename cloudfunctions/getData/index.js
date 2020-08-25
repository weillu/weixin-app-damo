// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})


const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  const {
    OPENID
  } = cloud.getWXContext()

  // 获取上下文
  const wxContext = cloud.getWXContext()
  // 连接数据库
  const db = cloud.database()
  const _ = db.command
  let name = event.name
  let value = event.value || {}
  let orderBy = event.orderBy || 'desc'
  
  // console.log('name='+name+';value='+value)

  let pageSize = event.pageSize || ''
  console.log('pageSize:' + pageSize)
  const countResult = await db.collection(name).where(value).count()
  const total = countResult.total
  if (total==0){
    return {
      data: [],
      total: total,
      cont: 0,
      pageSize: pageSize,
      code: 0 
    }
  }
  if (pageSize==''){
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection(name).where(value).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })

  }else{

    let cont = event.cont || 0
    // 计算需分几次取
    const batchTimes = Math.ceil(total / pageSize)

    // 承载所有读操作的 promise 的数组
    const res = await db.collection(name).where(value).orderBy('addtime', orderBy).skip(cont * pageSize).limit(pageSize).get()
    console.log(res)
    // 等待所有
    return {
      data: res.data,
      total: total,
      cont: cont,
      pageSize: pageSize,
      code: 0,
      errMsg: res.errMsg
    }
  }


}