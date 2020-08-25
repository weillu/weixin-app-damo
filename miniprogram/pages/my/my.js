const regeneratorRuntime = require('../../utils/runtime')

const app = getApp()
const db = wx.cloud.database(); // 初始化数据库

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isAuthorized: false, // 已取得授权
    userInfo: app.globalData.userInfo,
    phoneNumber: app.globalData.userInfo.phoneNumber || undefined,
    nbLoading: true,
    technician:false,
    admin:false,
    loadin:false,
    deposit: app.globalData.deposit,
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    wx.showLoading({
      title: '查询中',
    })
    this.seachDamo()
    this.checkAuthSetting()
    this.checkUser()
  },

  /**
     * 生命周期函数--监听页面显示
     */
  onShow: function () {
    this.restartDate()
    console.log('监听页面显示')
  },
  /**
* 用户点击右上角分享
*/
  onShareAppMessage: function () {
    return {
      title: app.globalData.title,
      desc: app.globalData.desc,
      path: `${app.globalData.url}?sharecode=${this.data.userInfo.mysharecode}`,
      imageUrl: app.globalData.logo
    }
  },

  // 检测权限，在旧版小程序若未授权会自己弹起授权
  checkAuthSetting() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: async (res) => {
              if (res.userInfo) {
                const userInfo = res.userInfo
                // 将用户数据放在临时对象中，用于后续写入数据库
                this.setUserTemp(userInfo)
              }

              const userInfo = this.data.userInfo || {}
              userInfo.isLoaded = true
              this.setData({
                userInfo,
                isAuthorized: true
              })
            }
          })
        } else {
          this.setData({
            userInfo: {
              isLoaded: true,
            }
          })
        }
      }
    })
  },

  // 检测小程序的 session 是否有效
  async checkUser() {
    wx.checkSession({
      success: () => {
        // session_key 未过期，并且在本生命周期一直有效
        // 数据里有用户，则直接获取
        this.updateSession()
      },
      fail: () => {
        // session_key 已经失效，需要重新执行登录流程
        this.updateSession()
      }
    })
  },

  // 更新 session_key
  updateSession() {
    wx.login({
      success: async (res) => {
        console.log(res)
        console.log(app.globalData.sharecode)
        try {
          const result = await wx.cloud.callFunction({
            name: 'user-login-register',
            data: {
              type: 'session',
              code: res.code,
              sharecode: app.globalData.sharecode
            }
          })


          const res1 = await wx.cloud.callFunction({
            name: 'user-login-register',
            data: {
              type: 'info'
            }
          })
          console.log(res1)
          
          this.setUserInfo(res1.result.data)
          await wx.hideLoading()
        } catch (e) {
          console.log(e)
        }
      }
    })
  },

  // 检查用户是否登录态还没过期
  checkSession(expireTime = 0) {
    if (Date.now() > expireTime) {
      return false
    }

    return true
  },

  // 设置用户数据
  async setUserInfo(userInfo = {}, cb = () => { }) {
    userInfo.isLoaded = true

    // 去掉敏感信息 session_key
    // if (Object.prototype.hasOwnProperty.call(userInfo, 'session_key')) {
    //   delete userInfo.session_key
    // }

    app.globalData.userInfo = userInfo
    this.setData({
      userInfo,
      loadin: true
    }, cb)
    let openid = userInfo._openid

    
    const that = this
    await db.collection('technician').where({ openid}).count({
      success: function (res) {
        let total = res.total
        if (total==1){
          that.setData({
            technician:true
          })
        }
        
      }
    })
    await db.collection('admin').where({ openid }).count({
      success: function (res) {
        let total = res.total
        if (total == 1) {
          that.setData({
            admin: true
          })
        }

      }
    })

  },

  // 设置临时数据，待 “真正登录” 时将用户数据写入 collection "users" 中
  async setUserTemp(userInfo = null, isAuthorized = true, cb = () => { }) {
    this.setData({
      userTemp: userInfo,
      isAuthorized,
    }, cb)

    try {

      await wx.cloud.callFunction({
        name: 'user-login-register',
        data: {
          type: 'login',
          data: {
            user: userInfo
          }
        }
      })
    } catch (e) {
      console.log(e)
    }

  },

  // 手动获取用户数据
  async bindGetUserInfoNew(e) {
    const userInfo = e.detail.userInfo
    // 将用户数据放在临时对象中，用于后续写入数据库
    console.log(e)
    this.setUserTemp(userInfo)
  },

  // 获取用户手机号码
  async bindGetPhoneNumber(e) {
    console.log(e.detail);
    wx.showLoading({
      title: '正在获取',
    })

    const data = this.data.userTemp
    console.log('==============hey=====')
    console.log(data)
    const result = await wx.cloud.callFunction({
      name: 'user-login-register',
      data: {
        type: 'phone',
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      }
    })
    console.log(result)
    

    if (result.result.code==0){
      const res1 = await wx.cloud.callFunction({
        name: 'user-login-register',
        data: {
          type: 'info'
        }
      })
      console.log(res1)

      this.setUserInfo(res1.result.data)
      wx.hideLoading()
    }else{
      wx.hideLoading()
      wx.showToast({
        title: '获取手机号码失败，请重试',
        icon: 'none'
      })
    }
  },

  // 退出登录
  async bindLogout() {
    const userInfo = this.data.userInfo

    await db.collection('users').doc(userInfo._openid).update({
      data: {
        expireTime: 0
      }
    })

    this.setUserInfo()
  },


  /**
   * 用户点击充值
   */
  topay: function () {
    wx.navigateTo({
      url: '/pages/deposit/index'
    })
  },

  /**
   * 用户点击我的预订
   */
  myorder: function () {
    wx.navigateTo({
      url: '/pages/pay-order/index'
    })
  },

  /**
   * 用户点击历史消费记录
   */
  horder: function () {
    wx.navigateTo({
      url: '/pages/horder/horder'
    })
  },
  // 更新菜单
  seachDamo() {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'version',
        value: {
          'version': app.globalData.version
        }
      }
    }).then(res => {

      let t = res.result.data.reverse()
      console.log(t)

      app.globalData.deposit = t[0].deposit
      app.globalData.tname = t[0].tname
      app.globalData.title = t[0].title
      this.setData({
        deposit: t[0].deposit,
        tname: t[0].tname
      })

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  /**
   * 用户点击券
   */
  dm: function () {
    wx.navigateTo({
      url: '/pages/coupon-list/index'
    })
  },

  /**
      * 页面跳转
      */
  navbtn(event) {
    wx.redirectTo({
      url: `/pages/${event.detail}`
    })
  },

  /**
     * 重置所有内容
     */
  restartDate() {

    this.setData({
      userInfo: app.globalData.userInfo,
      nbLoading: true,
      deposit: app.globalData.deposit
    })
    this.seachDamo()
    this.checkAuthSetting()
    this.checkUser()
  }

})