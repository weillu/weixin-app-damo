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
      url: `/pages/horder/order-result?id=${e.currentTarget.dataset.order}`
    })
  },

  // 获取历史的所有订单
  async getHistoryOrder() {
    wx.showLoading({title: '数据获取中...'})
    const db = wx.cloud.database()
    const _ = db.command
    const result = await db.collection('orders')
      .where({ 'status': 5,'_openid':app.globalData.userInfo._openid })
      .orderBy('addtime', 'desc')
      .get()
    const data = result.data || []
    console.log(data)
    this.setData({
      historyorders: data
    })
    wx.hideLoading()
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
    this.getHistoryOrder()
  }
})
