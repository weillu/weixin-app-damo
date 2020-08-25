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
    date: '',
    admin: {},
    show: false,
    dialogshow: false,
    orders: [],
    tempdata: [],
    option1: [
      { text: '默认', value: 1 },
      { text: '全部', value: -1 },
      { text: '已充值', value: 1 },
      { text: '退款', value: 3 },],
    option2: [
      { text: '全部', value: -1 },
      { text: '订单', value: 0 },
      { text: '姓名', value: 1 },
      { text: '电话', value: 2 },
      { text: '日期', value: 3 }],
    status: 1,
    type: -1,
    pageSize: 10,
    cont: 0,
    Svalue: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ date }) {
    console.log(date)
    this.setData({
      date
    }, () => {
      this.getData()
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
    this.restartDate()
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
    if (this.data.cont != -1) {
      let cont = this.data.cont + 1
      this.setData({
        cont
      }, () => {
        this.getData()
      })
    }
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
  * 获取订单信息
  **/
  async  getData() {
    
    let date = {
      $regex: '.*' + this.data.date,
      $options: 'i'
    }
    let status = this.data.status
    let pageSize = this.data.pageSize
    let cont = this.data.cont
    let tvalue = {
      date
    }
    if (status != -1) {
      tvalue.status = status
    }
    console.log(tvalue)
    if (this.data.Svalue != undefined) {
      if (this.data.type == 0) {
        tvalue.out_trade_no = {
          $regex: '.*' + this.data.Svalue,
          $options: 'i'
        }
      }
      if (this.data.type == 1) {
        tvalue.name = {
          $regex: '.*' + this.data.Svalue,
          $options: 'i'
        }
      }
      if (this.data.type == 2) {
        ltvalue.phoneNumber = {
          $regex: '.*' + this.data.Svalue,
          $options: 'i'
        }
      }
      if (this.data.type == 3) {
        tvalue.date = {
          $regex: '.*' + this.data.Svalue,
          $options: 'i'
        }
      }
    }

    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'cash',
        pageSize,
        cont,
        value: tvalue
      }
    })
    console.log(res)
    let orders = res.result.data
    console.log(orders)
    if (orders.length == 0) {
      this.setData({
        cont: -1
      })
    } else {
      this.setData({
        orders: this.data.orders.concat(orders)
      })
    }

  },

  showPopup(event) {
    console.log(event)
    // let _id = event.target.dataset.id
    let tempdata = event.currentTarget.dataset.item
    this.setData({ show: true, tempdata })


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

  
  // 查询退款情况
  async queryRefund() {
    const { result } = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'recash',
        data: {
          out_trade_no: this.data.out_trade_no
        }
      }
    })

    // 退款成功，则更新本地数据状态
    if (!result.code && result.data) {
      const data = result.data
      const order = this.data.tempdata
      order.trade_state_desc = data.trade_state_desc
      order.status = data.status
      order.trade_state = data.trade_state

      this.setData({
        tempdata:order
      })
    }
  },

  // 申请退款，但不会马上退
  async refund(event) {
    let out_trade_no = event.target.dataset.out_trade_no
    wx.showLoading({
      title: '正在申请退款',
    })

    const result = await wx.cloud.callFunction({
      name: 'pay',
      data: {
        type: 'recash',
        data: {
          out_trade_no
        }
      }
    })

    wx.hideLoading()
    console.log(result)
    if (result.result.code == 0) {
      const order = this.data.tempdata
      order.trade_state_desc = '正在退款'
      order.status = 3
      order.trade_state = 'REFUNDING'

      this.setData({
        tempdata:order,
        orders:[],
        cont:0
      })

      this.getData()
    } else {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
    }
  },
  onSearch() {
    this.setData({
      orders: [],
      cont: 0
    })
    this.getData()
  },
  onCancel() {
    this.setData({
      Svalue: '',
      orders: [],
      cont: 0
    });
    this.getData()
  },
  /**
     * 修改搜索的值
     */
  onChangeSearch(e) {
    this.setData({
      Svalue: e.detail
    });
  },
  /**
     * 修改查询条件中的条数
     */
  onChanget0({ detail }) {
    this.setData({
      orders: [],
      cont: 0,
      type: detail
    }, () => {
      // this.getData()
    })
  },
  /**
   * 修改查询条件中的订单状态
   */
  onChanget({ detail }) {
    this.setData({
      orders: [],
      cont: 0,
      status: detail
    }, () => {
      this.getData()
    })
  },
  /**
     * 重置所有内容
     */
  restartDate() {

    this.setData({
      show: false,
      dialogshow: false,
      orders: [],
      tempdata: [],
      status: 1,
      type: -1,
      pageSize: 10,
      cont: 0,
      Svalue: ''
    })
    this.getData()
  }
})