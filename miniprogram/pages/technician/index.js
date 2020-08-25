const regeneratorRuntime = require('../../utils/runtime')
const util = require('../../utils/util')
const db = wx.cloud.database(); // 初始化数据库
const _ = db.command
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:app.globalData.userInfo,
    tinfo: app.globalData.technician,
    technicianid:'',
    damo_cash:0,
    today:'',
    tomorrow:'',
    tname: app.globalData.tname,
    today_total:0,
    tomorrow_total:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.getworkday()
    await this.getuserInfo()
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

/**
  * 导航跳转
  */
  navbtn(event) {
    console.log(event)
    wx.redirectTo({
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
      let temp = res.result.time
      let two = temp + 1000 * 60 * 60 * 24
      this.setData({
        today: util.formatTime(temp),
        tomorrow: util.formatTime(two)
      })
      
      // console.log(this.data.workday)
      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  /**
   * 获取用户信息
   **/
   async getuserInfo(){
     const res = await wx.cloud.callFunction({
       name: 'user-login-register',
       data: {
         type: 'info'
       }
     })
     console.log(res)
     this.setData({
       userInfo: res.result.data
     }, async () => {

       app.globalData.userInfo = res.result.data
       let openid = this.data.userInfo._openid
       const res1 = await wx.cloud.callFunction({
         name: 'getData',
         data: {
           name: 'technician',
           value:{
             openid
           }
         }
       }).then(function(data){
         return data
       })
       console.log(res1)
       app.globalData.technician = res1.result.data[0]
       this.setData({
         tinfo:res1.result.data[0],
         technicianid: res1.result.data[0].id,
         damo_cash: res1.result.data[0].damo_cash
       }, async () => {
          this.getOrder()
       }) 

     })
     
   },
   /**
   * 获取用户订单信息
   **/
  async  getOrder(){
    let technicianid = this.data.tinfo.id
    let date = this.data.today
    let status = 1
    const that = this
    await db.collection('orders').where({ technicianid, date, status}).count({
      success: function (res) {
        let total = res.total || 0
        that.setData({
            today_total:total
        })
      }
    })
    date = this.data.tomorrow
    await db.collection('orders').where({ technicianid, date, status }).count({
      success: function (res) {
        let total = res.total || 0
        that.setData({
          tomorrow_total: total
        })
      }
    })
  }
})