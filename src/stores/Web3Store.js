import Web3 from 'web3'
import { observable, action } from 'mobx'
import { getNetworkID } from '../utils/utils'
import { CrowdsaleConfig } from '../components/Common/config'
import { CHAINS, REACT_PREFIX } from '../utils/constants'
import logdown from 'logdown'

const logger = logdown('TW:stores:Web3')

class Web3Store {
  @observable web3
  @observable curAddress
  @observable accounts

  constructor() {
    this.getWeb3( (web3, status) => {
      if (web3) {
        this.web3 = web3
        if (typeof web3.eth.getAccounts !== 'undefined') {
          try {
            web3.eth.getAccounts().then(accounts => {
              this.accounts = accounts
              if (accounts.length > 0) {
                this.curAddress = accounts[0]
              }
            })
          } catch (err) {
            logger.log('Error trying to get accounts', err)
          }
        }
      }
    })
  }

  @action
  setProperty = (property, value) => {
    this[property] = value
  }

  getInfuraLink = network => {
    const infuraTokenEnvVar = process.env[`${REACT_PREFIX}INFURA_TOKEN`]
    return `https://${network}.infura.io/${infuraTokenEnvVar}`
  }

  getWeb3 = (cb, networkIDparam) => {
    let { ethereum } = window

    if (ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        ethereum.enable().then(() => {
          this.processWeb3(window.web3, cb, networkIDparam)
        })
      } catch (error) {
        // User denied account access...
        logger.log('User denied account', error)
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
      // Acccounts always exposed
      this.processWeb3(window.web3, cb, networkIDparam)
    }
    // Non-dapp browsers...
    else {
      logger.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  processWeb3 = (web3, cb, networkIDparam) => {
    let { networkID = networkIDparam || getNetworkID() } = CrowdsaleConfig
    networkID = Number(networkID)
    if (typeof web3 === 'undefined') {
      // no web3, use fallback
      logger.log('Please use a web3 browser')
      const devEnvironment = process.env.NODE_ENV === 'development'
      if (devEnvironment) {
        web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
      } else {
        let infuraLink
        switch (networkID) {
          case 1:
            infuraLink = this.getInfuraLink(CHAINS.MAINNET)
            break
          case 2:
            infuraLink = this.getInfuraLink(CHAINS.MORDEN)
            break
          case 3:
            infuraLink = this.getInfuraLink(CHAINS.ROPSTEN)
            break
          case 4:
            infuraLink = this.getInfuraLink(CHAINS.RINKEBY)
            break
          case 42:
            infuraLink = this.getInfuraLink(CHAINS.KOVAN)
            break
          default:
            infuraLink = this.getInfuraLink(CHAINS.MAINNET)
            break
        }
        let httpProvider = new Web3.providers.HttpProvider(infuraLink)
        web3 = new Web3(httpProvider)
      }

      cb(web3, false)
      return web3
    } else {
      // window.web3 == web3 most of the time. Don't override the provided,
      // web3, just wrap it in your Web3.
      const myWeb3 = new Web3(web3.currentProvider)

      cb(myWeb3, false)
      return myWeb3
    }
  }
}

export default Web3Store
