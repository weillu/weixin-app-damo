
const db = wx.cloud.database(); // 初始化数据库
const _ = db.command
const app = getApp()
Page({



  /**
   * 页面的初始数据
   */
  data: {
    stores:[],
    tinfo:[],
    images:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getShopInfo()
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
   * 获取门店信息
   */
  getShopInfo: function (){

    
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'store',
        value: {}
        
      }
    }).then(res => {
      // console.log(res);
      let data = res.result.data.reverse()
      this.setData({
        stores: data
      })
      // console.log(this.data.stores)
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  },

  /**
   * 获取门店技师信息
   */
  gettechnicianInfo: function () {

    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value: { 'storeid': this.data.storeid }
      }
    }).then(res => {
      // console.log(res);
      this.setData({
        tinfo: res.result.data.reverse()
      })
      for(var i=0;i<this.data.tinfo.length;i++){
        this.getworkInfo(this.data.tinfo[i]._id, this.data.date);
      }
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  },

  /**
   * 获取门店技师工作时间
   */
  getworkInfo: function (technicianid,date) {
    console.log('technicianid=' + technicianid + ';date=' + date);
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'work',
        value: { 
          'storeid': this.data.storeid,
          'technicianid': technicianid,
          'date': date
          }
      }
    }).then(res => {
      let temp = this.data.work
      let temp1 = res.result.data.reverse()
      console.log(temp1);
      if (temp1!=''){
        // temp = temp.concat(temp1)
      }
      
      console.log(temp)
      this.setData({
        work: temp
      })
      console.log(this.data.work)
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  }
  
})