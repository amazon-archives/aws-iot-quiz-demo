<template>
  <div id="app" v-show="status === 'run'">
    <img class="logo" src="./assets/logo.png">
    <router-view v-on:state="statusChange" />
  </div>
</template>

<script>
import AuthService from '@/services/AuthService'

export default {
  name: 'App',
  created () {
    this.authService = AuthService.getInstance()
    const creds = this.authService.getCredentials()
    if (creds) {
      this.statusChange('run')
      this.$forceUpdate()

      // Manage credential expiration
      const accessToken = this.authService.getAccessToken()
      const expiration = accessToken.exp * 1000
      const diff = expiration - (new Date().getTime())
      setTimeout(() => {
        this.authService.login()
      }, diff)
    } else if (this.$route.name !== 'Login') {
      // this.authService.login()
      this.statusChange('run')
    }
  },
  data () {
    return {
      status: 'load'
    }
  },
  methods: {
    statusChange (st) {
      this.status = st
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;

  .logo {
    width: 100px;
  }
}
</style>
