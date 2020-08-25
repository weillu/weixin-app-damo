
// 优惠卷列表详情
const regeneratorRuntime = require('../../utils/runtime')
const map = new Map()
const app = getApp()

Page({
  data: {
    coupona: [],
    couponb: [],
    couponc: [],
    state:1,
    userinfo: app.globalData.userInfo
  },

  onLoad() {
    
    this.getUserinfo()
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
      path: `${app.globalData.url}?sharecode=${this.data.userinfo.mysharecode}`,
      imageUrl: app.globalData.logo
    }
  },

  // 获取可用的优惠卷详情
  async getCoupons() {
    wx.showLoading({
      title: '查询中',
    })
    const { result } = await wx.cloud.callFunction({
      name: "getData",
      data: {
        name: "coupon",
        value: {
          "_openid": this.data.userinfo._openid,
          "state": this.data.state
        }
      }
    })
    console.log(result)
    const data = result.data || {}
    if (this.data.state == 1) {
      let coupona = data
      this.setData({
        coupona
      }, () => {
        wx.hideLoading()
      })
    } else if (this.data.state == 2) {
      let couponb = data
      this.setData({
        couponb
      }, () => {
        wx.hideLoading()
      })
    } else {
      let couponc = data
      this.setData({
        couponc
      }, () => {
        wx.hideLoading()
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
  
  /**
       * 改变导航
       */
  onChange(event) {
    let state = parseInt(event.detail.name)
    this.setData({
      state
    }, () => {
      this.getCoupons()
    })

    
  },
  async getUserinfo(){
    const res = await wx.cloud.callFunction({
      name: 'user-login-register',
      data: {
        type: 'info'
      }
    })
    console.log(res)
    this.setData({
      userinfo: res.result.data
    }, () => {
      this.getCoupons()
    })
  }

})
