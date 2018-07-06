import aws from 'aws-sdk'
import deviceSdk from 'aws-iot-device-sdk'
import AuthService from './AuthService'
import ConfigurationService from './ConfigurationService'

export default class DeviceService {
  constructor () {
    this.auth = AuthService.getInstance()
    this.config = ConfigurationService.getInstance()

    const credentials = this.auth.getCredentials()
    this.dynamo = new aws.DynamoDB.DocumentClient({
      region: this.config.get('AWS_REGION'),
      credentials
    })

    this.iot = new aws.Iot({
      region: this.config.get('AWS_REGION'),
      credentials
    })
  }

  connect () {
    const credentials = this.auth.getCredentials()
    this.iotData = new aws.IotData({
      endpoint: this.config.get('IOT_ENDPOINT'),
      region: this.config.get('AWS_REGION'),
      credentials
    })

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

  getAvailableDevices () {
    return new Promise((resolve, reject) => {
      const thingTypeName = 'quiz-device'
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

  static getInstance () {
    if (!DeviceService._instance) {
      DeviceService._instance = new DeviceService()
    }
    return DeviceService._instance
  }
}
