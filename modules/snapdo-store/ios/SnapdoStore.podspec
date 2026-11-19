# Local Expo module: a tiny StoreKit 2 bridge for Snapdo Pro (monthly + yearly subscription).
Pod::Spec.new do |s|
  s.name           = 'SnapdoStore'
  s.version        = '1.0.0'
  s.summary        = 'StoreKit 2 subscriptions for Snapdo'
  s.description    = 'Loads products, buys, restores and reports active Snapdo Pro subscriptions with StoreKit 2.'
  s.license        = 'MIT'
  s.author         = 'Snapdo'
  s.homepage       = 'https://github.com/expo/expo'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'StoreKit'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
