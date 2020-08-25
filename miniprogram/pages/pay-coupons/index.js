
// 订单详情
// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('../../utils/runtime')
const map = new Map()
const app = getApp()

Page({
  data: {
    coupons: [],
    id:'',
    ucoupons:[],
    total_fee:'0',
    actual_payment:0,
    work:1,
    show:false,
    userinfo: app.globalData.userInfo
  },

  onLoad({ id, work}) {
    console.log(work)
    let temp = JSON.parse(work)
    this.setData({
      id,
      work: temp
    })
    console.log(temp)
    this.getCoupons()

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

  // 获取可用的优惠卷详情
  async getCoupons() {
    if (this.data.userinfo==undefined){
      this.getOpenid()
    }else{

    
    const { result } = await wx.cloud.callFunction({
      name: "getData",
      data: {
        name: "coupon",
        value: {
          "_openid": this.data.userinfo.OPENID,
          "state": 1
        }
      }
    })
    console.log(result)
    const data = result.data || {}
    let coupons = data
    this.setData({
      coupons
    }, () => {

    })
    }
  },

  /**
      * 获取用户的Openid
      */
  getOpenid() {
    wx.cloud.callFunction({
      name: 'getDate',
      data: {}
    }).then(res => {
      console.log(res)
      let { result } = res
      app.globalData.userInfo = result.userinfo
      this.setData({
        userinfo: result.userinfo
      })
      this.getCoupons()
    }).catch(err => {
      console.error(err);
    });
  },

  /**
     * 选择优惠卷
     */
  useCoupon(event) {
    let t = event.currentTarget.dataset
    let temp = this.data.ucoupons
    let t0 = map.get(t.id)
    let temp_coupons = this.data.coupons
      // console.log(t0)
      if (t0 == undefined) {
        if (temp.length >= this.data.work) {
          wx.showModal({
            title: '已经不能使用',
            content: '折扣卷已经超过订单中的时间，不能再增加使用个数了',
          })
          return
        }
        map.set(t.id, t)
        temp[temp.length] = { "id": t.id, "type": t.type, "name": t.name}
        temp_coupons[t.index].on = 1
      } else {
        map.delete(t.id)
        temp_coupons[t.index].on = 0
        let w = []
        map.forEach(function (value, index) {
          // console.log(value + ': ' + index);
          w[w.length] = value
        })
        temp = w

      }
      if (temp.length==0){
        this.setData({
          show: false
        })
      }else{
        this.setData({
          show: true
        })
      }
      this.setData({
        ucoupons: temp,
        coupons:temp_coupons
      })
  },

  /**
       * 跳转订单列表
       */
  goto() {
    let id = this.data.id
    console
    // app.globalData.coupons = this.data.ucoupons
    let tempcoupons = JSON.stringify(this.data.ucoupons)
    wx.redirectTo({
      url: `/pages/pay-result/index?id=${id}&coupons=${tempcoupons}`
    })
},

// 取消卷
clearCoupon(e) {
    let id = this.data.id
    wx.redirectTo({
      url: `/pages/pay-result/index?id=${id}`
    })
},

  // 添加打折卷
addCoupon() {
    wx.login({
      success: async (res) => {

        try {
          const result = await wx.cloud.callFunction({
            name: 'addData',
            data: {
              type: 'addCoupon',
              _openid: app.globalData.userInfo._openid
            }
          })
          console.log(result)
        } catch (e) {
          console.log(e)
        }

      }
    })
},  
  
  
})
