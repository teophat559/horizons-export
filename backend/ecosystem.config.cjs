module.exports = {
  apps: [
    {
      name: 'horizons-backend',
      script: 'src/index.js',
      node_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
