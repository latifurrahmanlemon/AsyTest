module.exports = {
  apps: [
    {
      name: 'AsyTest',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
      },
    },
  ],
};
