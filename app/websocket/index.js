const config = require('config')
const { rabbitmq, log, ctr } = require('@cowellness/cw-micro-service')(config)
const WebSocket = require('ws')
const cookie = require('cookie')
const app = require('fastify')()
const wsConfig = config.options.ws

const wss = new WebSocket.Server({ noServer: true, keepAlive: true })
function noop () {}

function heartbeat () {
  this.isAlive = true
}

wss.on('connection', function open (socket, request, user) {
  socket.isAlive = true
  socket.on('pong', heartbeat)
  socket.id = request.headers['sec-websocket-key']
  log.info('client connected')

  const profileId = user.profileId || user._id
  const managerId = user.managerId || ''
  const impersonatorId = user.impersonatorId
  const id = user._id
  const type = user.type || 'profile'
  const gymId = user.gymid
  const typeCode = user.typeCode
  const permission = user.permission

  if (request.url.includes('pwa=')) {
    ctr.ws.setPwaLastAccess(profileId)
  }
  ctr.socket.update({ socketId: socket.id, profileId, managerId, impersonatorId })
  ctr.status.update({ profileId, status: true })

  socket.on('message', msg => {
    if (msg !== 'ping') {
      log.debug('New message on socket: ' + msg)
    }

    ctr.socket.update({ socketId: socket.id, profileId, managerId, impersonatorId })
    ctr.status.update({ profileId, status: true })

    ctr.ws.messageFromSocket({ socket, _user: { profileId, managerId, id, type, gymId, typeCode, permission, impersonatorId }, msg, _request: { headers: request.headers } })
  })

  socket.on('close', async function close () {
    await ctr.socket.close({ socketId: socket.id })
  })
})

const interval = setInterval(function ping () {
  wss.clients.forEach(function each (ws) {
    if (ws.isAlive === false) return ws.terminate()

    ws.isAlive = false
    ws.ping(noop)
  })
}, 30000)

wss.on('close', function close () {
  clearInterval(interval)
})

wss.on('error', error => {
  log.error(error)
})

app.server.on('upgrade', async function upgrade (request, socket, head) {
  let token = null
  let error = false

  try {
    token = cookie.parse(request.headers.cookie).cwtoken
  } catch (e) {
    log.error(e)
    error = 'LOGOUT - No token (cookie parse)'
  }

  if (!token) {
    error = 'LOGOUT - No token (no token)'
  }
  try {
    const m = await rabbitmq.sendAndRead('/auth/verify/token', { token })
    if (!m.data) {
      log.error('Data from /auth/verify/token')
      log.error(m)
      error = 'LOGOUT - No auth (auth fail)'
    }
    wss.handleUpgrade(request, socket, head, function done (ws) {
      if (error) {
        ws.send(error)
        return ws.close()
      }
      wss.emit('connection', ws, request, m.data)
    })
  } catch (error) {
    log.error(error)
    socket.write('HTTP/1.1 400 Error\r\n\r\n')
    return socket.destroy()
  }
})

module.exports = {
  wss: undefined,
  start () {
    return new Promise((resolve) => {
      app.listen(wsConfig.port, '0.0.0.0', (err) => {
        if (err) {
          log.alert('WS crashed')
          log.error(err)
          setTimeout(() => {
            process.exit(1)
          }, 1000)
        }
        this.wss = wss
        log.info('WS started')
        resolve(wss)
      })
    })
  }
}
