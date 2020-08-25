let store = require('./../../utils/store.js')
let util = require('./../../utils/util.js')
const regeneratorRuntime = require('../../utils/runtime')
const db = wx.cloud.database() // 初始化数据库
const _ = db.command

const map = new Map()

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    storeid: app.globalData.storeid,
    store: {},
    storeprice:100,
    show: false,
    workday: [],
    tinfo: {},
    starttime:0,
    timework: app.daywrok,
    bunks: 4,
    bunk: 1,
    date: '',
    work: [],
    twork: [],
    tid: [],
    cunt: 0,
    active: 0,
    allprice:0,
    oldone:-1,
    tipshow:false,
    userInfo: app.globalData.userInfo,
    deposit: app.globalData.deposit,
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('监听页面加载')
    console.log('options' + options)
    app.globalData.sharecode = options.sharecode
    this.seachDamo()
    this.updateSession()
    this.getworkday()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('监听页面初次渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.restartDate()
    console.log('监听页面显示')
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('监听页面隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('监听页面卸载')
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
  getstoreInfo: function () {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'store',
        value: { 'id': parseInt(this.data.storeid) }

      }
    }).then(res => {
      // console.log(res)
      this.setData({
        store: res.result.data.reverse()[0]
      })
      this.setData({
        storeid: this.data.store.id,
        bunks: this.data.store.bunks
      })

      this.getstoreratio()

      // console.log(this.data.store)
      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  /**
       * 获取门店标准价格
       */
  getstoreratio: function () {

    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'price',
        value: {
          'grade': this.data.store.grade
        }
      }
    }).then(res => {

      let t = res.result.data.reverse()
      console.log(t)
      let price = 5000 * t[0].ratio
      this.setData({
        storeprice: price
      })
      this.gettechnicianInfo() //调取工时

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  /**
   * 获取门店技师信息
   */
  gettechnicianInfo: function () {

    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value: {
          'storeid': this.data.storeid
        }
      }
    }).then(res => {

      // let t = res.result.data.reverse()
      // console.log(t)
      this.setData({
        tinfo: res.result.data.reverse()
      })
      this.showbunks() //调取工时

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  
  /**
   * 技师选择工作时间
   */
  createsort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let two = t.two
    if (this.data.oldone==-1){
      this.setData({
        oldone:one
      })
    }else{
      if (this.data.oldone!=one){
        wx.showModal({
          title: '订单只支持单人服务',
          content: '为了保证您的体验，达摩减压只支持单人服务',
        })
        return
      }

    }
    let temp = this.data.twork
    let price = this.data.allprice
    let stime = this.data.starttime
    temp[one].bunksList[two].on = temp[one].bunksList[two].on == 0 ? 1 : 0
    console.log(temp[one].bunksList[two].on)
    this.setData({
      twork: temp
    })
    // console.log(this.data.twork)
    let t0 = map.get(t.id)
    // console.log(t0)
    if (t0 == undefined) {
      map.set(t.id, t)
      price = price + t.charge
    } else {
      price = price - t.charge
      map.delete(t.id)
    }
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index)
      w[w.length] = value
      if (stime > parseInt(value.starttime) || stime==0){
        stime = parseInt(value.starttime)
      }
    })
    let tip = false
    if (w.length != 0) {
      tip = true
    } 
    this.setData({
      work: w,
      allprice: price,
      tipshow: tip,
      starttime: stime
    })
    
  },

  /**
   * 去掉技师选择工作时间
   */
  clearsort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let two = t.two
    let temp = this.data.twork
    let price = this.data.allprice
    let stime = this.data.starttime
    let oldone = this.data.oldone
    temp[one].bunksList[two].on = temp[one].bunksList[two].on == 0 ? 1 : 0
    // console.log(temp[one].bunksList[two].on)
    this.setData({
      twork: temp
    })
    // console.log(this.data.twork)
    let t0 = map.get(t.id)
    // console.log(t0)
    if (t0 == undefined) {
      map.set(t.id, t)
      price = price + t.charge
    } else {
      price = price - t.charge
      map.delete(t.id)
    }
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index)
      w[w.length] = value
      if (stime > parseInt(value.starttime)) {
        stime = parseInt(value.starttime)
      }
    })
    let tip = false
    if (w.length != 0) {
      tip = true
      oldone = -1
    }
    this.setData({
      work: w,
      oldone:oldone,
      allprice: price,
      tipshow: tip,
      starttime: stime
    })

  },

  /**
     * 去掉技师选择工作时间
     */
  clearOrdersort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let two = t.two
    let temp = this.data.twork
    let price = this.data.allprice
    let stime = this.data.starttime
    let oldone = this.data.oldone
    temp[one].bunksList[two].on = temp[one].bunksList[two].on == 0 ? 1 : 0
 
    // console.log(t0)
    price = price - t.charge
    map.delete(t.id)
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index)
      w[w.length] = value
      if (stime > parseInt(value.starttime)) {
        stime = parseInt(value.starttime)
      }
    })
    let tip = false
    if (w.length != 0) {
      tip = true
      oldone = -1
    }
    this.setData({
      work: w,
      allprice: price,
      tipshow: tip,
      oldone: oldone,
      starttime: stime,
      twork: temp
    })

  },

  /**
       * 提交订单
       */
  async onClickButton () {

    let work = this.data.work
    if (work.length != 0) {
      wx.showLoading({
        title: '提交中',
      })
      let promiseArr = [];
      for (let i = 0; i < work.length; i++) {
        promiseArr[i] = await db.collection('worksheet').where({
          _id: work[i].id,
          state: 1
        }).count()
          if (promiseArr[i].total==0){
            wx.hideLoading()
            wx.showModal({
              title: '时间已经被占用',
              content: '您选的时间已经有人预订了。请重新预订',
            })
            map.clear()
            this.setData({
              work:[],
              tipshow:false
            })
            this.showbunks()
            return
          }else{
            
          }
        }
      let price = this.data.allprice
      let stime = this.data.starttime
      let date = this.data.date
      let technicianid = work[0].technicianid
      let storeid = this.data.storeid
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'pay',
          data: {
            type: 'unifiedorder',
            data: {
              work,
              total_fee: price,
              starttime: stime,
              date,
              technicianid,
              storeid
            }
          }
        })
        console.log(result)
        const data = result.data
        if (result.code == 0) {
          wx.navigateTo({
            url: `/pages/pay-result/index?id=${data.out_trade_no}`
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '下单失败，请重试',
            icon: 'none'
          })
        }


      } catch (err) {
        wx.hideLoading()
        wx.showToast({
          title: '下单失败，请重试',
          icon: 'none'
        })
      }

      

      }else {
        wx.showModal({
          title: '没有预约的时段',
          content: '请选择要预约的时段',
        })

      }

      
    // console.log(this.data.work)
  },

  /**
       * 获取所需天的工作
       */
  getDaywork: function (bunk) {
    // console.log("222")
    let tbunk = (bunk + 1).toString()
    console.log("tbunk")
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'worksheet',
        value: {
          'storeid': this.data.storeid,
          'date': this.data.date,
          'bunk': tbunk
        }
      }
    }).then(res => {
      // console.log(res.result.data.reverse())
      let tdata = res.result.data.reverse()
      let bunkwork = app.daywrok
      if (tdata.length != 0) {
        for (let i = 0, k = 0; i < bunkwork.length; i++) {
          if (bunkwork[i].sort == tdata[k].sort) {
            bunkwork[i] = tdata[k]
            let tid = this.data.tid
            if (tid[tid.length - 1] != tdata[k].technicianid) {
              tid[tid.length] = tdata[k].technicianid
              this.setData({
                tid: tid
              })
            }
            k++
          }
        }
      } else {

      }


      return bunkwork

    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  /**
       * 显示工时及床位
       */
showbunks() {
    console.log("工时及床位")

    wx.showLoading({
      title: '查询中',
    })

    wx.cloud.callFunction({
      name: 'getstorework',
      data: {
        date: this.data.date,
        storeid: this.data.storeid.toString()
      }
    }).then(res => {
      console.log(res)
      // console.log(res.result.data.reverse())
      let temp = res.result.reverse()
      for (let i = 0; i < temp.length; i++) {
        let tempa = temp[i].bunksList
        let tempb = this.data.tinfo
        let tempc = []
        if (tempa.length != 0) {
          for (let f = 0; f < tempb.length; f++) {
            if (tempb[f].id == tempa[0].technicianid) {
              tempb[f].price = this.data.storeprice * tempb[f].ratio  //计算价格
              temp[i].tinfo = tempb[f]
              temp[i].num = i
            }
          }
          for (let t = 0, k = 0; t < app.daywrok.length; t++) {
            if (app.daywrok[t].sort == tempa[k].sort) {
              tempc[t] = tempa[k]
              k++
            } else {
              tempc[t] = app.daywrok[t]
            }
            tempc[t].on = 0
          }
          temp[i].bunksList = tempc

        } else {
          temp[i].bunksList = app.daywrok
        }
      }
      temp.unshift({nav:true, bunksList: this.data.timework})
      this.setData({
        twork: temp
      })
      // console.log(temp)
      wx.hideLoading()

    }).catch(err => {
      console.error(err)
      wx.hideLoading()
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
        date: util.formatTime(temp),
        workday: [
          { name: '今天', val: util.formatTime(temp) },
          { name: '明天', val: util.formatTime(two) }]
      })
      this.getstoreInfo()
      // console.log(this.data.workday)
      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },

  /**
     * 选择按摩时间
     */
  changeDate(event) {

    this.setData({
      date: this.data.workday[event.detail.name].val
    })
    this.clearorder()
  },
/**
     * 打电话
     */
  tel() {
    wx.makePhoneCall({
      phoneNumber: this.data.store.phone,
    })
  },
  /**
       * 查看按摩师信息
       */
  gototinfo(event) {
    console.log(event)
    let id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/tInfo/tInfo?id=${id}`
    })
  },

  
  /**
       * 页面跳转
       */
  navbtn(event) {
    wx.redirectTo({
      url: `/pages/${event.detail}`
    })
  },

  // 更新 session_key
  async updateSession() {
    wx.login({
      success: async (res) => {
        try {
          const result = await wx.cloud.callFunction({
            name: 'user-login-register',
            data: {
              type: 'session',
              code: res.code,
              sharecode: app.globalData.sharecode
            }
          })
          console.log(result)
        } catch (e) {
          console.log(e)
        }

      }
    })
    if (app.globalData.userInfo.phoneNumber == undefined) {
      await wx.cloud.callFunction({
        name: 'user-login-register',
        data: {
          type: 'info'
        }
      }).then(res => {
        let { result } = res
        app.globalData.userInfo = result.data
        this.setData({
          userInfo: app.globalData.userInfo
        })
        console.log(this.data.userInfo)
      }).catch(err => {
        console.error(err)
      })
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
      // console.log(t)
      
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
  /**
     * 清空订单
     */
  clearorder(){
    map.clear()
    this.setData({
      twork: [],
      oldone:-1,
      cunt: 0,
      active: 0,
      allprice: 0,
      tipshow: false
    })
    this.showbunks()
  },

  /**
     * 重置所有内容
     */
  restartDate() {

    this.setData({
      show: false,
      starttime: 0,
      work: [],
      twork: [],
      tid: [],
      cunt: 0,
      active: 0,
      allprice: 0,
      oldone:-1,
      tipshow: false
    })
    map.clear()
    this.showbunks()
  }
})