import * as yargs from 'yargs'

const versionString = require('../package.json').version as string

const argv = yargs
  .usage('Usage: io-serve [options]')

  .alias('v', 'version')
  .version(versionString)
  .describe('version', 'show version information')

  .alias('h', 'help')
  .help('help')
  .describe('help', 'show help')
  .showHelpOnFail(false, 'specify --help for available options')

  .option('bind', {
    alias: 'b',
    desc: 'The network address to bind upon',
    string: true
  })

  .option('port', {
    alias: 'p',
    desc: 'Port to start server on',
    number: true,
    default: 33333
  })

  .parse()

export default argv
