module.exports = {
  apps: [{
    name: 'recruitment-dashboard',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    restart_delay: 3000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: 9999,
      JWT_SECRET: 'CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET',
    },
  }],
};
