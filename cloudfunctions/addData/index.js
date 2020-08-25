// 云函数入口文件
const cloud = require('wx-server-sdk')
const formatTime = (timestamp, num) => {
  var date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  let temp = [year, month, day].map(formatNumber).join('-')
  if (num == "2") {
    temp = temp + + ' ' + [hour, minute, second].map(formatNumber).join(':')
  }
  return temp
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  const {
    OPENID
  } = cloud.getWXContext()

  console.log(event)

  switch (event.type) {

    case 'addwork': {
       
      const temp = []
      for (let i = 0; i < event.work.length; i++) {
        let atime = new Date().getTime()

        try {
          temp[i] = await db.collection('worksheet').add({
            data: {
              _openid: OPENID,
              addtime: atime,
              bedid: event.bedid,
              charge: event.charge,
              date: event.date,
              edittime: atime,
              storeid: event.storeid,
              sort: event.work[i].sort,
              state: 1,
              endtime: event.work[i].endtime,
              starttime: event.work[i].starttime,
              technicianid: event.technicianid,
              timebegin: event.work[i].timebegin,
              timeend: event.work[i].timeend
            }
          })
        } catch (e) {
          console.error(e)
          return {
            code: 1,
            message: '添加失败',
            data:e
          }
        }
      }
      // console.log(temp)

      return {
        code: 0,
        message: '添加成功'
      }
    
    }

    case 'addRest': {

      const temp = []
      for (let i = 0; i < event.work.length; i++) {
        let atime = new Date().getTime()
        let id = event.work[i].id
        try {
          temp[i] = await db.collection('worksheet')
          .where({'_id':id})
          .update({
            data: {
              state: 6,
              edittime: atime
            }
          })
        } catch (e) {
          console.error(e)
          return {
            code: 1,
            message: '添加失败',
            data: e
          }
        }
      }
      // console.log(temp)

      return {
        code: 0,
        message: '添加成功',
        data:temp
      }

    }

    case 'addCoupon': {

      let t = new Date().getTime()
      t = Date.now()
      console.log(t)
      let endtime = t + 10 * 24 * 60 * 60*1000 //10天有效期
      console.log(endtime)
      let sdate = formatTime(t, 1)
      console.log(sdate)
      let edate = formatTime(endtime, 1)
      console.log(edate)
      let discount = 0.5
      let name = "五折"
      let content = '只针对一个时间单位（30分钟）的服务进行折扣'
      const res = await db.collection('coupon').add({
        data: {
          type: 0,
          endtime,
          state: 1,
          _openid: event._openid,
          name,
          edate,
          sdate,
          content,
          discount
        }
      })

      return {
        code: 0,
        message: '添加成功'
      }
    }

    case 'addversion': {

      let addtime = new Date().getTime()
      edittime = Date.now()
      let data = {
        title: event.data.title,
        tname: event.data.tname,
        shareimg: event.data.shareimg,
        deposit: event.data.deposit,
        version: event.data.version,
        addtime
      }
      const res = await db.collection('version').add({
        data: data
      })

      return {
        code: 0,
        message: '添加成功'
      }
    }


    case 'addCash': {
      let t = new Date().getTime()
      t = Date.now()
      const order = event.order
      const addDamo_fee = parseInt(parseInt(order.total_fee)*1.1)
      order.addDamo_fee = addDamo_fee
      order._openid = OPENID
      order.date = formatTime(t, 1)
      order.status = 1
      const res = await db.collection('cash').add({
        data: order
      })

      
      const users = await db.collection('users').where({_openid: OPENID}).get()
      const user = users.data[0]
      const damo_cash = user.damo_cash + addDamo_fee
      const result = await db.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          damo_cash
        }
      })

      if (res.errMsg == "collection.add:ok" && result.errMsg == "collection.update:ok") {

        return {
          code: 0,
          message: '记录成功'
        }
      }else{
        if (res.errMsg == "collection.add:ok") {
          return {
            code: 1,
            message: '记录成功,用户信息修改失败'
          }
        }else{
          return {
            code: 1,
            message: '用户信息修改成功,添加记录失败'
          }
        }

      }
    }


    case 'addtechnician': {
      let result = await db.collection('technician').where({ 'openid': event.data.openid}).get()
      console.log(result)
      let id = result.data.length
      if (id!=0){
        return {
          code: 1,
          message: '用户已存在'
        }
      }else{
        result = await db.collection('technician').count()
        id = result.total
        let addtime = new Date().getTime()
        let data = {
          id,
          _openid: OPENID,
          openid: event.data.openid,
          name: event.data.name,
          phone: event.data.phone,
          ratio: event.data.ratio,
          average: event.data.average,
          score: event.data.score,
          working: event.data.working,
          speciality: event.data.speciality,
          bankname: event.data.bankname,
          bankcard: event.data.bankcard,
          address: event.data.address,
          images: event.data.images,
          gender: event.data.gender,
          damo_cash: event.data.damo_cash, 
          bed: '',
          bedid: '',
          storeid: -1,
          addtime
        }
        const res = await db.collection('technician').add({
          data: data
        })

        return {
          code: 0,
          message: '添加成功'
        }
      }
      
    }

    case 'addstore': {
      let result = await db.collection('store').where({ 'address': event.data.address }).get()
      console.log(result)
      if (result.data == []) {
        return {
          code: 1,
          message: '门店已存在'
        }
      } else {
        result = await db.collection('store').count()
        console.log(result)
        let id = result.total + 1
        console.log('id=' + id)
        let addtime = new Date().getTime()
        let data = {
          id,
          _openid: OPENID,
          name: event.data.name,
          phone: event.data.phone,
          address: event.data.address,
          position: event.data.position,
          grade: event.data.grade,
          bunks: event.data.bunks,
          owner: event.data.owner,
          province: event.data.province,
          city: event.data.city,
          district: event.data.district,
          county: event.data.county,
          images: event.data.images,
          state:1,
          addtime
        }
        let res = await db.collection('store').add({
          data: data
        })
        console.log('res=' + res)
        return {
          code: 0,
          message: '添加成功'
        }
      }

    }


    case 'editversion': {
      console.log(event)
      let edittime = new Date().getTime()
      let _id = event.data._id
      console.log('_id=' + _id)
      edittime = Date.now()
      let data = {
        _openid: OPENID,
        title: event.data.title,
        tname: event.data.tname,
        shareimg: event.data.shareimg,
        deposit: event.data.deposit,
        version: event.data.version,
        edittime
      }
      console.log(data)
      const res = await db.collection('version').doc(_id).update({
        data: data
      })
      console.log('res=' + res)
      return {
        code: 0,
        message: '修改成功'
      }
    }

    case 'edittechnician': {
      console.log(event)
      let edittime = new Date().getTime()
      let _id = event.data.sid
      console.log('_id=' + _id)
      console.log('images=' + event.data.images)
      edittime = Date.now()
      let data = {
        _openid: OPENID,
        name: event.data.name,
        phone: event.data.phone,
        ratio: event.data.ratio,
        average: event.data.average,
        score: event.data.score,
        working: event.data.working,
        speciality: event.data.speciality,
        bankname: event.data.bankname,
        bankcard: event.data.bankcard,
        address: event.data.address,
        images: event.data.images,
        gender: event.data.gender,
        damo_cash: event.data.damo_cash,
        edittime
      }
      console.log(data)
      const res = await db.collection('technician').doc(_id).update({
        data: data
      })
      console.log('res=' + res)
      return {
        code: 0,
        message: '修改成功'
      }
    }



    case 'storetechnician': {
      console.log(event)
      let edittime = new Date().getTime()
      let _id = event.data.sid
      console.log('_id=' + _id)
      edittime = Date.now()
      let data = {
        _openid: OPENID,
        bed: event.data.bed,
        bedid: event.data.bedid,
        storeid: event.data.storeid,
        edittime
      }
      console.log(data)
      const res = await db.collection('technician').doc(_id).update({
        data: data
      })
      console.log('res=' + res)
      return {
        code: 0,
        message: '修改成功'
      }
    }

    case 'editstore': {
      console.log(event)
      let edittime = new Date().getTime()
      let _id = event.data.sid
      console.log('_id=' + _id)
      edittime = Date.now()
      let data = {
        _openid: OPENID,
        name: event.data.name,
        phone: event.data.phone,
        address: event.data.address,
        position: event.data.position,
        grade: event.data.grade,
        bunks: event.data.bunks,
        owner: event.data.owner,
        province: event.data.province,
        city: event.data.city,
        district: event.data.district,
        county: event.data.county,
        images: event.data.images,
        edittime
      }
      console.log(data)
      const res = await db.collection('store').doc(_id).update({
        data: data
      })
      console.log('res=' + res)
      return {
        code: 0,
        message: '修改成功'
      }
    }


    case 'delstore': {
      console.log(event)
      let edittime = new Date().getTime()
      let _id = event.data.sid
      edittime = Date.now()
      let data = {
        _openid: OPENID,
        state: 0,
        edittime
      }
      console.log(data)
      const res = await db.collection('store').doc(_id).update({
        data: data
      })
      console.log('res=' + res)
      return {
        code: 0,
        message: '删除成功'
      }

    }


  }
}