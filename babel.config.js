module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        ios: '9'
      },
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ]
};
