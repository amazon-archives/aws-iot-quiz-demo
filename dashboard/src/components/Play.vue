<template>
  <div class="play">
    <div class="player-name">
      {{ playerName }}
    </div>
    <div class="section waiting" :class="{ active: currentMode === 'waiting' }">
      <div class="message" v-if="gameMode === 'normal'">The quiz has not started yet</div>
      <div class="actions" v-if="gameMode === 'autoplay'">
        <button class="btn btn-primary" @click="startSurvey()">
          <i class="fa fa-play-circle"></i>
          Start survey
        </button>
      </div>
    </div>
    <div class="section question" :class="{ active: currentMode === 'question' }">
      <div class="q">
        {{ currentQuestion.label }}
      </div>
      <div class="answers">
        <div class="a short" v-for="answer in currentQuestion.answers" v-if="currentQuestion.type === 'short'" @click="submitResponse(answer)">
          {{ answer.label }}
        </div>
        <div class="a long" v-for="answer in currentQuestion.answers" v-if="currentQuestion.type === 'long'" @click="submitResponse(answer)">
          {{ answer.label }}
        </div>
        <div class="a rate" v-for="answer in [1,2,3,4,5,6,7,8,9,10]" v-if="currentQuestion.type === 'rate'" @click="submitResponse(answer)">
          {{ answer }}
        </div>
        <div class="a free" v-if="currentQuestion.type === 'free'">
          <div class="form-group text-center">
            <label class="form-label" style="display: block">Your answer</label>
            <textarea class="form-control" rows="5" cols="30" v-model="freeAnswer"></textarea>
          </div>
          <div class="text-center actions">
            <button class="btn btn-success" @click="submitFreeAnswer()">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="section answer" :class="{ active: currentMode === 'answer' }"></div>
    <div class="section results" :class="{ active: currentMode === 'results' }">
      <h1>Gracias!</h1>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/AuthService'
import DeviceService from '@/services/DeviceService'

export default {
  name: 'play',
  created () {
    this.authService = AuthService.getInstance()
    this.deviceService = DeviceService.getInstance()
    const credentials = this.authService.getUnauthCredentials()
    this.deviceService.configure(credentials)
  },
  data () {
    return {
      connected: false,
      currentMode: 'waiting',
      gameMode: 'normal',
      gameMode: 'autoplay',
      playerName: '',
      freeAnswer: '',
      currentQuestion: {
        label: 'How many times do you eat a day?',
        type: 'free',
        answers: [
          {
            label: '1'
          },
          {
            label: 'Cupidatat in mollit tempor sunt commodo pariatur'
          },
          {
            label: 'Cupidatat in mollit tempor sunt commodo pariatur labore sint incididunt'
          },
          {
            label: 'Cupidatat in mollit tempor sunt'
          }
        ]
      },
      questionIndex: -1,
      questions: []
    }
  },
  mounted () {
    this.deviceService.getMyDevice()
      .then(thing => {
        if (!thing) {
          this.$router.push('/join-quiz')
          return
        }
        this.playerName = thing.attributes.Name
        const device = this.device = this.deviceService.connect()
        device.on('connect', () => {
          console.log('INFO: Connected to IoT.')
          this.connected = true
          device.subscribe('iotquiz/game/123/#')
        })

        device.on('message', (topic, payload) => {
          console.log('INFO: Message received.')
          this.processMessage(topic, JSON.parse(payload))
        })

        device.on('error', () => {
          console.error('ERROR: There was an error on the IoT connection.')
          this.connected = false
        })
      })
      .catch(err => {
        console.error(err)
      })
  },
  methods: {
    processMessage (topic, payload) {
      const topicPiece = topic.split('/')[3]

      switch (topicPiece) {
        case 'start':
        case 'question':
          this.currentMode = 'question'
          this.currentQuestion = payload.question
          break
        case 'answer':
          break
      }
    },

    startSurvey () {
      this.questionIndex = 0
      this.currentQuestion = this.questions[this.questionIndex]
      this.currentMode = 'question'
    },

    next () {
      this.questionIndex++
      if (this.questionIndex >= this.questions.length) {
        this.summary()
        return
      }
      this.currentQuestion = this.questions[this.questionIndex]
    },

    summary () {
      this.currentMode = 'results'
    },

    submitFreeAnswer () {
      const answer = {
        code: this.freeAnswer
      }
      this.submitResponse(answer)
      this.freeAnswer = ''
    },

    submitResponse (answer) {
      const question = this.currentQuestion.code
      const value = answer.code
      const Identity = this.authService.getUnauthIdentity()
      const username = this.playerName

      const payload = JSON.stringify({
        answer: {
          question, value, username, Identity
        }
      })

      this.device.publish('iotquiz/game/123/answer', payload)
      if (this.gameMode === 'autoplay') {
        this.next()
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.play {
  .player-name {
    margin-top: 1em;
    font-size: 1.3em;
    font-weight: bold;
  }

  .section {
    margin-top: 2em;

    &:not(.active) {
      display: none;
    }

    .q {
      font-weight: bold;
      font-size: 1.2em;
      padding: 1em;
    }

    .answers {
      margin-top: 1em;

      .a {
        background: #dedede;
        display: inline-block;

        &.short, &.long {
          padding: 15px 20px;
          display: block;
          margin: 1em 0.5em;
          border-bottom: 1px solid #dedede;
          border-radius: 5px;
        }

        &.rate {
          padding: 15px 20px;
          margin: 1em 0.5em;
          border-bottom: 1px solid #dedede;
          border-radius: 5px;
        }

        &.free {
          background: transparent !important;

          &:hover, .selected {
            background: transparent !important;
          }
        }

        &:hover, .selected {
          background: #aaa;
        }
      }
    }
  }
}

</style>
