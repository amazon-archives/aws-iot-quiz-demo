<template>
  <div class="quiz">
    <div class="section presentation" :class="{ active: currentSection === 'presentation' }">
      <h1>Welcome to IoT Quiz. The best quiz EVER.</h1>
      <div class="panel">
        <div class="join-quiz">
          <div class="title">Want to join the quiz? <span class="quiz-url">{{ quizUrl }}</span></div>
        </div>
        <h2>Available quiz devices</h2>
        <div class="device-list">
          <div class="device" v-for="device in devices" :class="device.state.status" v-on:click="startDeviceActivation(device)">
            <i class="fa fa-3x" :class="{ 'fa-microchip': device.type === 'mcu', 'fa-mobile-alt': device.type === 'mobile' }"></i>
            <div class="thing-name">
              {{ device.thingName }}
            </div>
            <div class="player-name" v-show="device.attributes.Name">
              {{ device.attributes.Name }}
            </div>
            <div class="loader">
              <i class="fa fa-circle-notch fa-3x fa-spin"></i>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-primary" @click="startQuiz()">
            <i class="fa fa-play-circle"></i>
            Start Quiz
          </button>
        </div>
      </div>
    </div>
    <div class="section game" :class="{ active: currentSection === 'game' }" v-if="currentQuestion">
      <h1>{{ currentQuestion.label }}</h1>
      <div class="answers">
        <div class="row answer" v-for="answer in currentQuestion.answers">
          <div class="col-6 text-right">
            {{ answer.label }}
          </div>
          <div class="col-6 responses text-left">
            <div class="response" v-for="response in answer.responses">
              {{ response._label }} 
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="section results" :class="{ active: currentSection === 'results' }">
      <h1>Results</h1>
      <div class="row" v-for="question in questions" style="margin-top: 1em">
        <div class="col-6 text-right">
          {{ question.label }}
        </div>
        <div class="col-6 text-left">
          <div class="answer" v-for="answer in question.answers" v-if="answer.responses">
            <span class="label">{{ answer.label }}</span>
            <span class="value">({{ answer.responses.length }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/AuthService'
import DeviceService from '@/services/DeviceService'

export default {
  name: 'quiz',
  created () {
    this.authService = AuthService.getInstance()
    this.deviceService = DeviceService.getInstance()
  },
  computed: {
    currentQuestion () {
      return this.questions[this.currentQuestionIndex]
    }
  },
  data () {
    return {
      quizUrl: 'https://iotquiz.experiments.cloud/',
      connected: false,
      currentSection: 'presentation',
      devices: [
        {
          thingName: 'testDevice1',
          type: 'mcu',
          state: {
            status: 'disabled'
          }
        },
        {
          thingName: 'testDevice2',
          type: 'mcu',
          state: {
            status: 'disabled'
          }
        },
        {
          thingName: 'testDevice3',
          type: 'mobile',
          state: {
            status: 'disabled'
          }
        }
      ],
      currentQuestionIndex: -1,
      questions: [
        {
          code: 'qq1',
          label: 'What is the coolest thing ever?',
          type: 'short',
          answers: [
            {
              code: 'a1',
              label: 'Unicorns'
            },
            {
              code: 'a2',
              label: 'Ninjas'
            },
            {
              code: 'a3',
              label: 'IoT'
            }
          ]
        },
        {
          code: 'qq2',
          label: 'What can be cooler than a unicorn?',
          type: 'short',
          answers: [
            {
              code: 'a1',
              label: 'Other unicorn'
            },
            {
              code: 'a2',
              label: 'Ninjas'
            },
            {
              code: 'a3',
              label: 'AWS IoT'
            }
          ]
        }
      ]
    }
  },
  mounted () {
    const credentials = this.authService.getCredentials()
    this.deviceService.configure(credentials)
    const device = this.deviceService.connect()
    this.device = device
    device.on('connect', () => {
      console.log('INFO: Connected to IoT.')
      this.connected = true
      device.subscribe('$aws/things/+/shadow/update/accepted')
      device.subscribe('iotquiz/registrations/+/successful')
      device.subscribe('iotquiz/game/#')
    })

    device.on('message', (topic, payload) => {
      console.log('INFO: Message received.')
      this.processMessage(topic, JSON.parse(payload))
    })

    device.on('error', () => {
      console.error('ERROR: There was an error on the IoT connection.')
      this.connected = false
    })
    this.init()
  },
  methods: {
    init () {
      this.deviceService.getAvailableDevices()
        .then(deviceList => {
          this.devices = deviceList.map(item => ({
            ...item,
            state: {},
            type: 'mobile'
          }))
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
          switch (err.code) {
            case 'ResourceNotFoundException':
              console.log('INFO: Device is not well configured. configuring...')
              const state = {
                status: 'idle'
              }
              this.deviceService.updateDeviceState(device, state)
              device.state = state
              break
            default:
              console.error(`ERROR: Failed to fetch state for device ${thingName}`)
              console.error(err)
          }
        })
    },
    processMessage (topic, payload) {
      const topicStr = topic.indexOf('shadow/update/accepted') !== -1 ? 'shadow' : topic.indexOf('shadow/update/accepted') !== -1 ? 'registration' : topic.indexOf('/answer') !== -1 ? 'answer' : topic.indexOf('/clicker') !== -1 ? 'clicker' : 'unknown'
      switch (topicStr) {
        case 'shadow':
          const thingName = topic.split('/')[2]
          const availableDevices = this.devices.map(item => item.id)
          const index = availableDevices.indexOf(thingName)
          if (index === -1) {
            // return
          } else if (payload.state && payload.state.desired && payload.state.desired.status) {
            this.devices[index].status = payload.state.desired.status
          }
          break
        case 'registration':
          this.init()
          break
        case 'answer':
          const answer = payload.answer
          const code = answer.value

          const match = this.currentQuestion.answers.filter(item => item.code === code)[0]
          if (!match) {
            console.error('ERROR: Received erroneous response.')
            break
          }

          match.responses.push(answer)
          this.$forceUpdate()
          break
        case 'clicker':
          switch(payload.clickType) {
            case 'SINGLE':
              // Next
              this.currentQuestionIndex++
              this.selectQuestion()
              break
            case 'LONG':
              // Previous
              this.currentQuestionIndex--
              this.selectQuestion()
              break
            case 'DOUBLE':
              // Summary
              this.selectQuestion(-1)
              break
          }
          break
      }
    },
    startDeviceActivation (device) {
      switch (device.state.status) {
        case 'disabled':
          this.continueDeviceActivation(device)
          break
        default:
          // TODO Confirm before continuing
          this.continueDeviceActivation(device)
          break
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
    },

    startQuiz () {
      this.currentQuestionIndex = 0
      this.currentSection = 'game'
      const payload = {
        question: this.currentQuestion
      }
      this.device.publish('iotquiz/game/123/start', JSON.stringify(payload))
      this.selectQuestion(0, false)
    },

    selectQuestion (questionIndex = this.currentQuestionIndex, notify = true) {
      if (questionIndex < 0 || questionIndex >= this.questions.length) {
        this.currentQuestionIndex = -1
        this.currentSection = 'results'
      } else {
        this.currentQuestionIndex = questionIndex

        const answers = this.currentQuestion.answers
        for (let i = 0; i < answers.length; i++) {
          const answer = answers[i]
          if (!answer.responses) {
            answer.responses = []
          }
        }

        if (notify) {
          const payload = {
            question: this.currentQuestion
          }
          this.device.publish('iotquiz/game/123/question', JSON.stringify(payload))
        }
      }
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
      .join-quiz {
        margin: 2em 0;
        text-align: center;

        .title {
          font-size: 1.4em;

          .quiz-url {
            font-size: 2em;
            font-weight: bold;
            display: block;
          }
        }
      }

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

          .thing-name {
            max-width: 100px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
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

    .answers {
      margin-top: 2em;

      .answer {
        padding: 1em;
        border-bottom: 1px solid #aaa;
        font-size: 2em;
      }

      .responses {

        .response {
          position: relative;
          width: 30px;
          height: 30px;
          border-radius: 15px;
          display: inline-block;
          margin: 0 0.5em;
          background: green;
        }
      }
    }
  }
}

</style>
