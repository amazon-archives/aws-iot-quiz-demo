<template>
  <div class="quiz">
    <div class="section presentation" :class="{ active: currentSection === 'presentation' }">
      <h1>Welcome to IoT Quiz. The best quiz EVER.</h1>
      <div class="panel">
        <h2>Available quiz devices</h2>
        <div class="device-list">
          <div class="device" v-for="device in devices" :class="device.status">
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
export default {
  name: 'quiz',
  data () {
    return {
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
