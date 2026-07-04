import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    allowedHosts: ['arrive-quench-resend.ngrok-free.dev']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        local_impact: resolve(__dirname, 'local_impact.html'),
        report_problem: resolve(__dirname, 'report_problem.html'),
        contribution_log: resolve(__dirname, 'contribution_log.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        rewards: resolve(__dirname, 'rewards.html'),
      }
    }
  }
})
