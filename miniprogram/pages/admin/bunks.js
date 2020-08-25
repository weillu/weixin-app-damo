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
    userInfo: app.globalData.userInfo,
    id:0,
    _id:'',
    admin: {},
    dialogshow: false,
    vresions: [],
    tempdata: {},
    Svalue: '',
    images: [], // 上传的图片
    fileIds: [],
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ id }) {
    this.setData({
      id
    },()=>{
      this.getuserInfo()
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
   * 获取用户信息
   **/
  async getuserInfo() {
    const res = await wx.cloud.callFunction({
      name: 'user-login-register',
      data: {
        type: 'info'
      }
    })

    this.setData({
      userInfo: res.result.data
    }, async () => {

      app.globalData.userInfo = res.result.data
      let openid = this.data.userInfo._openid
      const res1 = await wx.cloud.callFunction({
        name: 'getData',
        data: {
          name: 'admin',
          value: {
            openid
          }
        }
      })
      app.globalData.admin = res1.result.data[0]

      this.setData({
        admin: res1.result.data[0]
      }, async () => {
        this.getData()
      })

    })

  },
  /**
  * 获取用户订单信息
  **/
  async  getData() {

    let tvalue = { 'storeid': this.data.id }
    
    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'bunks',
        value: tvalue
      }
    })
    console.log(res)
    this.setData({
      version: res.result.data
    }, async () => {

    })
  },

  dialogClose() {
    this.setData({ dialogshow: false })
  },
  deldialog(event){
    console.log(event)
    let _id = event.target.dataset.id
    this.setData({ dialogshow: true, _id })
  },
  /*
  滑动显示删除按钮
  */
  swipeClose(event) {
    console.log(event)
    const { position, instance } = event.detail
    switch (position) {
      case 'cell':
        instance.close()
        break
      case 'right':
        this.setData({
          dialogshow: true
        })
        break
    }
  },

  /***
   * 删除数据
  **/
  async delinfo() {
    let _id = this.data._id

    const result = await db.collection("bunks").where({
      _id
    }).remove()

    console.log(result)

    if (result.errMsg == "collection.remove:ok") {
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000
      })
      this.setData({
        dialogshow: false
      }, () => {
        this.getData()
      })
    } else {
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  },

  /***
   * 添加床位
  **/
  async addbunks() {
    let bed = this.data.version.length + 1
    let data = {
      storeid: this.data.id,
      bed
    }
    
    const result = await db.collection("bunks").add({
      data: data
    })

    console.log(result)

    if (result.errMsg == 'collection.add:ok') {
      this.getData()
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 2000
      })
    } else {
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  }
  
})