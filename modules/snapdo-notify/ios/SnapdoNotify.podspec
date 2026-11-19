# Local Expo module: local reminders for Snapdo (UNUserNotificationCenter). No push, no server,
# no entitlements: the messages are scheduled on the iPhone itself.
Pod::Spec.new do |s|
  s.name           = 'SnapdoNotify'
  s.version        = '1.0.0'
  s.summary        = 'Local reminders for Snapdo'
  s.description    = 'Asks for notification permission and schedules a few local reminders with UNUserNotificationCenter.'
  s.license        = 'MIT'
  s.author         = 'Snapdo'
  s.homepage       = 'https://github.com/expo/expo'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'UserNotifications'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
