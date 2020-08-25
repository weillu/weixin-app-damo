// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const temp = []
  for (let i = 0; i < event.work.length; i++) {
    let atime = new Date().getTime()
    
    try {
      temp[i] = await db.collection('worksheet').add({
        data: {
          _openid: wxContext.OPENID,
          addtime: atime,
          bedid: event.bedid,
          charge: event.charge,
          date: event.date,
          edittime: atime,
          storeid: event.storeid,
          sort: event.work[i].sort,
          state: 1,
          endtime:event.work[i].endtime,
          starttime: event.work[i].starttime,
          technicianid: event.technicianid,
          timebegin: event.work[i].timebegin,
          timeend: event.work[i].timeend
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
  // console.log(temp)
  
  return temp

}