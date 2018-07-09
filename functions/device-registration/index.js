const aws = require('aws-sdk')
const async = require('async')

exports.handler = function (event, context, callback) {
  console.log('INFO: Starting device registration')
  console.log(`INFO: Device id: ${event.IdentityId}`)
  console.log(`INFO: User name: ${event.username}`)
  const iot = new aws.Iot()

  async.series([

    cb => {
      console.log('INFO: Authorizing user to connect.')
      const policyName = process.env.DEVICE_POLICY_NAME
      const target = event.IdentityId
      const params = {
        policyName,
        target
      }

      iot.attachPolicy(params, (err, data) => {
        if(err) {
          console.error('ERROR: Failed to authorize user.')
          cb(err)
        } else {
          console.log('INFO: Successfully authorized user.')
          cb(null)
        }
      })
    },

    cb => {
      console.log('INFO: Creating IoT footprint')
      const thingName = event.IdentityId
      const thingTypeName = process.env.THING_TYPE_NAME
      const Name = event.username
      const Identity = event.IdentityId

      const params = {
        thingName, thingTypeName, 
        attributePayload: {
          attributes: {
            Name, Identity
          }
        }
      }
      
      iot.createThing(params, (err, data) => {
        if (err) {
          console.error('ERROR: Failed to create Iot footprint.')
          cb(err)
        } else {
          console.log('INFO: Successfully created Iot footprint.')
          cb(null)
        }
      })
    },

    cb => {
      console.log('INFO: Finishing registration.')
      async.waterfall([
        cb1 => {
          iot.describeEndpoint({}, (err, data) => {
            if (err) cb1(err)
            else cb1(null, data.endpointAddress)
          })
        },
        (endpoint, cb1) => {
          const iotData = new aws.IotData({ endpoint })
          const IdentityId = event.IdentityId
          const timestamp = new Date().getTime()
          const username = event.username
          const topic = `iotquiz/registrations/${IdentityId}/successful`
          const payload = JSON.stringify({
            IdentityId,
            timestamp,
            username
          })
          iotData.publish({
            topic,
            payload
          }, (err, data) => {
            if (err) {
              console.error('ERROR: Failed to publish success message.')
              cb1(err)
            } else {
              console.log('INFO: Successfully published success message.')
            }
          })
        }
      ], (err, data) => {
        if (err) {
          console.error('ERROR: Failed to finish activation.')
          cb(err)
        } else {
          console.log('INFO: Successfully finished activation.')
          cb(null)
        }
      })
    }

  ], (err, data) => {
    if (err) {
      console.error('ERROR: Failed to register device.')
      callback(err) 
    } else {
      console.log('INFO: Successfully activated device.')
      callback(null)
    }
  })
}
