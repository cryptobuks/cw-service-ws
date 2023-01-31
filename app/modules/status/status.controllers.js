const { redis, rabbitmq } = require('@cowellness/cw-micro-service')()

const statusTimeout = 60 // 1 minute
const prefix = 'status:'

/**
 * @class WsController
 * @classdesc Controller Ws
 */
class WsController {
  getDataFromKey (key) {
    return redis.get(key).then(payload => {
      return JSON.parse(payload)
    })
  }

  async update ({ profileId, status = true }) {
    const oldStatus = await this.getStatusProfile({ profileId })
    const payload = { profileId, status, lastUpdate: Date.now() }
    if (!oldStatus || oldStatus?.status !== status) {
      rabbitmq.publish({ module: 'status', action: 'update', payload })
    }
    return redis.set(prefix + profileId, JSON.stringify(payload))
  }

  /**
   * Get status of Profile
   * @param {Object} {profileId}
   */
  async getStatusProfile ({ profileId }) {
    return redis.get(prefix + profileId).then(payload => {
      if (!payload) {
        return false
      }
      const data = JSON.parse(payload)
      // if status online but too old I put it offline
      if (data.status && ((Date.now() - data.lastUpdate) > statusTimeout * 1000)) {
        data.status = false
        data.lastUpdate = Date.now()
        this.update(data)
      }
      return data
    })
  }

  async getMultiStatusProfile ({ profileIds }) {
    return Promise.all(profileIds.map(profileId => {
      return this.getStatusProfile({ profileId })
    }))
  }
}

module.exports = WsController
