const regeneratorRuntime = require('../../utils/runtime')
const map = new Map()
const db = wx.cloud.database(); // 初始化数据库
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: {},
    content: '', // 评价的内容
    score: 5, // 评价的分数
    images: [], // 上传的图片
    fileIds: [],
    technicianid: -1,
    fileList: [],
    out_trade_no:'',
    conmments:0,
    order:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function ({ id }) {
    wx.showLoading({
      title: '加载中',
    })
    // id = 'pay1582171613792'
    let out_trade_no = id
    this.setData({
      out_trade_no
    }, async () => {
      // console.log(app.globalData.userInfo)
      await this.getOrder()
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
   * 图片选择后的方法
   */
  afterRead(event) {
    const { file } = event.detail
    console.log(event)
    let images =  []
    file.forEach((val, index, val_arr) => {
      images.push({ name: 'image' + index, isImage: true,url: file[index].path })
    });
    
    this.setData({ images })
    // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
  },
  submit: function() {
    wx.showLoading({
      title: '评论中',
    })
    console.log(this.data.content, this.data.score)

    // 上传图片到云存储
    let promiseArr = [];
    for (let i = 0; i < this.data.images.length; i++) {
      promiseArr.push(new Promise((reslove, reject) => {
        let item = this.data.images[i].url
        let suffix = /\.\w+$/.exec(item)[0] // 正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix, // 上传至云端的路径
          filePath: item, // 小程序临时文件路径
          success: res => {
            // 返回文件 ID
            console.log(res)
            console.log(res.fileID)
            this.setData({
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
      // db.collection('comment').add({
      //   data: {
      //     content: this.data.content,
      //     score: this.data.score,
      //     technicianid: this.data.technicianId,
      //     fileIds: this.data.fileIds
      //   }
      // }).then(res=>{
      //   wx.hideLoading();
      //   wx.showToast({
      //     title: '评价成功',
      //   })
      //   if (this.data.conmments==0){
      //     this.workupdate()
      //   }else{
      //     this.goto()
      //   }
        

      // }).catch(err=>{
      //   wx.hideLoading();
      //   wx.showToast({
      //     title: '评价失败',
      //   })
      // })

      wx.cloud.callFunction({
        name: 'pay',
        data: {
          type: 'comment',
          data: {
                content: this.data.content,
                score: this.data.score,
            technicianid: this.data.technicianid,
                fileIds: this.data.fileIds,
                out_trade_no: this.data.out_trade_no,
                userinfo: app.globalData.userInfo
              }
          }
          }).then(res1=>{
            wx.hideLoading();
            wx.showToast({
              title: '评价成功',
            })
            wx.reLaunch({
              url: '/pages/pay-order/index'
            })

          }).catch(err=>{
            wx.hideLoading();
            wx.showToast({
              title: '评价失败',
            })
          })

    })

  },
  onChange: function(event) {
    console.log(event.detail);
    this.setData({
      content: event.detail
    });
  },

  onScoreChange: function(event) {
    this.setData({
      score: event.detail
    });
  },
  delImg: function (event) {
    let {index } = event.detail
    let images = this.data.images
    images.splice(index, 1)
    this.setData({
      images
    })
  },
  uploadImg: function() {
    // 选择图片
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths
        console.log(tempFilePaths);
        let tempfile = []
        for (let i = 0; i <tempFilePaths.length;i++){
          let temp = {
            url: tempFilePaths[i],
            name: '图片'+i,
            isImage: true
          }
          tempfile.push(temp)
        }
        console.log(tempfile);
        this.setData({
          images: tempfile
        });
      }
    })
  },
  /**
       * 跳转订单列表
       */
  goto() {
    wx.reLaunch({
      url: '/pages/pay-order/index'
    })
  },

  // 获取订单详情
  async getOrder() {
    let out_trade_no = this.data.out_trade_no
    const { result } = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'orders',
        value: {
          out_trade_no
        }
      }
    })
    console.log(result)
    const data = result.data.reverse()
    let order = data[0]
    let work = order.work.reverse()
    let technicianid = work[0].technicianid
    let conmments = order.conmments || 0
    let userinfo = app.globalData.userInfo
    this.setData({
      order,
      technicianid,
      conmments,
      userinfo
    }, () => {
      wx.hideLoading()
    })
  }


  
})