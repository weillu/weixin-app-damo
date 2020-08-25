const regeneratorRuntime = require('../../utils/runtime')
const db = wx.cloud.database(); // 初始化数据库
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    total_fee: 0,
    type:1,
    tradeId: '', 
    isAuthorized: false, // 已取得授权
    userInfo: app.globalData.userInfo,
    phoneNumber: app.globalData.userInfo.phoneNumber || undefined,
    nbLoading: true,
    technician: false,
    admin: false,
    loadin: false,
  },
  
  onLoad() {
    wx.showLoading({
      title: '查询中',
    })
    this.checkAuthSetting()
    this.checkUser()
  },
  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

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
    await db.collection('technician').where({ openid }).count({
      success: function (res) {
        let total = res.total
        if (total == 1) {
          that.setData({
            technician: true
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


    if (result.result.code == 0) {
      const res1 = await wx.cloud.callFunction({
        name: 'user-login-register',
        data: {
          type: 'info'
        }
      })
      console.log(res1)

      this.setUserInfo(res1.result.data)
      wx.hideLoading()
    } else {
      wx.hideLoading()
      wx.showToast({
        title: '获取手机号码失败，请重试',
        icon: 'none'
      })
    }
  },
  /**
     * 页面跳转
     */
  navbtn(event) {
    wx.navigateTo({
      url: `/pages/${event.detail}`
    })
  },
  
  getMoney(e) {
    let amount = e.detail.value;
    this.setData({
      total_fee: amount * 100
    })
  },
  choose(e) {
    let data = e.currentTarget.dataset;

    this.setData({
      total_fee: data.amount,
      type: data.type
    });
    this.pay()
  },

  pay() {

    let date = new Date().getTime().toString()
    let text = ""
    let possible = "0123456789"
    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    let tradeId=  'DaMo' + date + text
    console.log("tradeId=" + tradeId)
    this.setData({
      tradeId
    },()=>{
        // 调用云函数
        wx.cloud.callFunction({
          name: 'pay_cash',
          data: {
            totalFee: this.data.total_fee,
            tradeId: this.data.tradeId
          },
          success: res => {
            res = res.result;
            const order = res
            order.total_fee = this.data.total_fee
            order.out_trade_no = this.data.tradeId
            order.nickName = this.data.userInfo.nickName
            order.name = this.data.userInfo.nickName
            order.phoneNumber = this.data.userInfo.phoneNumber
            if (res) {
              console.log(res)
              // 支付
              wx.requestPayment({
                timeStamp: res.timeStamp,
                nonceStr: res.nonceStr,
                package: res.package,
                signType: res.signType,
                paySign: res.paySign,
                success: function (okres) {
                  console.log(okres)
                  if (okres.errMsg == 'requestPayment:ok') {
                    
                    order.addtime = new Date().getTime()
                    
                    order.trade_state_desc = "支付成功"
                    console.log(order)
                    wx.cloud.callFunction({
                      name: 'addData',
                      data: {
                        type:'addCash',
                        order
                      },
                      success: function success(addres) {
                        if (addres.result.code ==0){
                          wx.showToast({
                            title: '支付成功',
                            icon: 'success'
                          })
                          let event = {
                            detail:'my/my'
                          }
                          this.navbtn(event)
                        }
                      }
                    })

                  }
                  
                  
                  
                },
                fail: function (res) {
                  if (res.errMsg == 'requestPayment:fail cancel') {
                    wx.showToast({
                      title: '支付取消',
                      icon: 'none'
                    });
                  } else {
                    wx.showToast({
                      title: res.errmsg,
                      icon: 'none'
                    });
                  }
                }
              })
            }
          },
          fail: err => {
            wx.showToast({
              title: err.errMsg
            })
          }
        })

      })
  }
})