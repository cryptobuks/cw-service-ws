const config = require('config')
const { ctr, redis } = require('@cowellness/cw-micro-service')(config)

beforeAll(() => {
  return redis.flushdb()
})

test('save and get status of user', async () => {
  const payload = { profileId: '456', status: true }
  await ctr.status.update(payload)
  let status = await ctr.status.getStatusProfile({ profileId: '456' })
  expect(status.profileId).toBe(payload.profileId)
  expect(status.status).toBe(true)
  payload.status = false
  await ctr.status.update(payload)
  status = await ctr.status.getStatusProfile({ profileId: '456' })
  expect(status.status).toBe(false)
})
