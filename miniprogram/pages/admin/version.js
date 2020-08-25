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
    admin: {},
    show:false,
    vresion:[],
    editverson:{},
    Svalue:'',
    images: [], // 上传的图片
    fileIds: [],
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getuserInfo()
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
        this.getVersion()
      })

    })

  },
  /**
  * 获取用户订单信息
  **/
  async  getVersion() {

    let tvalue = {}
    if (this.data.Svalue!=''){
      tvalue = {
        version: {
          $regex: '.*' + this.data.Svalue,
          $options: 'i'
        }
      }
    }

    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'version',
        value: tvalue
      }
    })
    console.log(res)
    this.setData({
      vresion: res.result.data
    })
  },
  showPopup(event) {
    console.log(event)
    let images = []
    images.push({ name: 'image1', isImage: true, url: event.currentTarget.dataset.shareimg })
    this.setData({ images })
    this.setData({ show: true, editverson: event.currentTarget.dataset, fileIds: this.data.fileIds.concat(event.currentTarget.dataset.shareimg)})
  },

  onClose() {
    this.setData({ show: false });
  },

  /***
   * 保存版本数据
  **/
  async saveVersion(){
    let s = this.data.editverson
    if (s.version==undefined){
      wx.showToast({
        title: '请输入版本号',
        icon: 'error',
        duration: 2000
      })
      
    } else if (s.title == undefined) {
      wx.showToast({
        title: '请输入分享标题',
        icon: 'error',
        duration: 2000
      })

    } else if (s.tname == undefined) {
      wx.showToast({
        title: '请输入师傅名称',
        icon: 'error',
        duration: 2000
      })

    } else if (s.shareimg == undefined) {
      wx.showToast({
        title: '请上传图片',
        icon: 'error',
        duration: 2000
      })

    }
    let data = {
      title:s.title,
      tname:s.tname,
      shareimg:s.shareimg,
      version:s.version,
      deposit: s.deposit
    }
    let type = 'addversion'
    if (s.id != undefined){
      type = 'editversion'
      data._id = s.id
    }
    console.log(data)
    console.log(type)
    const { result } = await wx.cloud.callFunction({
      name: 'addData',
      data: {
        type,
        data
      }
    })
    
    console.log(result)

    if (result.code==0){
      this.getVersion()
      wx.showToast({
        title: result.message,
        icon: 'success',
        duration: 2000
      })
      this.setData({
        show:false
      })
    }else{
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  },

  onSearch() {
    this.getVersion()
  },
  onCancel() {
    this.setData({ Svalue: '' });
    this.getVersion()
  },
  /**
   * 图片选择后的方法
   */
  afterRead(event) {
    const { file } = event.detail
    console.log(event)
    let images = []
    file.forEach((val, index, val_arr) => {
      images.push({ name: 'image' + index, isImage: true, url: file[index].path })
    });

    this.setData({ images })
    // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
  
    wx.showLoading({
      title: '上传图片',
    })

    // 上传图片到云存储
    let promiseArr = [];
    for (let i = 0; i < images.length; i++) {
      promiseArr.push(new Promise((reslove, reject) => {
        let item = images[i].url
        let suffix = /\.\w+$/.exec(item)[0] // 正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix, // 上传至云端的路径
          filePath: item, // 小程序临时文件路径
          success: res => {
            // 返回文件 ID
            console.log(res)
            console.log(res.fileID)
            let stemp = this.data.editverson
            stemp.shareimg = res.fileID
            this.setData({
              editverson: stemp,
              fileIds: this.data.fileIds.concat(res.fileID)
            })
            reslove()
          },
          fail: console.error
        })
      }))
    }

    Promise.all(promiseArr).then(res => {
      // 插入数据
      
      wx.hideLoading()

    })
  },
  /**
   * 删除图片
   */
  delImg: function (event) {
    let { index } = event.detail
    let images = this.data.images
    let s = this.data.editverson
    s.shareimg = undefined
    images.splice(index, 1)
    this.setData({
      images,
      editverson:s
    })
  },

/**
   * 修改版本号
   */
  onChangeVersion({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.editverson
    stemp.version = detail
    this.setData({ editverson: stemp });
  },
  /**
     * 修改分享标题
     */
  onChangeTitle({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.editverson
    stemp.title = detail
    this.setData({ editverson: stemp });
  },
  /**
   * 修改请输入师傅名称
   */
  onChangeTname({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.editverson
    stemp.tname = detail
    this.setData({ editverson: stemp });
  },
  /**
   * 修改充值
   */
  onChangeDm({ detail }) {
    // 需要手动对 checked 状态进行更新
    let stemp = this.data.editverson
    stemp.deposit = detail
    this.setData({ editverson: stemp });
  },
/**
   * 修改搜索的值
   */
  onChangeSearch(e) {
    this.setData({
      Svalue: e.detail
    });
  }  
})