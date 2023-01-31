const config = require('config')
const { ctr, redis } = require('@cowellness/cw-micro-service')(config)

beforeAll(() => {
  return redis.flushdb()
})

test('save and get status of socket', async () => {
  const payload = { socketId: '123', profileId: '456', managerId: '789' }
  await ctr.socket.update(payload)
  const data = await ctr.socket.getFromSocketId(payload.socketId)
  expect(data.socketId).toBe(payload.socketId)
  expect(data.profileId).toBe(payload.profileId)
  expect(data.managerId).toBe(payload.managerId)
})

test('save multiple stocket and get socket of all', async () => {
  const profileId = 'abc'
  const managerId = 'def'
  const payload1 = { socketId: '123', profileId, managerId }
  await ctr.socket.update(payload1)
  const payload2 = { socketId: '999', profileId, managerId }
  await ctr.socket.update(payload2)

  const status = await ctr.socket.getListOfProfile({ profileId, managerId })
  expect(status.length).toBe(2)
  expect(typeof status[0]).toBe('object')
  expect(status[0].profileId).toBe(profileId)
})
