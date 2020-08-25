// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})


// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  const {
    OPENID
  } = cloud.getWXContext()

  // 获取上下文
  const wxContext = cloud.getWXContext();
  // 连接数据库
  const db = cloud.database()
  const _ = db.command
  let orderBy = event.orderBy || 'desc'
  let pageSzie = event.pageSize || 20
  let cont = event.cont || 0
  let status = event.status || ''
  let date = event.date || ''
  let name = event.name || ''
  let phoneNumber = event.phoneNumber || ''
  let out_trade_no = event.out_trade_no || ''
  let value = {}
  if (name != '') {
    value.name = {
      $regex: '.*' + name,
      $options: 'i'
    }
  }
  if (phoneNumber != '') {
    value.phoneNumber = {
      $regex: '.*' + phoneNumber,
      $options: 'i'
    }
  }
  if (date != '') {
    value.date = {
      $regex: '.*' + date,
      $options: 'i'
    }
  }
  if (out_trade_no != '') {
    value.out_trade_no = {
      $regex: '.*' + out_trade_no,
      $options: 'i'
    }
  }
  value.status = status
  if (status==-2){
    value.status = _.eq(1).and(_.eq(5)).and(_.eq(6))
  }
  if (status == -1) {
    value.status = _.neq(10)
  }
  console.log(value)
  const countResult = await db.collection('orders').where(value).orderBy('addtime', orderBy).count()
  const total = countResult.total
    // 计算需分几次取
  const batchTimes = Math.ceil(total / pageSzie)
  
  const res = await db.collection('orders').where(value).orderBy('addtime', orderBy).skip(cont * pageSzie).limit(pageSzie).get()
    // 等待所有
  return {
    data: res.data,
    total: total,
    cont: cont,
    pageSzie: pageSzie,
    code:0,
    errMsg: res.errMsg
  }


}