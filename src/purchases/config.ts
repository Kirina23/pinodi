// Snapdo Pro — auto-renewable subscriptions in one group ("Snapdo Pro") in App Store Connect.
export const PRODUCT_MONTHLY = 'com.pinodi.app.pro.monthly';
export const PRODUCT_YEARLY = 'com.pinodi.app.pro.yearly';
// The same year of Pro at a lower price, sold only on the one-time offer screen (after 3 weeks).
// Same subscription group, so it can never be bought twice alongside the others.
export const PRODUCT_YEARLY_OFFER = 'com.pinodi.app.pro.yearly.offer';
/** The plans on the regular Pro sheet. */
export const PLAN_IDS = [PRODUCT_YEARLY, PRODUCT_MONTHLY];
/** Every product that turns Pro on. */
export const PRODUCT_IDS = [PRODUCT_YEARLY, PRODUCT_MONTHLY, PRODUCT_YEARLY_OFFER];

// MUST be false in every build that is shipped. true = Pro is on without paying (stand/demo only).
export const DEMO_PRO_ENABLED = false;

// Links shown under the paywall (App Review requires both for subscriptions).
// Terms: Apple's standard licence agreement (EULA), unless you add your own in App Store Connect.
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// Privacy policy page (the same address goes into App Store Connect → App Privacy).
export const PRIVACY_URL = 'https://www.brauny.pro/privacy-snapdo.html';
export const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';
