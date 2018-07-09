<template>
  <div class="join-quiz">
    <h1>Joining quiz</h1>
    <div class="section join" :class="{ active: currentSection === 'join' }">
      <div class="user-info">
        <div class="form-group">
          <label class="form-label" for="user-name">Your name</label>
          <input type="text" name="user-name" class="form-control" v-model="username" />
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-success" @click="startJoin()">
          <i class="fa fa-play-circle"></i>
          Start
        </button>
      </div>
    </div>
    <div class="section loading" :class="{ active: currentSection === 'loading' }">
      <h2>Welcome, {{ username }}</h2>
      <div class="loader">
        <i class="fa fa-circle-notch fa-spin fa-3x"></i>
        <div class="loading-message">{{ loadingMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/AuthService'
import DeviceService from '@/services/DeviceService'

export default {
  name: 'joinQuiz',
  created () {
    this.authService = AuthService.getInstance()
    this.deviceService = DeviceService.getInstance()
    const credentials = this.authService.getUnauthCredentials()
    this.deviceService.configure(credentials)
  },
  data () {
    return {
      currentSection: 'join',
      loadingMessage: 'Loading...',
      username: ''
    }
  },
  methods: {
    setSection (section) {
      this.currentSection = section
    },

    startJoin () {
      const name = this.username
      if (!name) {
        return
      }
      this.setSection('loading')
      this.loadingMessage = 'Requesting registration...'
      this.deviceService.startUserRegistration(name)
        .then(data => {
          console.log('INFO: Successfully registered user.')
          this.loadingMessage = 'Activating device...'
        })
        .catch(err => {
          console.error('ERROR: Failed to register device')
          console.error(err)
          this.loadingMessage = 'There was an error registering.'
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.join-quiz {
  .section {
    &:not(.active) {
      display: none;
    }

    .user-info {
      margin: 1em;
    }

    .loader {
      margin: 5em 0 0 0;

      .loading-message {
        margin-top: 10px;
      }
    }
  }
}

</style>
