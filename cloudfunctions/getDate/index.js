// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const formatTime = (timestamp,num) => {
  var date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  let temp = [year, month, day].map(formatNumber).join('-') 
  if (num=="2"){
    temp = temp + + ' ' + [hour, minute, second].map(formatNumber).join(':')
  }
  return temp
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let t = new Date().getTime()
  t = Date.now()
  if (event.type == "1" || event.type == "2"){
    let data = formatTime(t, event.type)
    t = data
  }
  return {
    time: t,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    userinfo: wxContext
  }
}