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
Page({
  data: {
    historyorders: [],
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
    nowtime:0,
    tname:app.globalData.tname
  },

  onLoad() {
    
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
    this.restartDate()
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

  // 查询订单，跳转至订单详情
  queryorder(e) {
    wx.navigateTo({
      url: `/pages/pay-result/index?id=${e.currentTarget.dataset.order}`
    })
  },

  // 获取历史的所有订单
  async getHistoryOrder() {
    wx.showLoading({title: '数据获取中...'})
    const db = wx.cloud.database()
    const _ = db.command
    const result = await db.collection('orders')
      .where({ 'status': _.lt(2),'_openid':app.globalData.userInfo._openid })
      .orderBy('addtime', 'desc')
      .get()
    const data = result.data || []
    console.log(data)
    this.setData({
      historyorders: data
    })
    wx.hideLoading()
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
    })
  },



  // 发起订单支付详情
  async runOrder(e) {
    console.log(e)
    let out_trade_no = e.currentTarget.dataset.order
    this.setData({
      out_trade_no
    }, async()=>{

      await this.getOrder()
      await this.openCK()
    })
    
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
  async close(e) {
    console.log(e)
    let out_trade_no = e.currentTarget.dataset.order
    let index = e.currentTarget.dataset.index
    wx.showLoading({
      title: '正在取消订单',
    })
    const order = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'closeorder',
        data: {
          out_trade_no
        }
      }
    })
    if (order.result.code == 0) {
      const historyorders = this.data.historyorders
      historyorders[index].trade_state_desc = '订单已取消'
      historyorders[index].status = 2
      historyorders[index].trade_state = 'CLOSED'

      this.setData({
        historyorders
      })
      wx.showToast({
        title: '订单已取消 ',
        icon: 'none',
        duration: 1500,
      })
      
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
  async refund(e) {
    console.log(e)
    let out_trade_no = e.currentTarget.dataset.order
    let index = e.currentTarget.dataset.index
    wx.showLoading({
      title: '正在申请退款',
    })

    const result = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'refund',
        data: {
          out_trade_no
        }
      }
    })

    wx.hideLoading()

    if (!result.code) {
      const historyorders = this.data.historyorders
      historyorders[index].trade_state_desc = '正在退款'
      historyorders[index].status = 3
      historyorders[index].trade_state = 'REFUNDING'

      this.setData({
        historyorders
      })
    } else {
      this.showToast({
        title: result.message,
        icon: 'none'
      })
    }
  },

  /**
       * 跳转订单列表
       */
  goto(e) {
    let out_trade_no = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/pay-result/index?id=${out_trade_no}`,
    })
    // wx.reLaunch({
    //   url: `/pages/pay-result/payok?id=${this.data.out_trade_no}&total_fee=${this.data.total_fee}`
    // })
  },

 

  //点击提交订单
  openCK() {
    this.setData({ show: true })
  },
  //点击确认提交订单
  pushorder(event) {
    
    this.pay()
  },
  //点击取消提交订单
  onClose() {
    this.setData({ show: false })
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
      
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  /**
     * 重置所有内容
     */
  restartDate() {
    this.setData({
      historyorders: [],
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
    })
    this.getworkday()
    this.getHistoryOrder()
  }
})
