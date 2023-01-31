const { rabbitmq, ctr, _, redis } = require('@cowellness/cw-micro-service')()
const { wss } = require('../../websocket')
/**
 * @class WsController
 * @classdesc Controller Ws
 */
class WsController {
  /**
   * Decode message from ws
   *
   * If string is not json or not contain service,module,action return false
   *
   * @param {String} msg
   */
  decodeMsg (msg) {
    try {
      const { service, module, action, payload, replyTo, replyId } = JSON.parse(msg)
      if (!service || !module || !action) {
        return false
      }
      return { service, module, action, payload, replyTo, replyId }
    } catch (error) {
      return false
    }
  }

  /**
   * Encode object to string
   *
   * @param {Object} param
   */
  encodeMsg ({ service, module, action, payload, replyTo = '', replyId = '', errors = null }) {
    return JSON.stringify({ service, module, action, payload, replyTo, replyId, errors })
  }

  /**
   *  Manage incoming message
   */
  messageFromSocket ({ socket, _user, msg, _request }) {
    if (msg === 'ping') {
      return socket.send('pong')
    }

    const msgObj = this.decodeMsg(msg)

    if (!msgObj) {
      return socket.send('Error, msg is not valid: ' + msg)
    }

    if (msgObj.replyId) {
      // TODO: manage message with replyId !!
    }

    if (!msgObj.payload) {
      msgObj.payload = {}
    }

    msgObj.payload._user = _user
    msgObj.payload._request = _request

    if (!msgObj.replyTo) {
      return this.sendToService(msgObj)
    }

    return this.sendToServiceAndRead(msgObj).then(msg => {
      msgObj.replyId = msgObj.replyTo
      msgObj.replyTo = ''
      if (!msg.data.success) {
        _.set(msgObj, 'errors.requestPayload', { ...msgObj.payload })
      }
      msgObj.payload = msg.data
      return socket.send(this.encodeMsg(msgObj))
    })
  }

  /**
   * Send Message to Socket
   *
   * @param {String} socketId id of socket
   * @param {Object} msgObj message object
   */
  sendToSocket (socketId, msgObj) {
    const socket = this.getSocketFromId(socketId)
    return new Promise((resolve) => {
      if (!socket) {
        return resolve(false)
      }
      socket.send(this.encodeMsg(msgObj), () => {
        return resolve(true)
      })
    })
  }

  async sendPush ({ _user, toProfileId = false, toProfileIds = [], msgObj }) {
    const destinations = []
    if (toProfileId) {
      destinations.push(toProfileId)
    }
    if (_.isArray(toProfileIds) && toProfileIds.length) {
      destinations.push(...toProfileIds)
    }

    const list = []
    for (const id of destinations) {
      const tmp = await ctr.socket.getListOfProfile({ profileId: id, managerId: '*' })
      if (_.isArray(tmp) && tmp.length) {
        list.push(...tmp)
      }
    }
    return Promise.all(list.map(status => {
      return this.sendToSocket(status.socketId, msgObj)
        .then(delivered => ({ delivered, profileId: status.profileId }))
    }))
  }

  sendToService (msgObj) {
    const queue = `/${msgObj.service}/ws`
    return rabbitmq.send(queue, msgObj)
  }

  sendToServiceAndRead (msgObj) {
    const queue = `/${msgObj.service}/ws`
    return rabbitmq.sendAndRead(queue, msgObj)
  }

  getSocketFromId (id) {
    return Array.from(wss.clients).find(s => s.id === id)
  }

  setPwaLastAccess (profileId) {
    return redis.set(`pwa:${profileId}`, new Date().toISOString())
  }

  getPwaLastAccess ({ _user }) {
    const profileId = _user.profileId

    return redis.get(`pwa:${profileId}`)
  }
}

module.exports = WsController
