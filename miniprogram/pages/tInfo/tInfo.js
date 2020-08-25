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
    id:'',
    images:[],
    techincian: [],
    total: '0',
    comments:[],
    tname: app.globalData.tname,
    deposit: app.globalData.deposit
  },

  getTechincian: function () {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value:{
          'id':this.data.id
        }
      }
    }).then(res => {
      
      let data = res.result.data.reverse()
      this.setData({
        techincian: data[0],
        images:data[0].images
      })
      this.getComments()
      
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
    });



  },
  /**
   * 读取用户评论总数及显示用户评价
   */
  async getComments() {
    

    try {
      const that = this
      await db.collection('comment').where({ 
        'technicianid': this.data.id 
        }).count({
        success: function (res) {
          let total = res.total
          that.setData({
            total
          })
        }
      })
      
      const { result } = await wx.cloud.callFunction({
        name: 'getData',
        data: {
          name: 'comment',
          value: { 'technicianid': this.data.id }

        }
      })
      let comments = result.data || []
      this.setData({
        comments
      })
      
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '下单失败，请重试',
        icon: 'none'
      })
    }

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ id }) {
    wx.showLoading({
      title: '正在加载',
    })
    
    this.setData({
      id: id
    }, async () => {
      await this.seachDamo()
      await this.getTechincian()
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
    // this.getTechincianList();
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
      app.globalData.tname = t[0].tname
      app.globalData.title = t[0].title
      this.setData({
        deposit: t[0].deposit,
        tname: t[0].tname
      })

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  formatTime: function(timestamp) {
    console.log(timestamp);
    let temp = util.formatTime(timestamp)
    return temp
  }
})