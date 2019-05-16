import * as Table from 'cli-table2'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as semver from 'semver'

import npm from '../services/npm'

export default async function ({config}) {
  const file = path.join(config.cacheDir, 'version')
  const delayInDays = 6

  const needUpdate = async () => {
    try {
      const {mtime} = await fs.stat(file)
      const expireDate = new Date(
        mtime.valueOf() + 1000 * 60 * 60 * 24 * delayInDays
      )
      return expireDate < new Date()
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
      return true
    }
  }

  const compareVersion = async () => {
    const {latest} = await fs.readJson(file)

    if (!latest) await updateVersion()

    const table = new Table({
      head: ['package', 'current', 'latest'],
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: ['cyan'],
        border: ['white']
      },
      colWidths: [15, 25, 25]
    })

    if (semver.gt(latest, config.version)) {
      table.push([config.name, config.version, latest])
      table.push([
        {
          content: `New version available. Please enter 'npm i -g ${
            config.name
          }' to update`,
          colSpan: 3
        }
      ])
      // tslint:disable:no-console
      console.log(table.toString())
    }
  }

  const updateVersion = async () => {
    const pkgInfo = await npm.getInfo(config.name)

    await fs.outputFile(
      file,
      JSON.stringify({
        ...pkgInfo['dist-tags'],
        current: config.version
      })
    )
  }

  if (await needUpdate()) {
    await updateVersion()
  }

  await compareVersion()
}
