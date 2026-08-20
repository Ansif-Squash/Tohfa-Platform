/**
 * React Native entry point. Metro/Babel compiles src/App.tsx from here.
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
