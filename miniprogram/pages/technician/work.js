
let util = require('./../../utils/util.js')
const regeneratorRuntime = require('../../utils/runtime')
const db = wx.cloud.database(); // 初始化数据库
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
    show: false,
    workday: [],
    userinfo: app.globalData.userInfo,
    tinfo: {},
    timework: app.daywrok,
    bunks: 4,
    bunk: 1,
    bedid: '',
    date: '',
    work: [],
    tid: '',
    fileList: [],
    ondate:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.gettechnicianInfo()

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.getworkday()
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
    this.restartDate()
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
  getstoreInfo: function () {


    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'store',
        value: { 'id': this.data.storeid }

      }
    }).then(res => {
      console.log(res);
      this.setData({
        store: res.result.data[0]
      })
      this.getbunks()
      // console.log(this.data.store)
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
    let openid = app.globalData.userInfo._openid
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'technician',
        value: { 'openid': openid}
      }
    }).then(res => {
      console.log(res)
      console.log('res=' + res)
      let data = res.result.data.reverse()
      console.log('data=' + data[0])
      let t = data[0]
      console.log('t=' + res.result.data)
      this.setData({
        tinfo: t,
        tid: t._id,
        bunk: t.bed,
        bedid: t.bedid,
        storeid: t.storeid
      }, () => {
        this.getstoreInfo()
      })
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  },

  /**
   * 获取门店技师工作时间
   */
  getworkInfo: function (technicianid, date) {
    console.log('technicianid=' + technicianid + ';date=' + date);
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'worksheet',
        value: {
          'storeid': this.data.storeid,
          'technicianid': technicianid,
          'date': date
        }
      }
    }).then(res => {
      let temp = this.data.worksheet
      let temp1 = res.result.data.reverse()
      console.log(temp1);
      if (temp1 != '') {
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
  },

  /**
   * 技师选择工作时间
   */
  createsort: function (event) {
    if (this.data.tinfo == {}) {
      wx.showModal({
        title: '获取您的信息',
        content: '系统繁忙无法获取您的信息',
      })
      return
    }
    if (this.data.bedid == '') {
      wx.showModal({
        title: '请选择床位',
        content: '您还没有选择床位',
      })
      return
    }
    if (this.data.date == '') {
      wx.showModal({
        title: '请选择日期',
        content: '您还没有相应的日期',
      })
      return
    }

    let t = event.currentTarget.dataset
    let t0 = map.get(t.timebegin)
    // console.log(t0)
    if (t0 == undefined) {
      t.endtime = util.TimetoNumber(t.endtime)
      map.set(t.timebegin, t)
    } else {
      map.delete(t.timebegin)
    }
    let w = []
    map.forEach(function (value, index) {
      console.log(value + ': ' + index);
      w[w.length] = value
    })
    this.setData({
      work: w
    })
    // console.log(this.data.work)
  },

  /**
     * 技师选择工作时间
     */
  onday: function (event) {
    // console.log(event)
    this.setData({
      date: event.currentTarget.dataset.date,
      ondate: event.currentTarget.dataset.date
    })
    console.log(this.data.ondate)
  },

  /**
     * 全选工作时间
     */
  async allwork() {
    if (this.data.bedid == '') {
      wx.showModal({
        title: '请选择床位',
        content: '您还没有选择床位',
      })
      return
    }
    if (this.data.date == '') {
      wx.showModal({
        title: '请选择日期',
        content: '您还没有相应的日期',
      })
      return
    }
    // console.log(event)
    for (let i = 0; i < app.daywrok.length; i++) {
      let timebegin = app.daywrok[i].timebegin
      let timeend = app.daywrok[i].timeend
      let temp = app.daywrok[i]
      temp.endtime = util.TimetoNumber(this.data.date + ' ' + timeend + ':00:00')
      temp.starttime = util.TimetoNumber(this.data.date + ' ' + timebegin + ':00:00')
      map.set(timebegin, temp)
      // map.set(app.daywrok[i].timebegin, app.daywrok[i])
    }
    await this.setData({
      work: app.daywrok
    }, () => {
      this.addwork()
    })
    // console.log(this.data.work)
  },


  /**
     * 添加技师工作时段
     */
  async addwork() {

    let work = this.data.work
    if (work.length != 0) {
      wx.showLoading({
        title: '提交中',
      })

      let count = await db.collection('worksheet').where({
        "date": this.data.date,
        "bedid": this.data.bedid
      }).count()
      // console.log("work:" + work)
      if (count.total == 0) {
        wx.cloud.callFunction({
          name: 'addData',
          data: {
            type: 'addwork',
            work: work,
            bedid: this.data.bedid,
            date: this.data.date,
            storeid: this.data.storeid,
            technicianid: this.data.tinfo.id
          }
        }).then(res => {
          // let temp1 = res.result.data.reverse()
          console.log(res);
          wx.hideLoading();
          this.restartDate()
        }).catch(err => {
          console.error(err);
          wx.hideLoading();
        });
      } else {
        wx.hideLoading();
        wx.showModal({
          title: '无法提交',
          content: '时段或床位已经被订',
        })
      }


    } else {

    }

    // console.log(this.data.work)
  },

  /**
       * 技师床位选择
       */
  onOpen() {
    this.setData({ show: true });
  },
  /**
       * 技师关闭床位选择
       */

  onClose() {
    this.setData({ show: false });
  },
  /**
       * 技师选择床位
       */
  onSelect(event) {
    console.log(event.detail);
    this.setData({
      bunk: event.detail.name,
      bedid: event.detail.bedid
    })
  },
  /**
  * 获取时间
  */
  getworkday() {
    console.log("////////")
    wx.cloud.callFunction({
      name: 'getDate',
      data: {
        type: '3'
      }
    }).then(res => {
      // console.log("////////" + res)
      let temp = res.result.time
      // console.log("////////"+temp)
      let tempworkday = []
      for (let i = 0; i < 8; i++) {
        let temptime = temp + 1000 * 60 * 60 * 24 * i
        tempworkday[i] = { name: util.formatTime(temptime), val: util.formatTime(temptime) }
      }
      this.setData({
        workday: tempworkday
      })
      // console.log(this.data.workday)
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  },

  /**
  * 获取床位信息
  */
  getbunks() {
    let storeid = this.data.storeid.toString()
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'bunks',
        value: {
          storeid 
        }
      }
    }).then(res => {

      let temp = res.result.data
      console.log(temp)
      this.setData({
        bunks: temp.length
      })
      // console.log(this.data.workday)
      // wx.hideLoading();
    }).catch(err => {
      console.error(err);
      // wx.hideLoading();
    });
  },

  /**
       * 选择按摩时间
       */
  changeDate(event) {
    this.setData({
      date: this.data.workday[event.detail.name].val
    })
  },
  /**
       * 页面跳转
       */
  navbtn(event) {
    console.log(event)
    wx.redirectTo({
      url: `/pages/${event.detail}`
    })
  },
  /**
     * 重置所有内容
     */
  restartDate() {

    this.setData({
      workday: [],
      bedid: '',
      date: '',
      ondate:'',
      work: [],
      tid: '',
      tinfo: {},
      timework: app.daywrok,
      bunks: 4,
      bunk: 1,
      fileList: []
    })
    map.clear()
    this.gettechnicianInfo()
    this.getworkday()
  }



})