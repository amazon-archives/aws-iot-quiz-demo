<template>
  <div class="quiz">
    <div class="section presentation" :class="{ active: currentSection === 'presentation' }">
      <h1>Welcome to IoT Quiz. The best quiz EVER.</h1>
      <div class="panel">
        <h2>Available quiz devices</h2>
        <div class="device-list">
          <div class="device" v-for="device in devices" :class="device.state.status" v-on:click="startDeviceActivation(device)">
            <i class="fa fa-microchip fa-3x"></i>
            {{ device.thingName }}
            <div class="player-name" v-show="device.playerName">
              {{ device.playerName }}
            </div>
            <div class="loader">
              <i class="fa fa-microchip fa-3x fa-spin"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="section game" :class="{ active: currentSection === 'game' }"></div>
    <div class="section results" :class="{ active: currentSection === 'results' }"></div>
  </div>
</template>

<script>
import DeviceService from '@/services/DeviceService'

export default {
  name: 'quiz',
  created () {
    this.deviceService = DeviceService.getInstance()
    const device = this.deviceService.connect()
    this.device = device
    device.on('connect', () => {
      console.log('INFO: Connected to IoT.')
      this.connected = true
      device.subscribe('$aws/things/+/shadow/update/accepted')
    })

    device.on('message', (topic, payload) => {
      console.log('INFO: Message received.')
      this.processMessage(topic, JSON.parse(payload))
    })

    device.on('error', () => {
      console.error('ERROR: There was an error on the IoT connection.')
      this.connected = false
    })
  },
  data () {
    return {
      connected: false,
      currentSection: 'presentation',
      devices: [
        {
          thingName: 'testDevice1',
          state: {
            status: 'disabled'
          }
        },
        {
          thingName: 'testDevice2',
          state: {
            status: 'disabled'
          }
        },
        {
          thingName: 'testDevice3',
          state: {
            status: 'disabled'
          }
        },
        {
          thingName: 'testDevice4',
          state: {
            status: 'disabled'
          }
        },
      ]
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      this.deviceService.getAvailableDevices()
        .then(deviceList => {
          this.devices = this.deviceList
          this.fetchData()
        })
        .catch(err => {
          console.error('ERROR: Failed to get available devices.')
          console.error(err)
        })
    },
    fetchData () {
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i]
        this.fetchDeviceState(device)
      }
    },
    fetchDeviceState (device) {
      const { thingName } = device
      this.deviceService.getState(thingName)
        .then(data => {
          const match = this.devices.filter(item => item.id === thingName)[0]
          if (!match) {
            console.error('ERROR: There is no such device!!!')
          } else {
            const state = data.state.reported
            match.state = state
          }
        })
        .catch(err => {
          console.error(`ERROR: Failed to fetch state for device ${thingName}`)
          console.error(err)
        })
    },
    processMessage (topic, payload) {
      const thingName = topic.split('/')[2]
      const availableDevices = this.devices.map(item => item.id)
      const index = availableDevices.indexOf(thingName)
      if (index === -1) {
        // return
      } else if(payload.state && payload.state.desired && payload.state.desired.status) {
        this.devices[index].status = payload.state.desired.status
      }
    },
    startDeviceActivation (device) {
      switch (device.state.status) {
        case 'disabled':
          this.continueDeviceActivation(device)
          break;
        default:
          // TODO Confirm before continuing
          this.continueDeviceActivation(device)
          break;
      }
    },

    continueDeviceActivation (device) {
      if (!device.playerName) {
        // TODO Change this to a fancier modal
        device.playerName = prompt('What\'s the player name?')
      }

      device.state.status = 'loading'
      this.finishDeviceActivation(device)
    },

    finishDeviceActivation (device) {
      this.deviceService.updateDeviceState(device, {
        status: 'enabled'
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.quiz {
  .section {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0px;

    &:not(.active) {
      display: none;
    }

    .panel {
      .device-list {
        .device {
          position: relative;
          text-align: center;
          display: inline-block;
          margin: 1em;
          padding: 2em 4em;
          border: 1px solid #dedede;
          border-radius: 5px;
          cursor: pointer;
          overflow: hidden;

          > i {
            display: block;
            margin-bottom: 0.3em;
          }

          .player-name {
            position: absolute;
            bottom: 0px;
            left: 0px;
            right: 0px;
            text-align: center;
            padding: 0.5em;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: bold;
          }

          .loader {
            position: absolute;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            padding-top: 3em;
            background: white;
            display: none;
          }

          &:hover {
            background: #dedede;
          }

          &.disabled {
            opacity: 0.5;
            border-width: 2px;
            border-style: dashed;
            border-color: #ccc;
          }

          &.loading {
            border-width: 2px;
            border-style: dashed;
            border-color: #ccc;

            .loader {
              display: block;
            }
          }

          &.enabled {
            border-width: 2px;
            border-style: dashed;
            border-color: green;
          }

          &.idle {
            border-width: 2px;
            border-color: #edf06d;
          }

          &.answer-ok {
            border-width: 2px;
            border-color: green;
          }

          &.answer-ko {
            border-width: 2px;
            border-color: red;
          }

          &.waiting-signal, &.waiting-answer {
            border-width: 2px;
            border-color: blue;
          }
        }
      }

    }
  }
}

</style>
