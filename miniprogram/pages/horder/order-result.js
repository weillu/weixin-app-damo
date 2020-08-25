// 订单详情
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
const getWeek = (timestamp) => { //timedat参数格式：   getWeek（new Date("2017-10-27" )）
  var timedat = new Date(timestamp)
  var week;

  if (timedat.getDay() == 0) week = "星期日"
  if (timedat.getDay() == 1) week = "星期一"
  if (timedat.getDay() == 2) week = "星期二"
  if (timedat.getDay() == 3) week = "星期三"
  if (timedat.getDay() == 4) week = "星期四"
  if (timedat.getDay() == 5) week = "星期五"
  if (timedat.getDay() == 6) week = "星期六"

  return week
}

const db = wx.cloud.database(); // 初始化数据库
const regeneratorRuntime = require('../../utils/runtime')
const app = getApp()
const map = new Map()



Page({
  data: {
    deposit: app.globalData.deposit,
    userInfo: app.globalData.userInfo,
    order: {},
    out_trade_no: '',
    total_fee: 0,
    actual_payment: 0,
    dico_fee: 0,
    coupons: [],
    time_fee: 0,
    coupons_fee: 0,
    damo_fee: 0,
    work: [],
    orderdate: '',
    orderweek: '',
    couponsCont: 0,
    ucoupons: false,
    isAuthorized: false, // 已取得授权
    nbLoading: true,
    show: false,
    nowtime: 0,
    loading: false
  },

  onLoad({ id, coupons }) {
    wx.showLoading({
      title: '正在加载',
    })
    this.seachDamo()
    console.log(coupons)
    this.checkAuthSetting()
    this.checkUser()

    this.setData({
      out_trade_no: id
    }, async () => {
      await this.getworkday()
      await this.getOrder()
      await console.log(coupons)
      if (coupons != undefined) {
        let tempcoupons = JSON.parse(coupons)
        this.setData({
          coupons: tempcoupons,
          ucoupons: true
        }, async () => {
          await this.Calculate_Order()
        })
      }
      wx.hideLoading()
    })

  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {
    console.log('监听页面初次渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

    console.log('监听页面显示')
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('监听页面隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('监听页面卸载')
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

  /**
      * 页面跳转
      */
  navbtn(event) {
    wx.navigateTo({
      url: `/pages/${event.detail}`
    })
  },

  /**
    * 获取时间
    */
  getworkday() {
    wx.cloud.callFunction({
      name: 'getDate',
      data: {
        type: '3'
      }
    }).then(res => {
      let nowtime = res.result.time
      this.setData({ nowtime })
      console.log(nowtime)
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  // 获取订单详情
  async getOrder() {
    console.log(this.data.out_trade_no)
    const { result } = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'orders',
        value: {
          'out_trade_no': this.data.out_trade_no
        }
      }
    })
    console.log(result)
    const data = result.data || {}
    let order = data[0]
    let total_fee = order.total_fee
    let damo_fee = order.damo_fee || 0
    let actual_payment = parseInt(order.actual_payment) || parseInt(order.total_fee)
    let work = order.work
    let coupons = order.coupon || this.data.coupons
    let couponsCont = coupons != undefined ? coupons.length : 0
    let orderdate = formatTime(order.starttime, 1)
    let orderweek = getWeek(orderdate)
    let time_fee = work[0].charge
    let coupons_fee = time_fee * couponsCont / 2
    if (app.globalData.deposit) {
      if (app.globalData.userInfo.damo_cash != 0 && damo_fee == 0) {
        if (app.globalData.userInfo.damo_cash >= (total_fee - coupons_fee)) {
          damo_fee = total_fee - coupons_fee
          actual_payment = 0
        } else {
          damo_fee = app.globalData.userInfo.damo_cash
          actual_payment = parseInt(total_fee - coupons_fee - damo_fee)
        }
      }
    } else {
      if (coupons_fee != 0) {
        actual_payment = parseInt(total_fee - coupons_fee)
      }
    }
    let dico_fee = parseInt(total_fee) - actual_payment
    this.setData({
      order,
      total_fee,
      actual_payment,
      dico_fee,
      damo_fee,
      work,
      coupons,
      orderweek,
      orderdate,
      time_fee,
      coupons_fee,
      couponsCont
    }, () => {

      if (data.status === 0) {
        // this.getCoupons()
      }
    })
  },


  // 获取可用的优惠卷详情
  async getCoupons() {
    const result = await db.collection('coupon').where({
      "_openid": this.data.order._openid,
      "state": 1
    }).count()
    console.log('result=' + result)
    let couponsCont = result.total || 0
    console.log('couponsCont=' + couponsCont)
    this.setData({
      couponsCont
    }, () => {

    })
  },

  // 获取计算的优惠卷详情
  Calculate_Order() {
    let coupons = this.data.coupons
    let total_fee = this.data.total_fee
    let couponsCont = coupons.length || 0
    let time_fee = this.data.time_fee
    let damo_fee = this.data.damo_fee
    let coupons_fee = parseInt(time_fee * couponsCont / 2)
    let actual_payment = this.data.actual_payment
    let damo_cash = app.globalData.userInfo.damo_cash
    if (app.globalData.deposit) {
      if (damo_cash != 0) {
        let temp_damo_fee = parseInt(total_fee - coupons_fee)
        if (damo_cash >= temp_damo_fee) {
          damo_fee = temp_damo_fee
          actual_payment = 0
        } else {
          damo_fee = damo_cash
          actual_payment = parseInt(total_fee - coupons_fee - damo_fee)
        }
      } else {
        if (coupons_fee != 0) {
          actual_payment = parseInt(total_fee - coupons_fee)
        }
      }
    } else {
      if (coupons_fee != 0) {
        actual_payment = parseInt(total_fee - coupons_fee)
      }
    }
    let dico_fee = parseInt(total_fee) - actual_payment
    this.setData({
      actual_payment,
      coupons_fee,
      couponsCont,
      damo_fee,
      dico_fee
    })
  },


  // 发起订单支付详情
  async addOrder() {
    wx.showLoading({
      title: '正在支付',
    })
    console.log(this.data.out_trade_no)
    const { result } = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'updateorder',
        data: {
          out_trade_no: this.data.out_trade_no,
          coupon: this.data.coupons,
          work: this.data.work,
          total_fee: this.data.total_fee,
          coupons_fee: this.data.coupons_fee,
          damo_fee: this.data.damo_fee,
          name: this.data.userInfo.nickName,
          nickName: this.data.userInfo.nickName,
          phoneNumber: this.data.userInfo.phoneNumber,
          actual_payment: this.data.actual_payment
        }
      }
    })
    console.log(result)
    const data = result.data || {}
    if (result.code == 0) {
      if (this.data.actual_payment == 0) {
        await wx.showToast({
          title: '下单成功',
          icon: 'ok'
        })
        await this.goto()
      } else {
        wx.hideLoading()
        data.body = '预订订单'
        this.setData({
          order: data,
          out_trade_no: data.out_trade_no,
        })
        await this.getOrder()
        await this.pay()
      }
    } else {
      wx.hideLoading()
      wx.showToast({
        title: '下单失败，请重试',
        icon: 'none'
      })
    }
  },

  // 发起支付
  pay() {
    const orderQuery = this.data.order
    const out_trade_no = this.data.out_trade_no
    console.log('=====orderQuery=====' + orderQuery)
    const {
      time_stamp,
      nonce_str,
      sign,
      prepay_id,
      body,
    } = orderQuery

    wx.requestPayment({
      timeStamp: time_stamp,
      nonceStr: nonce_str,
      package: `prepay_id=${prepay_id}`,
      signType: 'MD5',
      paySign: sign,
      success: async () => {
        wx.showLoading({
          title: '正在支付',
        })

        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500,
          success: async () => {
            this.getOrder()

            await wx.cloud.callFunction({
              name: 'pay',
              data: {
                type: 'payorder',
                data: {
                  body,
                  prepay_id,
                  out_trade_no,
                  total_fee: this.data.total_fee,
                  actual_payment: this.data.actual_payment,
                  damo_fee: this.data.damo_fee
                }
              }
            })

            await this.goto()
          }
        })
      },
      fail() { }
    })
  },

  // 关闭订单
  async close() {
    wx.showLoading({
      title: '正在关闭',
    })

    const out_trade_no = this.data.out_trade_no

    const order = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'closeorder',
        data: {
          out_trade_no
        }
      }
    })
    if (order.code == 0) {
      wx.showToast({
        title: '订单已关闭 ',
        icon: 'none',
        duration: 1500,
      })
      setTimeout(() => {
        this.goto()
      }, 1600)
    } else {
      wx.showToast({
        title: '订单取消发生意外 ',
        icon: 'none',
        duration: 1500,
      })
      // this.getOrder()
    }

    wx.hideLoading()
  },

  // 查询退款情况
  async queryRefund() {
    const { result } = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'queryrefund',
        data: {
          out_trade_no: this.data.out_trade_no
        }
      }
    })

    // 退款成功，则更新本地数据状态
    if (!result.code && result.data) {
      const data = result.data
      const order = this.data.order
      order.trade_state_desc = data.trade_state_desc
      order.status = data.status
      order.trade_state = data.trade_state

      this.setData({
        order
      })
    }
  },

  // 申请退款，但不会马上退
  async refund() {
    wx.showLoading({
      title: '正在申请退款',
    })

    const result = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'refund',
        data: {
          out_trade_no: this.data.out_trade_no
        }
      }
    })

    wx.hideLoading()

    if (!result.code) {
      const order = this.data.order
      order.trade_state_desc = '正在退款'
      order.status = 3
      order.trade_state = 'REFUNDING'

      this.setData({
        order
      })
    } else {
      this.showToast({
        title: result.message,
        icon: 'none'
      })
    }
  },

  // 删除订单
  async delete() {
    console.log(this.data)
    const order = this.data.order
    const db = wx.cloud.database()
    try {
      wx.showLoading({
        title: '正在删除',
      })

      await db.collection('orders').doc(order._id).remove()

      wx.hideLoading()
      wx.showToast({
        title: '删除成功 ',
        icon: 'none',
        duration: 1500,
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1600)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({
        title: '删除失败，请重试 ',
        icon: 'none'
      })
    }
  },

  /**
   * 选择优惠卷
   */
  useCoupon(event) {
    console.log(event)
    let t = event.currentTarget.dataset
    let price = parseInt(this.data.actual_payment)
    let temp = this.data.ucoupons
    console.log('price=====' + price)
    let t0 = map.get(t.id)
    // console.log(t0)
    if (t0 == undefined) {
      map.set(t.id, t)
      price = parseInt(price - parseInt(t.total_fee))
      temp[temp.length] = { "id": t.id, "type": t.type, "name": t.name, "total_fee": t.total_fee }
    } else {
      price = parseInt(price + parseInt(t.total_fee))
      map.delete(t.id)
      let w = []
      map.forEach(function (value, index) {
        // console.log(value + ': ' + index);
        w[w.length] = value
      })
      temp = w
    }

    console.log('price=' + price + '  ')
    this.setData({
      actual_payment: price,
      ucoupons: temp
    })

  },

  /**
       * 跳转订单列表
       */
  goto() {
    wx.reLaunch({
      url: `/pages/pay-result/payok?id=${this.data.out_trade_no}&total_fee=${this.data.total_fee}`
    })
  },

  /**
        * 跳转订单列表
  */
  gotoCoupons() {
    let work = this.data.work.length
    wx.navigateTo({
      url: `/pages/pay-coupons/index?id=${this.data.out_trade_no}&work=${work}`
    })
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

          this.setUserInfo(res1.result.data[0])

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
  setUserInfo(userInfo = {}, cb = () => { }) {
    userInfo.isLoaded = true

    //去掉敏感信息 session_key
    if (Object.prototype.hasOwnProperty.call(userInfo, 'session_key')) {
      delete userInfo.session_key
    }

    app.globalData.userInfo = userInfo
    this.setData({
      userInfo,
      loading: true
    }, cb)
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
    this.setUserTemp(userInfo)
  },

  // 获取用户手机号码
  async bindGetPhoneNumber(e) {
    console.log(e.detail);
    wx.showLoading({
      title: '正在获取',
    })

    try {
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

        this.setUserInfo(res1.result.data[0])

        wx.hideLoading()
      }


    } catch (err) {
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

  //点击提交订单
  openCK() {
    this.setData({ show: true })
  },
  //点击确认提交订单
  pushorder(event) {
    console.log(event.detail)
    this.addOrder()
  },
  //点击取消提交订单
  onClose() {
    this.setData({ show: false })
  },


  /**
     * 重置所有内容
     */
  restartDate() {
    this.setData({
      order: {},
      total_fee: 0,
      actual_payment: 0,
      dico_fee: 0,
      coupons: [],
      work: [],
      couponsCont: 0,
      nowtime: 0
    }, async () => {
      map.clear()
      await this.getworkday()
      await this.getOrder()
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
      this.setData({
        deposit: app.globalData.deposit
      })

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  // 添加评价
  comment() {
    wx.navigateTo({
      url: `/pages/comment/comment?id=${this.data.out_trade_no}`
    })
  }
})
