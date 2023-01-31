const path = require('path')
const basepath = path.join(__dirname, '..', 'app')

module.exports = {
  service: 'ws',
  fastify: { active: false, port: 3010, prefix: '/api/ws' },
  rabbitmq: { active: false, server: 'localhost:15672', user: 'dev', password: 'dev123' },
  redis: { active: true, server: 'localhost', port: 16379 },
  swagger: { active: false, exposeRoute: true },
  elasticSearch: { active: false, server: 'localhost:9200', timeout: 0, version: '7.6' },
  logger: { level: 'debug' },
  basepath,
  options: {
    ws: { port: 3010 }
  },
  mongodb: {
    active: true,
    server: 'localhost',
    port: '37017',
    user: '',
    password: '',
    debug: true,
    databases: [
      {
        name: 'data',
        db: 'ws',
        options: {}
      }
    ]
  }
}
