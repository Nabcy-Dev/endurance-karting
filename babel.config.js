module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    // Désactiver react-refresh en production
    process.env.NODE_ENV !== 'production' && 'react-refresh/babel',
  ].filter(Boolean),
}; 