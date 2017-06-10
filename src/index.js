#!/usr/bin/env node

const chalk   = require('chalk')
const fs      = require('fs')
const program = require('commander')
const axios   = require('axios')

const DEMARCATOR   = ','
const DEFAULT_PATH = '/wp-json/wp/v2/'

const multi = (val, memo) => {
  memo.push(val)
  return memo
}

const getData = (types, urlOpts) => {
  const { base, path, params } = urlOpts
  return new Promise((resolve, reject) => {
    let allData = {}
    let complete = 0

    types.map(type => {
      const endpoint = `${base}${path}${type}?${params}`
      getDataByPage(endpoint)
        .then(data => {
          allData[type] = data
          complete = complete + 1
          if(complete === types.length) resolve(allData)
        })
        .catch(err => reject(err))
    })

  })
}

const getDataByPage = (endpoint) => {
  return new Promise((resolve, reject) => {
    let data = []
    const recurse = (endpoint, page = 0, prevData = []) => {
      let url = endpoint + (page ? `&page=${page}` : '')
      console.log(`Scraping ${chalk.magenta(url)}`)
      axios.get(url)
        .then(res => {
          data = [...prevData, ...res.data]
          recurse(endpoint, page + 1, data)
        })
        .catch(err => {
          if(err.response && err.response.data){
            if(err.response.data.code === 'rest_post_invalid_page_number'){
              resolve(data)
            }
            reject(err.response.data)
          }
          reject(err)
        })
    }

    recurse(endpoint)
  })
}

const outputData = (file, data, force) => {
  return new Promise((resolve, reject) => {
    const shouldMerge = !force && fs.existsSync(file)

    if(shouldMerge){
      const pwd = process.env.PWD
      const contents   = require(pwd + '/' + file)
      const newData    = Object.assign(contents, data)
      const newFile    = JSON.stringify(newData)

      fs.writeFile(`${file}`, newFile, err => {
        if(err) reject(err)
        else resolve(true)
      })
    } else {
      const newFile = JSON.stringify(data)
      fs.writeFile(`${file}`, newFile, err => {
        if(err) reject(err)
        else resolve(false)
      })
    }
  })
}

program
.version('1.0.0')
.arguments('<base>')
.option('-n', 'Use a non-WP REST API base')
.option('-f', 'Force complete rebuild')
.option('-t, --types [types]', 'Types to be scraped.', multi, [])
.option('-p, --params [params]', 'URL params.', multi, [])
.option('-o, --output <output>', 'Output location')
.action((base) => {
    let { types, params, output, N, F } = program

    if(!output){
      console.log(chalk.red('Please specify output location with -o'))
      return
    }

    if(params) params = params.join('&')

    let path = !N ? DEFAULT_PATH : '/'

    const t = Date.now()
    getData(types, { base, path, params })
    .then(data => {
      const _t = Date.now()
      console.log(chalk.green(`Scape complete after ${_t - t}ms`))
      outputData(output, data, !!F)
      .then(wasMerged => {
        const __t = Date.now()
        const verb = wasMerged ? 'merged with' : 'output to'
        console.log(chalk.green(`Data ${verb} ${output} after ${__t - _t}ms`))
      })
      .catch(err => {
        console.log(chalk.red(err))
      })
    })
    .catch(err => {
      console.log(chalk.red(err))
    })

  })
  .parse(process.argv)
