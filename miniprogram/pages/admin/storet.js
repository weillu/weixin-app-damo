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
    id: 0,
    _id:0,
    admin: {},
    show: false,
    dialogshow: false,
    version:[],
    technician:[],
    bunks:[],
    onbunk:-1,
    ont:-1,
    vresions: [],
    tempdata: [],
    tvalues:[],
    tbunks:[],
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ id }) {
    
    this.setData({
      id
    }, () => {
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
    const res = await db.collection("bunks").where({'storeid':this.data.id}).get()
    let tbunks = []
    res.data.forEach((val, index, val_arr) => {
      tbunks.push({ text: res.data[index].bed + '号', value: index })
    })

    console.log(tbunks)
    this.setData({
      bunks: res.data,
      tbunks
    }, async () => {

      this.getData()
      

    })

  },
  /**
  * 获取本店信息
  **/
  async  getData() {
    let storeid = parseInt(this.data.id)
    let tvalue = { storeid }
    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value: tvalue
      }
    })
    this.setData({
      version: res.result.data
    }, async () => {

    })
  },
  /**
  * 获取非本店用户信息
  **/
  async  getnot() {
    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value: { storeid:-1}
      }
    })
    let tvalues = []
    res.result.data.forEach((val, index, val_arr) => {
      tvalues.push({ text: res.result.data[index].name + ';' + res.result.data[index].phone, value: index })
    })
    this.setData({
      technician: res.result.data,
      tvalues: tvalues
    }, async () => {
      this.setData({ show: true})
    })
  },
  showPopup(event) {
    console.log(event)
    let tempdata = event.currentTarget.dataset
    let ont = -1
    let onbunk = -1
    if (tempdata.bed!=undefined){
      onbunk = parseInt(tempdata.bed) -1
      this.setData({ show: true, tempdata, onbunk, ont })
    }else{
      this.setData({tempdata, onbunk, ont })
      this.getnot()
    }
    
    
  },

  onClose() {
    this.setData({ show: false });
  },
  dialogClose() {
    this.setData({ dialogshow: false })
  },
  deldialog(event) {
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
    let s = {
      id:this.data._id,
      bed:'',
      bedid:'',
      storeid:-1
    }
    this.setData({
      tempdata:s
    },()=>{
      this.saveinfo()
    })
  },
  /***
   * 保存版本数据
  **/
  async saveinfo() {
    let s = this.data.tempdata
    let data = {
      sid: s.id,
      bed: s.bed,
      bedid: s.bedid,
      storeid: parseInt(s.storeid)
    }
    let type = 'storetechnician'
    const { result } = await wx.cloud.callFunction({
      name: 'addData',
      data: {
        type,
        data
      }
    })

    console.log(result)

    if (result.code == 0) {
      this.getData()
      wx.showToast({
        title: result.message,
        icon: 'success',
        duration: 2000
      })
      this.setData({
        show: false
      })
    } else {
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  },

  /**
     * 修改床位
     */
  onChangebunks({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.tempdata
    stemp.bed = this.data.bunks[detail].bed
    stemp.bedid = this.data.bunks[detail].bedid
    let onbunk = detail
    console.log(stemp)
    console.log(onbunk)
    this.setData({ tempdata: stemp, onbunk });
  },
  /**
   * 修改员工
   */
  onChanget({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.tempdata
    stemp.id = this.data.technician[detail]._id
    let ont = detail
    console.log(stemp)
    console.log(ont)
    this.setData({ tempdata: stemp, ont });
  }
})