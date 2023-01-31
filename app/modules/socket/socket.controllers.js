const { redis, redisScan, ctr } = require('@cowellness/cw-micro-service')()

const socketTimeout = 60 // 1 minute
const prefix = 'socket:'

/**
 * @class WsController
 * @classdesc Controller Ws
 */
class WsController {
  /**
   * Store info of socket connection
   */
  update ({ socketId, profileId, managerId = '', impersonatorId = '' }) {
    const payload = JSON.stringify({ socketId, profileId, managerId, impersonatorId, lastUpdate: Date.now() })
    return redis.set(prefix + socketId + ':' + profileId + ':' + managerId, payload, 'EX', socketTimeout)
  }

  /**
   * On close delete socket, if only one socket of user, update status to offline
   */
  async close ({ socketId }) {
    const list = await redisScan.scan(prefix + socketId + ':*')

    if (!list.length) {
      return true
    }
    const key = list[0]
    const { profileId, managerId } = await this.getDataFromKey(key)
    const userSockets = await this.getListOfProfile({ profileId, managerId })

    if (userSockets.length === 1) {
      ctr.status.update({ profileId, status: false })
    }
    return redis.del(key)
  }

  getDataFromKey (key) {
    return redis.get(key).then(payload => {
      return JSON.parse(payload)
    })
  }

  /**
   * Get Details  from socketId
   *
   * @return {Object}  //{ socketId, profileId, managerId , lastUpdate }
   */
  async getFromSocketId (socketId) {
    const list = await redisScan.scan(prefix + socketId + ':*')
    if (!list) { throw new Error('Socket not found') }
    return this.getDataFromKey(list[0])
  }

  /**
   * Get all socket of profile
   */
  async getListOfProfile ({ profileId, managerId = '' }) {
    const list = await redisScan.scan(prefix + '*:' + profileId + ':' + managerId)
    if (!list) { return [] }
    return Promise.all(list.map(key => this.getDataFromKey(key)))
  }
}

module.exports = WsController
