//app.js
App({
  onLaunch: function (options) {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'damo-j1p3t',
        traceUser: true,
      })
    }
    let sharecode = options.sharecode || ''
    console.log(sharecode)
    this.globalData = {
      userInfo:{},
      technician:{},
      admin:{},
      sharecode: sharecode,
      deposit:false,
      storeid:'1',
      version:'1.0.4',
      tname:'咨询',
      title:'达摩减压健康咨询',
      desc: '分享页面的内容',
      url:'/pages/subscribe/subscribe',
      logo:'/images/share.png'
    }
    this.storeid = '1'
    this.daywrok = [
      { timebegin: '10:00', timeend: '10:30', sort: 0, on: 0},
      { timebegin: '10:30', timeend: '11:00', sort: 1, on: 0},
      { timebegin: '11:00', timeend: '11:30', sort: 2, on: 0},
      { timebegin: '11:30', timeend: '12:00', sort: 3, on: 0},
      { timebegin: '12:00', timeend: '12:30', sort: 4, on: 0},
      { timebegin: '12:30', timeend: '13:00', sort: 5, on: 0},
      { timebegin: '13:00', timeend: '13:30', sort: 6, on: 0},
      { timebegin: '13:30', timeend: '14:00', sort: 7, on: 0},
      { timebegin: '14:00', timeend: '14:30', sort: 8, on: 0},
      { timebegin: '14:30', timeend: '15:00', sort: 9, on: 0},
      { timebegin: '15:00', timeend: '15:30', sort: 10, on: 0},
      { timebegin: '15:30', timeend: '16:00', sort: 11, on: 0},
      { timebegin: '16:00', timeend: '16:30', sort: 12, on: 0},
      { timebegin: '16:30', timeend: '17:00', sort: 13, on: 0},
      { timebegin: '17:00', timeend: '17:30', sort: 14, on: 0},
      { timebegin: '17:30', timeend: '18:00', sort: 15, on: 0},
      { timebegin: '18:00', timeend: '18:30', sort: 16, on: 0},
      { timebegin: '18:30', timeend: '19:00', sort: 17, on: 0},
      { timebegin: '19:00', timeend: '19:30', sort: 18, on: 0},
      { timebegin: '19:30', timeend: '20:00', sort: 19, on: 0},
      { timebegin: '20:00', timeend: '20:30', sort: 20, on: 0},
      { timebegin: '20:30', timeend: '21:00', sort: 21, on: 0},
      { timebegin: '21:00', timeend: '21:30', sort: 22, on: 0},
      { timebegin: '21:30', timeend: '22:00', sort: 23, on: 0},
      { timebegin: '22:00', timeend: '22:30', sort: 24, on: 0},
      { timebegin: '22:30', timeend: '23:00', sort: 25, on: 0},
      { timebegin: '23:00', timeend: '23:30', sort: 26, on: 0},
      { timebegin: '23:30', timeend: '24:00', sort: 27, on: 0}
    ]
  }
})
