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
    userInfo: app.globalData.userInfo,
    technician: app.globalData.technician,
    technicianid: app.globalData.technician.technicianid,
    store: {},
    storeprice: 100,
    show: false,
    workday: [],
    tinfo: {},
    starttime: 0,
    timework: app.daywrok,
    bunks: 4,
    bunk: 1,
    date: '',
    work: [],
    twork: [],
    tid: [],
    cunt: 0,
    active: 0,
    oldone: -1,
    tipshow: false,
    deposit: app.globalData.deposit,
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    wx.showLoading({
      title: '查询中',
    })
    console.log('监听页面加载')
    await this.getworkday()
    await this.getuserInfo()
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
          name: 'technician',
          value: {
            openid
          }
        }
      })
      app.globalData.technician = res1.result.data[0]
      this.setData({
        tinfo: res1.result.data[0],
        technicianid: res1.result.data[0].id
      }, async () => {
        this.showbunks()
      })

    })

  },


  /**
   * 技师选择工作时间
   */
  createsort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let temp = this.data.twork
    temp[one].on = temp[one].on == 0 ? 1 : 0
    console.log(temp[one].on)
    this.setData({
      twork: temp
    })
    // console.log(this.data.twork)
    let t0 = map.get(t.id)
    // console.log(t0)
    if (t0 == undefined) {
      map.set(t.id, t)
    } else {
      map.delete(t.id)
    }
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index)
      w[w.length] = value
    })
    let tip = false
    if (w.length != 0) {
      tip = true
    }
    this.setData({
      work: w,
      tipshow: tip
    })

  },

  /**
   * 去掉技师选择工作时间
   */
  clearsort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let temp = this.data.twork
    let oldone = this.data.oldone
    temp[one].on = temp[one].on == 0 ? 1 : 0
    this.setData({
      twork: temp
    })
    // console.log(this.data.twork)
    let t0 = map.get(t.id)
    // console.log(t0)
    if (t0 == undefined) {
      map.set(t.id, t)
    } else {
      map.delete(t.id)
    }
    let w = []
    map.forEach(function (value, index) {
      w[w.length] = value
    })
    let tip = false
    if (w.length != 0) {
      tip = true
    }
    this.setData({
      work: w,
      tipshow: tip
    })

  },

  /**
     * 去掉技师选择工作时间
     */
  clearOrdersort: function (event) {
    let t = event.currentTarget.dataset
    let one = t.one
    let temp = this.data.twork
    temp[one].on = temp[one].on == 0 ? 1 : 0

    map.delete(t.id)
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index)
      w[w.length] = value
    })
    let tip = false
    if (w.length != 0) {
      tip = true
    }
    this.setData({
      work: w,
      tipshow: tip,
      twork: temp
    })

  },

  /**
       * 提交订单
       */
  async onClickButton() {

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
        if (promiseArr[i].total == 0) {
          wx.hideLoading()
          wx.showModal({
            title: '时间已经有订单',
            content: '您选的时间已经有人预订了。请重新选择休息',
          })
          map.clear()
          this.setData({
            work: [],
            tipshow: false
          })
          this.showbunks()
          return
        } else {

        }
      }
      
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'addData',
          data: {
            type: 'addRest',
            work: work
          }
        })
        console.log(result)
        const data = result.data
        if (result.code == 0) {
          wx.navigateTo({
            url: `/pages/technician/rest`
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



    } else {
      wx.showModal({
        title: '时段已有订单',
        content: '请重新选择要休息的时段',
      })

    }


    // console.log(this.data.work)
  },

  /**
       * 获取所需天的工作
       */
  getDaywork: function () {
    let storeid = this.data.storeid.toString()
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'worksheet',
        value: {
          storeid,
          'date': this.data.date,
          'technicianid': this.data.technicianid
        }
      }
    }).then(res => {
      console.log(res)
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
    let storeid = parseInt(this.data.storeid)
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name:'worksheet',
        pageSize:100,
        value: {
          'date': this.data.date,
          storeid,
          'technicianid': this.data.technicianid
        }
      }
    }).then(res => {
      let temp = res.result.data.reverse()
      for(let i=0;i<temp.length;i++){
        temp[i].on = 0
      }
      this.setData({
        twork: temp
      })
      console.log(temp)
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
      let one = util.formatTime(temp)
      let one1 = util.formatTime2(temp)
      let two = util.formatTime(temp + 1000 * 60 * 60 * 24)
      let two1 = util.formatTime2(temp + 1000 * 60 * 60 * 24)
      let three = util.formatTime(temp + 1000 * 60 * 60 * 24 * 2)
      let three1 = util.formatTime2(temp + 1000 * 60 * 60 * 24 * 2)
      let four = util.formatTime(temp + 1000 * 60 * 60 * 24 * 3)
      let four1 = util.formatTime2(temp + 1000 * 60 * 60 * 24 * 3)
      this.setData({
        date: util.formatTime(temp),
        workday: [
          { name: one1, val: one },
          { name: two1, val: two },
          { name: three1, val: three },
          { name: four1, val: four }
          ]
      })
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
        console.log(res)
        app.globalData.userInfo = result.data[0]
        this.setData({
          userInfo: app.globalData.userInfo
        })
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

      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  /**
     * 清空订单
     */
  clearorder() {
    map.clear()
    this.setData({
      twork: [],
      oldone: -1,
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
      oldone: -1,
      tipshow: false
    })
    map.clear()
    this.showbunks()
  }
})