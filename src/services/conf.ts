import * as extend from 'deep-extend'
import * as os from 'os'
import * as path from 'path'

import _ from '../util'

import {spinner} from './logger'

const {resolve} = path

const appConfName = 'rda.config.js'

const rdcConfName = 'rdc.config.js'

const rdsConfName = 'rds.config.js'

let rdType = ''

let rdcConfMap: any = {}

const conf = {
  get cwd() {
    return process.cwd()
  },

  get docsDir() {
    return '_docs'
  },

  get docsPagesDir() {
    return '.docs'
  },

  get appConfPath() {
    return resolve(conf.cwd, appConfName)
  },

  get rdcConfPath() {
    return resolve(conf.cwd, rdcConfName)
  },

  get rdsConfPath() {
    return resolve(conf.cwd, rdsConfName)
  },

  get dockerWorkDirRoot() {
    return '/usr/rde'
  },

  get tmpDir() {
    return path.join(os.tmpdir(), 'rde_rdc_tmp')
  },

  get runtimeDir() {
    return resolve(conf.cwd, `.${conf.cliName}`)
  },

  get localCacheDir() {
    return '.cache'
  },

  get cliName() { return 'rde' },

  get homepage() { return 'https://github.com/kaola-fed/RDE' },

  get appConfName() { return appConfName },

  get rdcConfName() { return rdcConfName },

  get rdsConfName() { return rdsConfName },

  get frameworks() {
    return {
      vue: {
        rdcStarter: 'rdebase/rdc-vue-starter',
        cdn: [],
      },
      react: {
        rdcStarter: 'rdc-react-starter',
        cdn: [
          'https://unpkg.com/react/umd/react.production.min.js',
          'https://unpkg.com/react-dom/umd/react-dom.production.min.js',
        ],
      },
      angular: {
        rdcStarter: 'rdc-angular-starter',
        cdn: ['https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js'],
      },
    }
  },

  get RdTypes() {
    return {
      Application: 'Application',
      Container: 'Container',
      Suite: 'Suite',
    }
  },

  get rdType() {
    return rdType
  },

  set rdType(type) {
    rdType = type
  },

  getAppConf(): AppConf {
    return _.ensureRequire(conf.appConfPath)
  },

  getRdcDir(rdc: string): string {
    // rdcName is the dir contain the rdc codes
    // rdcName docker-hub format: 'scope/abc-c'
    const rdcName = rdc.split(':')[0]

    return `../../${rdcName}`
  },

  getRdcChain(nodeDir, chain = []): string[] {
    chain.push(nodeDir)

    const rdcConfPath = resolve(nodeDir, conf.rdcConfName)
    const {extend} = require(rdcConfPath)

    if (!extend) {
      return chain.reverse()
    }

    return conf.getRdcChain(`${conf.getRdcDir(extend)}`, chain)
  },

  getRdcConf(nodeDir): RdcConf {
    if (rdcConfMap[nodeDir]) {
      return rdcConfMap[nodeDir]
    }

    spinner.start('Composing container chain')
    const chain = conf.getRdcChain(nodeDir)
    rdcConfMap[nodeDir] = conf.getRdcConfFromChain(chain)
    spinner.stop()
    return rdcConfMap[nodeDir]
  },

  getRdcConfFromChain(chain): RdcConf {
    let merged: RdcConf

    for (let node of chain) {
      // node is an array like ['.' '../../scopeA/rdc1', '../../rdcScope/rdc2']
      const nodeConf = require(resolve(conf.cwd, node, conf.rdcConfName))

      merged = extend(
        {},
        nodeConf,
        merged || {},
      )
    }

    return merged
  },
}

export default conf
