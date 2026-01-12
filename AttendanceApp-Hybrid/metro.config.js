const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude server files and other non-React Native files from bundling
config.resolver.blacklistRE = /server\.js|\.bat$|\.ps1$|\.md$|node_modules[/\\](?!.*[/\\]node_modules[/\\])/;

// Exclude server files from being watched
config.watchFolders = [];

module.exports = config;