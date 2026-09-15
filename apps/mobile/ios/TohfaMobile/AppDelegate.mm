#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Must match index.js's AppRegistry.registerComponent(...) name -- and the
  // Android MainActivity.kt getMainComponentName(), since both platforms load
  // the same entry file's registered component. Post-merge there is one app,
  // one entry file and one registered component name for every role.
  self.moduleName = @"TohfaMobile";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  // Debug: dev-server request for the single post-merge entry file,
  // apps/mobile/index.js. There is no per-flavor entry file any more, so this
  // is the plain default bundle root rather than a flavor-specific one.
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
