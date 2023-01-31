const { rabbitmq, ctr } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/ws/status/get', async ({ data }) => {
  if (data.profileIds) {
    return ctr.status.getMultiStatusProfile(data)
  }
  return ctr.status.getStatusProfile(data)
})
