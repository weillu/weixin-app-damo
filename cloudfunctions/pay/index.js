const cloud = require('wx-server-sdk')
const {
  WXPay,
  WXPayConstants,
  WXPayUtil
} = require('wx-js-utils')
const ip = require('ip')
const {
  MCHID,
  KEY,
  CERT_FILE_CONTENT,
  TIMEOUT,
  APPID
} = require('./config/example.js')


cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
  // env: 'damo-test-xk8dw'
})

// 云函数入口
exports.main = async function (event) {
  const {
    OPENID
  } = cloud.getWXContext()
  console.log('===OPENID=====' + OPENID + '========')
  const pay = new WXPay({
    appId: APPID,
    mchId: MCHID,
    key: KEY,
    certFileContent: CERT_FILE_CONTENT,
    timeout: TIMEOUT,
    signType: WXPayConstants.SIGN_TYPE_MD5,
    useSandbox: false // 不使用沙箱环境
  })
  console.log('=====event=====' + event)
  const {type, data} = event

  const db = cloud.database()
  const orderCollection = db.collection('orders')
  const cashCollection = db.collection('cash')
  const workCollection = db.collection('worksheet')
  const couponCollection = db.collection('coupon')
  const temppayCollection = db.collection('temppay')
  const userCollection = db.collection('users')
  const temp = []
  console.log('=====订单操作选择之前=====')
  // 订单文档的status 0 未支付 1 已支付 2 已关闭 3 正在退款 4 已退款 5 已评价 6 已结束未评论
  switch (type) {
    // 统一下单（分别在微信支付侧和云开发数据库生成订单）
    case 'unifiedorder':{
      console.log('=====进入创建订单=====')
      const { total_fee, date, technicianid, storeid, work, starttime} = data
      console.log('=====date=====' + date)
      console.log('=====technicianid=====' + technicianid)
      const allstatus = 2
      const return_code = 'SUCCESS'
      let atime = new Date().getTime()
      let out_trade_no = `pay${atime}`
      try {
        console.log('=====创建订单=====')
        const order = await orderCollection.add({
          data: {
            _openid: OPENID,
            addtime: atime,
            edittime: atime,
            date,
            starttime,
            status: 0,
            storeid,
            total_fee,
            technicianid,
            work,
            out_trade_no,
            trade_state: 'PAYMENT',
            trade_state_desc: '生成订单'
          }
        })
        order_id = order._id
        for (let index in work) {
          let btime = new Date().getTime()
          try {
            temp[temp.length] = await workCollection.doc(work[index].id).update({
              data: {
                "edittime": btime,
                "state": allstatus
              }
            })
          } catch (e) {
            console.error(e)
          }
        }
        const temppay = await temppayCollection.add({
          data: {
            time: atime,
            out_trade_no: out_trade_no
          }
        })


      } catch (e) {
        console.error(e)
        return_code = ''
      }
      console.log('=====创建订单成功=====')
      return {
        code: return_code === 'SUCCESS' ? 0 : 1,
        data: {
          out_trade_no
        }
      }
      

    }
    case 'updateorder': {
      const { total_fee, actual_payment, coupon, coupons_fee, work, out_trade_no, phoneNumber, damo_fee,nickName,name} = data
      if (coupon==undefined){
        coupon = {}
      }
      const allstatus = 2
      const users = await userCollection
        .where({ _openid: OPENID })
        .get()
      const user = users.data[0]
      if (actual_payment == 0) {
        const return_code = 'SUCCESS'
        let atime = new Date().getTime()
        console.log('=====进入0费用订单=====')
        try {
          
          let damo_cash = parseInt(user.damo_cash) - (parseInt(total_fee) - parseInt(coupons_fee))
          if (damo_cash<0){
            return {
              code: return_code === 1,
              data: {
                order_id, out_trade_no,
                message: '用户费用不足,没办法抵扣'
              }
            }
          }
          console.log('=====抵扣用户达摩现金=====')
          console.log('=====coupon=====' + coupon)
          console.log('=====折扣金额coupons_fee=====' + coupons_fee)
          console.log('=====OPENID=====' + OPENID)
          console.log('=====damo_cash=====' + damo_cash)
          let  damodiko = await userCollection
            .where({ _openid: OPENID })
            .update({
              data: {
                damo_cash
              }
            })
            
          console.log('=====抵扣后完成订单=====')    
          const order = await orderCollection
          .where({ out_trade_no })
          .update({
            data: {
              coupon,
              coupons_fee,
              phoneNumber,
              damo_fee,
              nickName,
              name,
              actual_payment:0,
              status:1,//完成交易
              trade_state: 'NO_PAY',
              trade_state_desc: '订单已完成,无现金支付'
            }
          })
          order_id = order._id
          
          
          console.log('=====微信支付成功后删除临时表数据=====')
          let temppay = await temppayCollection
            .where({ out_trade_no })
            .remove()
          
          for (let index in work) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await workCollection.doc(work[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          for (let index in coupon) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }

          console.log('=====订单更新及相关处理完成=====')


        } catch (e) {
          console.error(e)
          return_code = ''
        }

        return {
          code: return_code === 'SUCCESS' ? 0 : 1,
          data: {
            order_id, temp
          }
        }

      } else {

        console.log('=====进入费用订单=====')
        if (user.damo_cash  < damo_fee) {
          return {
            code: return_code === 1,
            data: {
              order_id, out_trade_no,
              message: '用户费用不足,没办法抵扣'
            }
          }
        }
        // 拼凑订单参数
        const curTime = Date.now()
        const body = '预订订单'
        const spbill_create_ip = ip.address() || '127.0.0.1'
        const notify_url = 'http://www.qq.com' // '云函数暂时没有外网地址和HTTP触发起，暂时随便填个地址。'

        const time_stamp = '' + Math.ceil(Date.now() / 1000)
        
        const sign_type = WXPayConstants.SIGN_TYPE_MD5


        console.log('=====curTime=====' + curTime)
        console.log('=====body=====' + body)
        console.log('=====spbill_create_ip=====' + spbill_create_ip)
        console.log('=====actual_payment=====' + actual_payment)
        console.log('=====total_fee=====' + total_fee)
        console.log('=====time_stamp=====' + time_stamp)
        console.log('=====out_trade_no=====' + out_trade_no)

        const orderParam = {
          body,
          spbill_create_ip,
          notify_url,
          out_trade_no,
          total_fee: actual_payment,
          openid: OPENID,
          trade_type: 'JSAPI',
          timeStamp: time_stamp,
        }
        console.log('=====在微信支付服务端生成该订单orderParam=' + orderParam)

        console.log('=====在微信支付服务端生成该订单=====')
        // 在微信支付服务端生成该订单
        const {
          return_code,
          ...restData
        } = await pay.unifiedOrder(orderParam)

        console.log('=====restData.nonce_str=====' + restData.nonce_str)
        console.log('=====restData.prepay_id=====' + restData.prepay_id)

        let order_id = null

        console.log('=====return_code=====' + return_code)

        if (return_code === 'SUCCESS' && restData.result_code === 'SUCCESS') {
          const {
            prepay_id,
            nonce_str
          } = restData
          console.log('=====生成微信支付签名，为后在小程序端进行支付打下基础=====')
          // 生成微信支付签名，为后在小程序端进行支付打下基础
          const sign = WXPayUtil.generateSignature({
            appId: APPID,
            nonceStr: nonce_str,
            package: `prepay_id=${prepay_id}`,
            signType: 'MD5',
            timeStamp: time_stamp
          }, KEY)


          const orderData = {
            out_trade_no,
            time_stamp,
            nonce_str,
            sign,
            sign_type,
            body,
            total_fee,
            actual_payment,
            nickName,
            name,
            prepay_id,
            coupons_fee,
            phoneNumber,
            damo_fee,
            sign,
            _openid: OPENID,
            edittime: curTime,
            coupon: coupon,
            trade_state:"WAITPAY",
            trade_state_desc:"等待付款"
          }


          console.log('=====更新订单=====')
          const order = await orderCollection
            .where({ out_trade_no })
            .update({
            data: orderData
            })

          order_id = order._id
          const temppay = await temppayCollection.add({
            data: {
              time: curTime,
              out_trade_no: out_trade_no
            }
          })

          for (let index in work) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await workCollection.doc(work[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          for (let index in coupon) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }

          console.log('=====订单更新及相关处理完成=====')
        }
        return {
          code: return_code === 'SUCCESS' ? 0 : 1,
          data: {
            out_trade_no, time_stamp, order_id, ...restData
          }
        }
      }


    }
    // 订单查询并且支付前准备
    case 'orderquery': {
      
      const {transaction_id, out_trade_no} = data
      // 查询订单

      const {data: dbData} = await orderCollection
        .where({out_trade_no})
        .get()

      const {return_code, ...restData} = await pay.orderQuery({
        transaction_id,
        out_trade_no
      })

      return {
        code: return_code === 'SUCCESS' ? 0 : 1,
        data: {...restData, ...dbData[0]}
      }
    }

    // 进行微信支付及更新订单状态
    case 'payorder': {
      console.log('=====进行微信支付及更新订单状态=====')
      const {
        out_trade_no,
        prepay_id,
        body,
        total_fee,
        actual_payment,
        damo_fee
      } = data

      console.log('=====data=====' + data)
      const {return_code, ...restData} = await pay.orderQuery({
        out_trade_no
      })

      if (restData.trade_state === 'SUCCESS') {
        console.log('=====进行微信支付进行中=====')
        const result = await orderCollection
          .where({out_trade_no})
          .update({
            data: {
              status: 1,
              trade_state: restData.trade_state,
              trade_state_desc: restData.trade_state_desc
            }
          })


        console.log('======restData======');

        if (damo_fee!=0){
          
          try {
            const users = await userCollection
              .where({ _openid: OPENID })
              .get()
            const user = users.data[0]
            let damo_cash = parseInt(user.damo_cash) - parseInt(damo_fee)
            if (damo_cash < 0) {
              return {
                code: return_code === 1,
                data: {
                  order_id, out_trade_no,
                  message: '用户费用不足,没办法抵扣'
                }
              }
            }
            console.log('=====damo_cash=====' + damo_cash)
            let damodiko = await userCollection
              .where({ _openid: OPENID })
              .update({
                data: {
                  damo_cash
                }
              })
          } catch (e) {
            console.log('===========')
            console.log(e)
          }
        }
        

        // console.log(restData);

        console.log('=====微信支付成功后删除临时表数据=====')
        let temppay = await temppayCollection
          .where({ out_trade_no })
          .remove()

        const curTime = restData.time_end
        const time = `${curTime.slice(0, 4)}-${curTime.slice(4, 6)}-${curTime.slice(6, 8)} ${curTime.slice(8, 10)}:${curTime.slice(10, 12)}:${curTime.slice(12, 14)}`
        try {
          const messageResult = await cloud.callFunction({
            name: 'pay-message',
            data: {
              formId: prepay_id,
              openId: OPENID,
              appId: APPID,
              page: `pages/pay-result/index?id=${out_trade_no}`,
              data: {
                keyword1: {
                  value: out_trade_no // 订单号
                },
                keyword2: {
                  value: body // 物品名称
                },
                keyword3: {
                  value: time// 支付时间
                },
                keyword4: {
                  value: (actual_payment / 100) + '元' // 支付金额
                }
              }
            }
          })
          console.log('=======message=========')
          console.log(messageResult)
        } catch (e) {
          console.log('===========')
          console.log(e)
        }
      }

      return {
        code: return_code === 'SUCCESS' ? 0 : 1,
        data: restData
      }
    }

    // 关闭订单
    case 'closeorder': {
      const {out_trade_no} = data
      const orders = await orderCollection.where({ out_trade_no }).get()

      if (!orders.data.length) {
        return {
          code: 1,
          message: '找不到订单'
        }
      }
      const order = orders.data[0]

      const allstatus = 1
      const temp = []

      if (order.actual_payment == 0) { //判断是否需要退现金
        let work = order.work
        let coupon = order.coupon
        try {
          await orderCollection.where({ out_trade_no }).update({
            data: {
              trade_state: 'CLOSED',
              trade_state_desc: '订单已关闭',
              status: 2
            }
          })

          for (let index in work) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await workCollection.doc(work[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          for (let index in coupon) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }


        } catch (e) {
          return {
            code: 1,
            mesasge: e.message
          }
        }


      }else{

        const {return_code, ...restData} = await pay.closeOrder({
          out_trade_no
        })
        if (return_code === 'SUCCESS' &&
          restData.result_code === 'SUCCESS') {
          await orderCollection
            .where({out_trade_no})
            .update({
              data: {
                status: 2,
                trade_state: 'CLOSED',
                trade_state_desc: '订单已关闭'
              }
            })

          let work = order.work
          let coupon = order.coupon

          for (let index in work) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await workCollection.doc(work[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          for (let index in coupon) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }

        }

        return {
          code: return_code === 'SUCCESS' ? 0 : 1,
          data: restData
        }
      }
    }

    // 申请退款
    case 'refund': {
      const {out_trade_no} = data
      const orders = await orderCollection.where({out_trade_no}).get()

      console.log(orders)

      if (!orders.data.length) {
        return {
          code: 1,
          message: '找不到订单'
        }
      }
      const order = orders.data[0]

      const users = await userCollection
        .where({ _openid: OPENID })
        .get()
      const user = users.data[0]

      const allstatus = 1
      const temp = []

      if (order.actual_payment==0){ //判断是否需要退现金
        
        let work = order.work
        let coupon = order.coupon
        try {
          await orderCollection.where({ out_trade_no }).update({
            data: {
              trade_state: 'REFUNDED',
              trade_state_desc: '无退款,优惠卷已退回',
              status: 4
            }
          })

          for (let index in work) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await workCollection.doc(work[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          for (let index in coupon) {
            let btime = new Date().getTime()
            try {
              temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                data: {
                  "edittime": btime,
                  "state": allstatus
                }
              })
            } catch (e) {
              console.error(e)
            }
          }
          try {
            let damo_cash = order.damo_fee + user.damo_cash
            await userCollection.where({ _openid: OPENID }).update({
              data: {
                damo_cash
              }
            })
            console.log('退款成功后退damo_cash')
          } catch (e) {
            console.error(e)
          }
          

        } catch (e) {
          return {
            code: 1,
            mesasge: e.message
          }
        }


      }else{

        const {
          total_fee,
          actual_payment,
          damo_fee
        } = order

        const result = await pay.refund({
          out_trade_no,
          total_fee: actual_payment,
          out_refund_no: out_trade_no,
          refund_fee: actual_payment
        })

        const {return_code} = result

        if (return_code === 'SUCCESS') {
          try {
            await orderCollection.where({out_trade_no}).update({
              data: {
                trade_state: 'REFUNDING',
                trade_state_desc: '正在退款',
                status: 3
              }
            })
            let work = order.work
            let coupon = order.coupon
            for (let index in work) {
              let btime = new Date().getTime()
              try {
                temp[temp.length] = await workCollection.doc(work[index].id).update({
                  data: {
                    "edittime": btime,
                    "state": allstatus
                  }
                })
              } catch (e) {
                console.error(e)
              }
            }
            for (let index in coupon) {
              let btime = new Date().getTime()
              try {
                temp[temp.length] = await couponCollection.doc(coupon[index].id).update({
                  data: {
                    "edittime": btime,
                    "status": allstatus
                  }
                })
              } catch (e) {
                console.error(e)
              }
            }
            if (damo_fee>0){
              try {
                let damo_cash = damo_fee + user.damo_cash
                await userCollection.where({ _openid: OPENID }).update({
                  data: {
                    damo_cash
                  }
                })
                console.log('退款成功后退damo_cash')
              } catch (e) {
                console.error(e)
              }

            }

          } catch (e) {
            return {
              code: 1,
              mesasge: e.message
            }
          }
        } else {
          return {
            code: 1,
            mesasge: '退款失败，请重试'
          }
        }
      }
      return {
        code: 0,
        data: {list:temp}
      }
    }

    // 查询退款情况
    case 'queryrefund': {
      const {out_trade_no} = data

      const result = await pay.refundQuery({
        out_trade_no
      })

      console.log('===queryrefund================')
      console.log(result)
      const {refund_status_0, return_code} = result

      if (return_code === 'SUCCESS' && refund_status_0 === 'SUCCESS') {
        try {
          await orderCollection.where({out_trade_no}).update({
            data: {
              trade_state: 'REFUNDED',
              trade_state_desc: '已退款',
              status: 4
            }
          })

          return {
            code: 0,
            data: {
              trade_state: 'REFUNDED',
              trade_state_desc: '已退款',
              status: 4
            }
          }
        } catch (e) {
          return {
            code: 0
          }
        }
      } else {
        return {
          code: 0
        }
      }

      return {
        code: 0
      }
    }

    // 申请充值退款
    case 'recash': {
      const { out_trade_no } = data
      const orders = await cashCollection.where({ out_trade_no }).get()

      console.log(orders)

      if (!orders.data.length) {
        return {
          code: 1,
          message: '找不到订单'
        }
      }
      const order = orders.data[0]

      const users = await userCollection
        .where({ _openid: order._openid })
        .get()
      const user = users.data[0]

      const allstatus = 1
      const temp = []
      const {
        damo_cash
      } = user
      const {
          total_fee,
          addDamo_fee
      } = order

      if (addDamo_fee > damo_cash) {
        return {
          code: 1,
          mesasge: '退款失败，余额不足退款'
        }
      }

      const result = await pay.refund({
          out_trade_no,
          total_fee,
          out_refund_no: out_trade_no,
          refund_fee: total_fee
      })

      const { return_code } = result

      if (return_code === 'SUCCESS') {
          try {
            await cashCollection.where({ out_trade_no }).update({
              data: {
                trade_state: 'REFUNDING',
                trade_state_desc: '正在退款',
                status: 3
              }
            })
            console.log('正在退款')
          } catch (e) {
            return {
              code: 1,
              mesasge: e.message
            }
          }

        try {
          let tdamo_cash = damo_cash - addDamo_fee
          await userCollection.where({ _openid: order._openid }).update({
            data: {
              damo_cash: tdamo_cash
            }
          })
          console.log('退款成功后退damo_cash')
        } catch (e) {
          console.error(e)
        }

      } else {
          return {
            code: 1,
            mesasge: '退款失败，请重试'
          }
      }

      return {
        code: 0,
        data: { list: temp }
      }
    }

    // 增加评论
    case 'comment': {
      console.log('===comment================')
      console.log('===data================' + data)
      const { out_trade_no, content, score, technicianid, fileIds, userinfo} = data
      console.log('===userinfo================' + userinfo)
      let nickName = userinfo.nickName
      console.log('===nickName================' + userinfo.nickName)
      let avatarUrl = userinfo.avatarUrl
      let addtime = new Date().getTime()
      const comment = db.collection('comment').add({
        data: {
          content,
          score,
          technicianid,
          fileIds,
          out_trade_no,
          nickName,
          avatarUrl,
          addtime
        }
      })

      const orders = await orderCollection.where({ out_trade_no }).get()

      let order = orders.data[0]
      let tempscore = order.score
      let conmments = order.conmments || 0
      let edittime = new Date().getTime()
      conmments = conmments + 1
      let tempdata = { conmments }
      if (tempscore == undefined) {
        tempdata = {
          conmments,
          score,
          edittime,
          status:5
        }
      }
      try {
        await orderCollection.where({ out_trade_no }).update({
          data: tempdata
        })

        return {
          code: 0
        }
      } catch (e) {
        return {
          code: 1
        }
      }

      return {
        code: 0
      }
      
    }
  }
}
