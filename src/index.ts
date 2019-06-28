#!/usr/bin/env node

import argv from './argv'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as methodOverride from 'method-override'
import * as path from 'path'
import * as fs from 'fs-extra'
import chalk from 'chalk'

const app = express()

app.use(methodOverride())

app.use(bodyParser.raw({
  limit: '100gb',
  type: '*/*'
}))

app.disable('x-powered-by')

const getPath = (req: express.Request) => path.join(process.cwd(), path.normalize(req.path).replace(/^(\.\.[\/\\])+/, ''))
const getFileBlockingDirectory = (filePath: string) => fs.ensureDir(path.dirname(filePath)).then(() => undefined).catch(e => e.path)
const unblockPath = async (filePath: string) => {
  let blockingFile
  while (blockingFile = await getFileBlockingDirectory(filePath)) {
    await fs.remove(blockingFile)
  }

  if (await fs.pathExists(filePath)) {
    const stat = await fs.lstat(filePath)

    if (stat.isDirectory()) {
      await fs.remove(filePath)
    }
  }
}

app.route('*')
  .get(async (req: express.Request, res: express.Response) => {
    const filePath = getPath(req)
    console.log(`${chalk.black.bgGreen('GET')} ${filePath}`)

    if (await fs.pathExists(filePath)) {
      const stat = await fs.lstat(filePath)
      if (stat.isFile()) {
        res.header('X-Resource-Type', 'file').sendFile(filePath, {
          dotfiles: 'allow'
        })
      } else if (stat.isDirectory()) {
        res.header('X-Resource-Type', 'directory').json(await Promise.all(((await fs.readdir(filePath)).map(async p => p + ((await fs.lstat(path.join(filePath, p))).isDirectory() ? '/' : '')))))
      } else {
        res.status(415).end()
      }
    } else {
      res.status(404).end()
    }
  })
  .put(async (req: express.Request, res: express.Response) => {
    const filePath = getPath(req)
    console.log(`${chalk.black.bgMagenta('PUT')} ${filePath}`)

    await unblockPath(filePath)
    await fs.writeFile(filePath, req.body)

    res.end()
  })
  .patch(async (req: express.Request, res: express.Response) => {
    const filePath = getPath(req)
    console.log(`${chalk.black.bgCyan('PATCH')} ${filePath}`)

    await unblockPath(filePath)
    await fs.appendFile(filePath, req.body)

    res.end()
  })
  .delete(async (req: express.Request, res: express.Response) => {
    const filePath = getPath(req)
    console.log(`${chalk.black.bgRed('DELETE')} ${filePath}`)

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath)
      res.status(200).end()
    } else {
      res.status(404).end()
    }
  })

app.listen(argv.port, argv.bind || 'localhost')

console.log(`${chalk.magenta('io-serve')} is now listening on port ${chalk.cyan(argv.port.toString())}`)
