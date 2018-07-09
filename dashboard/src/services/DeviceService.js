import aws from 'aws-sdk'
import deviceSdk from 'aws-iot-device-sdk'
import AuthService from './AuthService'
import ConfigurationService from './ConfigurationService'

export default class DeviceService {
  constructor () {
    this.auth = AuthService.getInstance()
    this.config = ConfigurationService.getInstance()

    const credentials = this.auth.getCredentials()
    this.configure(credentials)
  }

  configure (credentials) {
    this.dynamo = new aws.DynamoDB.DocumentClient({
      region: this.config.get('AWS_REGION'),
      credentials
    })

    this.iot = new aws.Iot({
      region: this.config.get('AWS_REGION'),
      credentials
    })

    this.iotData = new aws.IotData({
      endpoint: this.config.get('IOT_ENDPOINT'),
      region: this.config.get('AWS_REGION'),
      credentials
    })
  }

  connect () {
    const credentials = this.auth.getCredentials()
    const req = {
      host: this.config.get('IOT_ENDPOINT'),
      protocol: 'wss',
      clientId: `ui-${new Date().getTime()}`,
      accessKeyId: credentials.accessKeyId,
      secretKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }

    const device = deviceSdk.device(req)

    return device
  }

  getState (thingName) {
    console.log('getState(' + thingName + ') invoked - getting shadow')
    if (this.iotData == null) {
      // console.log('getState(' + thingName + '): connecting to AWS IoT...')
      this.connect()
    }

    return new Promise((resolve, reject) => {
      this.iotData.getThingShadow({
        thingName
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          console.log('getState(): shadow=' + data.payload)
          const jsonPayload = JSON.parse(data.payload)
          resolve(jsonPayload)
        }
      })
    })
  }

  getMyDevice () {
    return new Promise((resolve, reject) => {
      const Identity = this.auth.getUnauthIdentity()
      this.getAvailableDevices()
        .then(data => {
          const matches = data.filter(item => item.thingName === Identity)
          if (matches.length) {
            console.log('INFO: Device for user found successfully')
            resolve(matches[0])
          } else {
            console.log('INFO: Device has not finished activating yet')
            resolve(null)
          }
        })
        .catch(err => {
          console.error('ERROR: Failed to fetch available devices.')
          reject(err)
        })
    })
  }

  getAvailableDevices () {
    return new Promise((resolve, reject) => {
      const thingTypeName = 'QuizDevice'
      const params = {
        thingTypeName
      }

      this.iot.listThings(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.things)
        }
      })
    })
  }

  startUserRegistration (username) {
    return new Promise((resolve, reject) => {
      const IdentityId = this.auth.getUnauthIdentity()
      const timestamp = new Date().getTime()
      const payload = JSON.stringify({
        IdentityId,
        timestamp,
        username
      })

      const params = {
        topic: `iotquiz/registrations/${IdentityId}`,
        payload,
        qos: 0
      }
      this.iotData.publish(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  updateDeviceState (device, state) {
    const { thingName } = device

    return new Promise((resolve, reject) => {
      this.iotData.publish({
        topic: `$$aws/things/${thingName}/shadow/update`,
        payload: JSON.stringify({
          state: {
            desired: state
          }
        })
      })
    })
  }

  static getInstance () {
    if (!DeviceService._instance) {
      DeviceService._instance = new DeviceService()
    }
    return DeviceService._instance
  }
}
