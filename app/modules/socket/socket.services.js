const { rabbitmq, ctr } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/ws/socket/get', async ({ data }) => {
  return ctr.socket.getListOfProfile(data)
})
