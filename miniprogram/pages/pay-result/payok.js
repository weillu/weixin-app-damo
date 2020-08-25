// miniprogram/pages/pay-result/payok.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id:'',
    total_fee:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ id, total_fee}) {
    wx.showLoading({
      title: '正在加载',
    })

    this.setData({
      id,
      total_fee
    }, async () => {

      wx.hideLoading()
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
        * 页面跳转
        */
  navbtn(event) {
    wx.reLaunch({
      url: `/pages/${event.detail}`
    })
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

  },
  // 查询订单，跳转至订单详情
  goto() {
    wx.reLaunch({
      url: `/pages/pay-result/index?id=${this.data.id}`
    })
  }
})