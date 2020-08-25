const regeneratorRuntime = require('../../utils/runtime')
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: app.globalData.userInfo
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.updateSession()
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
       * 页面跳转
       */
  navbtn(event) {
    wx.redirectTo({
      url: `/pages/${event.detail}`
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

          let userInfo = res1.result.data

          app.globalData.userInfo = userInfo
          this.setData({
            userInfo,
          })
          await wx.hideLoading()
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
})