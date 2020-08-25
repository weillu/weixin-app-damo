// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
   env: cloud.DYNAMIC_CURRENT_ENV
  // env: 'damo-test-xk8dw'
})

// 云函数入口函数
exports.main = async (event, context) => {

  const {
    OPENID
  } = cloud.getWXContext()

  // 连接数据库
  const db = cloud.database()
  const _ = db.command
  let name = event.name
  let value = event.value || {}
  let orderBy = event.orderBy || 'desc'
  let type = event.type
  switch (type) {
    // 统一下单（分别在微信支付侧和云开发数据库生成订单）
    case 'unifiedorder': {
    }
  }


}