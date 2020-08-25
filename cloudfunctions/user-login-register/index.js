const cloud = require('wx-server-sdk')
const WXBizDataCrypt = require('./WXBizDataCrypt.js')
const {
  secret, APPID
} = require('./config/example.js')
const {
  WXMINIUser,
} = require('wx-js-utils')

const duration = 24 * 3600 * 1000 // 开发侧控制登录态有效时间

const formatTime = (timestamp, num) => {
  var date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  let temp = [year, month, day].map(formatNumber).join('-')
  if (num == "2") {
    temp = temp + + ' ' + [hour, minute, second].map(formatNumber).join(':')
  }
  return temp
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})


// 云函数入口函数
exports.main = async (event) => {

  console.log(event)

  const {
    OPENID
  } = cloud.getWXContext()
  const {} = event
  const db = cloud.database()
  const users = await db.collection('users').where({
    _openid: OPENID
  }).get()

  switch (event.type) {

    case 'session': {
      console.log('session')
      const wXMINIUser = new WXMINIUser({
        appId: APPID,
        secret
      })

      const code = event.code // 从小程序端的 wx.login 接口传过来的 code 值
      const sharecode = event.sharecode
      const info = await wXMINIUser.codeToSession(code)
      try {
        // 查询有没用户数据
        const user = await db.collection('users').where({
          _openid: OPENID
        }).get()

        // 如果有数据，则只是更新 `session_key`，如果没数据则添加该用户并插入 `sesison_key`
        if (user.data.length) {
          console.log('更新 session_key')
          await db.collection('users').where({
            _openid: OPENID
          }).update({
            data: {
              session_key: info.session_key
            }
          })
        } else {
          console.log('创建用户')
          let pams = {
            session_key: info.session_key,
            _openid: OPENID,
            mysharecode: code,
            damo_cash: 0,
            recommender: sharecode,
            isLoaded:false
          }
          const result = await db.collection('users').add({
            data: pams
          })

          
          console.log('添加拆卷')

          if (result.errMsg == "collection.add:ok"){
            try {
              const result1 = await cloud.callFunction({
                name: 'addData',
                data: {
                  type: 'addCoupon',
                  _openid: OPENID
                }
              })
            } catch (e) {
              console.log(e)
            }

            if (result1.errMsg =="callFunction:ok"){
              return {
                code: 0,
                message: '添加用户、打折卷成功'
                
              }
            }
            
            
          }
          return {
            message: '添加用户,打折卷不成功',
            code: 0
          }
          
        }
      } catch (e) {
        return {
          message: e.message,
          code: 1,
        }
      }

      return {
        message: 'login success',
        code: 0
      }
    }
    case 'login': {
      console.log('login')
      const user = event.data.user
      console.log('user=' + user)
      try {
        // 将用户数据和手机号码数据更新到该用户数据中
        const result = await db.collection('users').where({
          _openid: OPENID
        }).update({
          data: {
            ...user
          }
        });
        console.log("result" + result)

        
      } catch (e) {
        return {
          message: e.message,
          code: 1
        }
      }
      

      return {
        message: 'success',
        code: 0
      }
    }
    case 'phone': {
      console.log('phone')
        // 进行数据解密
        const user = users.data[0]
        const wxBizDataCrypt = new WXBizDataCrypt(APPID, user.session_key)
        const data = wxBizDataCrypt.decryptData(event.encryptedData, event.iv)

        const expireTime = Date.now() + duration

        try {
          // 将用户数据和手机号码数据更新到该用户数据中
          const result = await db.collection('users').where({
            _openid: OPENID
          }).update({
            data: {
              phoneNumber: data.phoneNumber,
              expireTime,
              isLoaded: true
            }
          })

          if (!result.stats.updated) {
            return {
              message: 'update failure',
              code: 1
            }
          }
        } catch (e) {
          return {
            message: e.message,
            code: 1
          }
      }


      return {
        message: 'success',
        code: 0,
        data: {
          ...data
        },
      }
    }

    case 'info': {
      
      return {
        message: 'success',
        code: 0,
        data: users.data[0]
      }
    }


      


  }    
}