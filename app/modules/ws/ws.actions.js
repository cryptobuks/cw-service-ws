const { ctr } = require('@cowellness/cw-micro-service')()
// const { wss } = require('../../websocket')
/**
 * @class WsController
 * @classdesc Controller Ws
 */
class WsController {
  getTime () {
    return Date.now()
  }

  async getPwaLastAccess (data, reply) {
    const lastAccess = await ctr.ws.getPwaLastAccess(data)

    reply.cwSendSuccess({
      data: {
        lastAccess
      }
    })
  }
}

module.exports = WsController
