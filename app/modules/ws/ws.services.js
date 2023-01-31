const { rabbitmq, ctr } = require('@cowellness/cw-micro-service')()

// const payload = {
//   _user,
//   toProfileId: message.toProfileId,
//   msgObj: {
//     service: 'chat',
//     module: 'message',
//     actions: 'setMessage',
//     data: {
//       profileId: message.fromProfileId,
//       message
//     }
//   }
// }

rabbitmq.consume('/ws/send', async ({ data }) => {
  return ctr.ws.sendPush(data)
})

/**
 * subscribe to auth: to get update on a relation or profile
 * and push update
 */
rabbitmq.subscribe('auth', async ({ data }) => {
  if (data.model === 'profile') {
    const profile = data.data.profile
    const push = {
      toProfileId: profile._id,
      msgObj: {
        service: 'auth',
        module: 'profile',
        action: 'detail',
        payload:
        { data: profile }

      }
    }
    return ctr.ws.sendPush(push)
  }
}, {})
