/**
<<<<<<< HEAD
 * React Native Entry Point
 * @format
 */

import { registerRootComponent } from 'expo';
import App from './App';

// Register the main App component
registerRootComponent(App);
=======
 * React Native Entry Point - Deployment Trigger v3.0
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
>>>>>>> origin/main
