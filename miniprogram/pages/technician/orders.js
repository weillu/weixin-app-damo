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
    orders: [],
    userInfo: app.globalData.userInfo,
    tname:app.globalData.tname,
    date:'',
    technicianid:'',
    twork:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function ({ technicianid, date }) {
    console.log(technicianid+':'+date)
    this.setData({
      technicianid,
      date
    }, () => {

      this.getorder()

    })
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

  async getorder(){
    let temp = {
      'date': this.data.date,
      'technicianid': this.data.technicianid
    }
    if (this.data.date==''){
      temp = {
        'technicianid': this.data.technicianid
      }
    }
    const res1 = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'orders',
        value: temp
      }
    })

    this.setData({
      orders: res1.result.data
    })
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
       * 显示工时及床位
       */
  showbunks() {
    console.log("工时及床位")
    wx.showLoading({
      title: '查询中',
    })

    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'worksheet',
        pageSize: 100,
        value: {
          'date': this.data.date,
          'storeid': this.data.storeid,
          'technicianid': this.data.technicianid
        }
      }
    }).then(res => {
      let temp = res.result.data.reverse()
      for (let i = 0; i < temp.length; i++) {
        temp[i].on = 0
      }
      this.setData({
        twork: temp
      })
      console.log(temp)
      wx.hideLoading()

    }).catch(err => {
      console.error(err)
      wx.hideLoading()
    })

  }
})