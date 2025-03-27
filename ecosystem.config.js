module.exports = {
  apps: [
    {
      name: 'ponz-server',
      script: 'node dist/main.js',
    },
    {
      name: 'ponz-cronjob',
      script: 'node dist/schedule.js',
    },
  ],
};
