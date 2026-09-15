package `in`.tohfa.mobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

// Single app for every role now (farmer/customer/admin no longer separate
// binaries) -- one MainActivity, matching index.js's single
// AppRegistry.registerComponent('TohfaMobile', ...) name.
class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "TohfaMobile"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
