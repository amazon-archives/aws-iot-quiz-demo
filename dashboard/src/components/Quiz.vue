<template>
  <div class="quiz">
    <div class="section presentation" :class="{ active: currentSection === 'presentation' }">
      <h1>Welcome to IoT Quiz. The best quiz EVER.</h1>
      <div class="panel">
        <h2>Available quiz devices</h2>
        <div class="device-list">
          <div class="device" v-for="device in devices" :class="device.status" v-on:click="startDeviceActivation()">
            <i class="fa fa-microchip fa-3x"></i>
            {{ device.name }}
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
    device.on('connect', () => {
      console.log('INFO: Connected to IoT.')
      this.connected = true
      device.subscribe('$aws/things/+/shadow/update/accepted')
    })

    device.on('message', (topic, payload) => {
      console.log('INFO: Message received.')
      this.processMessage(topic, payload)
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
          id: 'quizdevice1',
          name: 'Player 1',
          assigned: false,
          status: 'idle'
        },
        {
          id: 'quizdevice2',
          name: 'Player 2',
          assigned: false,
          status: 'idle'
        }
      ]
    }
  },
  methods: {
    processMessage (topic, payload) {
      const thingName = topic.split('/')[3]
      const availableDevices = this.devices.map(item => item.id)
      if (availableDevices.indexOf(thingName) === -1) {
        return
      }

      
    },
    startDeviceActivation (device) {
      
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
          text-align: center;
          display: inline-block;
          margin: 1em;
          padding: 2em 4em;
          border: 1px solid #dedede;
          border-radius: 5px;
          cursor: pointer;

          i {
            display: block;
            margin-bottom: 0.3em;
          }

          &:hover {
            background: #dedede;
          }

          &.idle {
            border-width: 2px;
            border-color: #edf06d;
          }
        }
      }

    }
  }
}

</style>
