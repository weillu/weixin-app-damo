// 云函数入口文件
const cloud = require('wx-server-sdk')


cloud.init({
  // API 调用都保持和云函数当前所在环境一致
   env: cloud.DYNAMIC_CURRENT_ENV
  //env: 'damo-test-xk8dw'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let t = new Date().getTime()
  // t = Date.now()

  const db = cloud.database()
  const _ = db.command
  const orderCollection = db.collection('orders')
  const temppayCollection = db.collection('temppay')
  t = t - 1000*60*15 //15分钟前的时间
  console.log('=====微信支付成功后删除临时表数据=====')

  const temppay = await db.collection('temppay')
  .where({ 'time': _.lt(t)})
  .get()
  console.log('=====temppay.data=====' + temppay.data)
  let work = temppay.data
  for (let index in work) {
    let out_trade_no = work[index].out_trade_no
    console.log('=====out_trade_no=====' + out_trade_no)
      try {
        const closepay = await cloud.callFunction({
          name: 'pay',
          data: {
            type: 'closeorder',
            data: {
              out_trade_no
            }
          }
        })
      console.log('=======closepay=========')
      console.log(closepay)

        if (closepay.result.code==0){
          await temppayCollection
            .where({ out_trade_no })
            .remove()
          console.log('=======del temppay=========')
        }
      } catch (e) {
        console.log('===========')
        console.log(e)
      }
  }

  //处理过时的工作时间
  let tf = t
  // t = Date.now()

  const worksheetCollection = db.collection('worksheet')
  tf = tf + 1000 * 60 //1分钟前的时间
  console.log("======tf=====" + tf)
  const tempworksheet = await worksheetCollection
    .where({
      'starttime': _.lt(tf),
      'state': 1
    })
    .get()
  // console.log('=====tempworksheet.data=====' + tempworksheet.data)
  let worksheet = tempworksheet.data
  for (let index in worksheet) {
    let id = worksheet[index]._id
    try {
      const closeworks = await worksheetCollection
        .where({ '_id': id })
        .update({
          data: {
            "state": 3,
            "edittime": new Date().getTime()
          }
        })
    } catch (e) {
      console.log('===========')
      console.log(e)
    }
  }

  //处理过时的折扣卷
  

  const couponCollection = db.collection('coupon')
  console.log("======tf=====" + tf)
  const tempcoupon = await couponCollection
    .where({
      'starttime': _.lt(tf),
      'state': 1
    })
    .get()
  // console.log('=====tempcoupon.data=====' + tempcoupon.data)
  let coupons = tempcoupon.data
  for (let index in coupons) {
    let id = coupons[index]._id
    try {
      const closecoupons = await couponCollection
        .where({ '_id': id })
        .update({
          data: {
            "state": 3
          }
        })
    } catch (e) {
      console.log('===========')
      console.log(e)
    }
  }

}