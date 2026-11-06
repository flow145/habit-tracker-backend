import { app } from '#/app.ts'
import { env } from '#/config/env.ts'
import { logger } from '#/config/logger.ts'
import { connectDb, db } from '#/db/connection.ts'

let isShuttingDown = false

const main = async () => {
  await connectDb()

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, stage: env.APP_STAGE }, 'Server started')
  })

  const shutdown = (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true
    logger.info({ signal }, 'Shutdown initiated')

    server.close(async (error) => {
      if (error) {
        logger.error({ error }, 'Error on server close')
        process.exit(1)
      }

      try {
        await db.end()
        logger.info('Server shut down gracefully')
        process.exit(0)
      } catch (shutdownError) {
        logger.error({ error: shutdownError }, 'Error on graceful shutdown')
        process.exit(1)
      }
    })
  }

  ;['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => shutdown(signal))
  })
}

main().catch((error) => {
  logger.fatal(error, 'Application startup failed')
  process.exit(1)
})
