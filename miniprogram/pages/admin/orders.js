const regeneratorRuntime = require('../../utils/runtime')
const util = require('../../utils/util')
const db = wx.cloud.database(); // 初始化数据库
const _ = db.command

const wxCharts = require('../../utils/wxcharts')

let lineChart = null

const app = getApp()


Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: app.globalData.userInfo,
    admin: {},
    technicianid: '',
    damo_cash: 0,
    today: '',
    tomorrow: '',
    month:'',
    tname: app.globalData.tname,
    today_total: 0,
    tomorrow_total: 0,
    month_total:0,
    orders:{}
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.getworkday()
    await this.getuserInfo()
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
        tomorrow: util.formatTime(two),
        month: util.formatTime3(temp)
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
        this.getOrder()
        this.charts()
      })

    })

  },
  /**
  * 获取用户订单信息
  **/
  async  getOrder() {
    let technicianid = this.data.admin.id
    let date = this.data.today
    let month = this.data.month
    let status = 1
    const that = this
    await db.collection('orders').where({ date, status }).count({
      success: function (res) {
        let total = res.total || 0
        that.setData({
          today_total: total
        })
      }
    })
    date = this.data.tomorrow
    await db.collection('orders').where({ date, status }).count({
      success: function (res) {
        let total = res.total || 0
        that.setData({
          tomorrow_total: total
        })
      }
    })
    await db.collection('orders').where({
      status,
      date: {
        $regex: '.*' + this.data.month,
        $options: 'i'
      }
    }).count({
      success: function (res) {
        let total = res.total || 0
        that.setData({
          month_total: total
        })
      }
    })
  },
  touchHandler: function (e) {
    console.log(lineChart.getCurrentDataIndex(e));
    lineChart.showToolTip(e, {
      // background: '#7cb5ec',
      format: function (item, category) {
        return category + ' ' + item.name + ':' + item.data
      }
    });
  },
  updateData: function () {
    var series = [{
      name: '成交量',
      data: this.data.orders.orders,
      format: function (val, name) {
        return val.toFixed(2) + '万';
      }
    }];
    lineChart.updateData({
      categories: this.data.orders.date,
      series: series
    });
  },
  charsonload() {
    var windowWidth = 640;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }

    
    lineChart = new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories: this.data.orders.date,
      animation: true,
      // background: '#f5f5f5',
      series: [{
        name: '订单总金额',
        data: this.data.orders.orders,
        format: function (val, name) {
          return val.toFixed(2)+'万'
        }
      }, {
        name: '现金金额',
          data: this.data.orders.orders_cash,
        format: function (val, name) {
          return val.toFixed(2) + '万'
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: '成交金额 (万元)',
        format: function (val) {
          return val.toFixed(2);
        },
        min: 0
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });
  },


  async charts(){

    let result = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'statements',
        value: {
          date: {
            $regex: '.*' + this.data.month,
            $options: 'i'
          }
        }
      }
    }).then(function (data) {
      let tempdata = data.result.data
      let temp = {
        date:[],
        orders: [],
        cash: [],
        damo_cash: [],
        orders_price: [],
        orders_cash: [],
        orders_damo: [],
        orders_coupon: [],
        ok_orders: [],
        re_cash: [],
        re_damo: [],
        re_orders: [],
        re_orders_price: [],
        re_orders_cash: [],
        re_orders_damo: [],
        re_orders_coupon:[]
      }
      for (let i = 0; i < tempdata.length; i++) {
        temp.date.push(tempdata[i].date)
        temp.orders.push(tempdata[i].orders)
        temp.cash.push(tempdata[i].cash)
        temp.damo_cash.push(tempdata[i].damo_cash)
        temp.orders_price.push(tempdata[i].orders_price)
        temp.orders_cash.push(tempdata[i].orders_cash)
        temp.orders_damo.push(tempdata[i].orders_damo)
        temp.orders_coupon.push(tempdata[i].orders_coupon)
        temp.ok_orders.push(tempdata[i].ok_orders)
        temp.re_cash.push(tempdata[i].re_cash)
        temp.re_damo.push(tempdata[i].re_damo)
        temp.re_orders.push(tempdata[i].re_orders)
        temp.re_orders_price.push(tempdata[i].re_orders_price)
        temp.re_orders_cash.push(tempdata[i].re_orders_cash)
        temp.re_orders_damo.push(tempdata[i].re_orders_damo)
        temp.re_orders_coupon.push(tempdata[i].re_orders_coupon)
      }
      return temp
      //......
    })
    await this.setData({
      orders: result
    })
    await this.charsonload()
  }
})