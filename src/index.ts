#!/usr/bin/env node

import argv from './argv'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as path from 'path'
import * as fs from 'fs-extra'
import chalk from 'chalk'

const app = express()

app.use(bodyParser.raw({
  limit: '100gb',
  type: '*/*'
}))

app.disable('x-powered-by')

const getPath = (req: express.Request) => path.join(process.cwd(), path.normalize(req.path).replace(/^(\.\.[\/\\])+/, ''))
const getOffendingFile = (filePath: string) => fs.ensureDir(path.dirname(filePath)).then(() => undefined).catch(e => e.path)

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
  .post(async (req: express.Request, res: express.Response) => {
    const filePath = getPath(req)
    console.log(`${chalk.black.bgMagenta('POST')} ${filePath}`)

    let badFile
    while (badFile = await getOffendingFile(filePath)) {
      await fs.remove(badFile)
    }

    await fs.ensureDir(path.dirname(filePath))

    if (await fs.pathExists(filePath)) {
      const stat = await fs.lstat(filePath)

      if (stat.isDirectory()) {
        await fs.remove(filePath)
      }
    }

    await fs.writeFile(filePath, req.body)

    res.end()
  })

app.listen(argv.port, argv.bind || 'localhost')

console.log(`${chalk.magenta('io-serve')} is now listening on port ${chalk.cyan(argv.port.toString())}`)
