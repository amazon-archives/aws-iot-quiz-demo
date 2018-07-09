<template>
  <div class="hello">
    <h1>IoT Quiz</h1>
    <div class="text-muted">Powered by <i class="fab fa-aws"></i></div>
    <p>
      IoT Quiz is a demo we have created that shows how AWS IoT services can be used to empower your connected devices.
    </p>
    <div class="actions">
      <router-link class="btn btn-primary" to="/join-quiz">
        <i class="fa fa-plus fa-3x"></i>
        Join
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.hello {
  p {
    padding: 2em;
  }

  .actions {
    .btn {
      padding: 0.5em 2em;
      font-size: 1.5em;
      i {
        display: block;
        margin-bottom: 10px;
      }
    }
  }
}
</style>
