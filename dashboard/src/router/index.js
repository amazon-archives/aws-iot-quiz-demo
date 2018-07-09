import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Login from '@/components/Login'
import JoinQuiz from '@/components/JoinQuiz'
import Quiz from '@/components/Quiz'
import Play from '@/components/Play'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld,
      meta: {
        public: true
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        public: true
      }
    },
    {
      path: '/quiz',
      name: 'Quiz',
      component: Quiz,
      meta: {
        public: false
      }
    },
    {
      path: '/join-quiz',
      name: 'JoinQuiz',
      component: JoinQuiz,
      meta: {
        public: true
      }
    },
    {
      path: '/play',
      name: 'Play',
      component: Play,
      meta: {
        public: true
      }
    }
  ]
})
