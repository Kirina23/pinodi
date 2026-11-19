// Release guards: things that must be true in every build that leaves this folder.
import { INTRO, INTRO_TOTAL_MS } from '../src/overlays/introTiming';
import { readFileSync } from 'node:fs';
import { test, done, assert } from './_t';
import { DEMO_PRO_ENABLED, PRODUCT_IDS, PRIVACY_URL, TERMS_URL } from '../src/purchases/config';
import { kindOf, safeName, extOf } from '../src/storage/picked';

const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const yaml = readFileSync('codemagic.yaml', 'utf8');
const plist = readFileSync('ios/Snapdo/Info.plist', 'utf8');
const pbx = readFileSync('ios/Snapdo.xcodeproj/project.pbxproj', 'utf8');
const gitignore = readFileSync('.gitignore', 'utf8');

test('demo Pro switch is off', () => assert.equal(DEMO_PRO_ENABLED, false));
test('the «Включить Pro» test switch exists only on the web stand, never in the iPhone app', () => {
  const native = readFileSync('src/purchases/store.ts', 'utf8');
  assert.ok(/export const testSwitchAvailable = \(\) => false;/.test(native), 'store.ts: testSwitchAvailable must be false');
  assert.ok(/export function setTestPro\(_on: boolean\) \{\}/.test(native), 'store.ts: setTestPro must do nothing');
});
test('one bundle id everywhere', () => {
  const id = 'com.pinodi.app';
  assert.equal(app.ios.bundleIdentifier, id);
  assert.ok(yaml.includes(`bundle_identifier: ${id}`));
  assert.ok(pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = "${id}"`));
  for (const p of PRODUCT_IDS) assert.ok(p.startsWith(id + '.pro.'), p);
});
test('versions agree', () => {
  assert.ok(yaml.includes(`APP_VERSION: "${app.version}"`));
  assert.ok(plist.includes(`<string>${app.version}</string>`));
  assert.ok(pbx.includes(`MARKETING_VERSION = ${app.version};`));
});
test('iPhone + iPad, scene life cycle, no encryption export', () => {
  assert.ok(pbx.includes('TARGETED_DEVICE_FAMILY = "1,2"'));
  assert.ok(plist.includes('UIApplicationSceneManifest'));
  assert.ok(/ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist));
});
test('every permission has a usage text', () => {
  for (const k of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription']) assert.ok(plist.includes(k), k);
});
test('secrets are git-ignored', () => {
  for (const k of ['*.p8', '*.p12', '*.pem', 'credentials.json', 'node_modules/', 'ios/Pods/']) assert.ok(gitignore.includes(k), k);
});
test('app icons: 1024×1024, no transparency (App Store rejects alpha), same in assets and Xcode', () => {
  const set = 'ios/Snapdo/Images.xcassets/AppIcon.appiconset/';
  const pairs = [
    ['assets/icon.png', set + 'App-Icon-1024x1024@1x.png'],
    ['assets/icon-dark.png', set + 'App-Icon-dark-1024x1024@1x.png'],
    ['assets/icon-tinted.png', set + 'App-Icon-tinted-1024x1024@1x.png'],
  ];
  for (const [a, b] of pairs) {
    const pa = readFileSync(a);
    const pb = readFileSync(b);
    for (const [f, p] of [[a, pa], [b, pb]] as const) {
      assert.equal(p.readUInt32BE(16), 1024, f);
      assert.equal(p.readUInt32BE(20), 1024, f);
      assert.equal(p[25], 2, `${f}: colour type must be RGB (2), not RGBA`);
    }
    assert.ok(pa.equals(pb), `${a} and ${b} differ`);
  }
});
test('paywall links are https', () => {
  assert.ok(PRIVACY_URL.startsWith('https://') && TERMS_URL.startsWith('https://'));
});
test('codemagic: pinned tools, --project, no integrations block', () => {
  assert.ok(yaml.includes('xcode: 27.1') && yaml.includes('node: 22.22.0'));
  assert.ok(yaml.includes('use-profiles --project ios/Snapdo.xcodeproj'));
  assert.ok(!/^\s*integrations:/m.test(yaml));
});
test('reminders are local: native module present, no push entitlement needed', () => {
  const ent = readFileSync('ios/Snapdo/Snapdo.entitlements', 'utf8');
  assert.ok(!ent.includes('aps-environment'), 'no aps-environment: the App Store profile has no Push capability');
  const cfg = JSON.parse(readFileSync('modules/snapdo-notify/expo-module.config.json', 'utf8'));
  assert.deepEqual(cfg.apple.modules, ['SnapdoNotifyModule']);
  const swift = readFileSync('modules/snapdo-notify/ios/SnapdoNotifyModule.swift', 'utf8');
  assert.ok(swift.includes('UNCalendarNotificationTrigger') && !swift.includes('registerForRemoteNotifications'));
});
test('the discount product is in the same Pro family and counts as Pro', () => {
  assert.ok(PRODUCT_IDS.includes('com.pinodi.app.pro.yearly.offer'));
});
test('picked file helpers', () => {
  assert.equal(kindOf('image/heic', 'IMG.HEIC'), 'image');
  assert.equal(kindOf('', 'clip.MOV'), 'video');
  assert.equal(kindOf('application/pdf', 'plan.pdf'), 'file');
  assert.equal(safeName('План на неделю (1).pdf'), 'План_на_неделю_1_.pdf');
  assert.equal(extOf('a.JPG', 'x'), 'jpg');
  assert.equal(extOf('noext', 'mov'), 'mov');
});
test('the app is called Pinodi on the home screen and in every user-visible text', () => {
  assert.ok(/<key>CFBundleDisplayName<\/key>\s*<string>Pinodi<\/string>/.test(plist));
  assert.ok(/<key>CFBundleName<\/key>\s*<string>Pinodi<\/string>/.test(plist));
  const oldNames = /Snapdo|Pushpin/;
  for (const l of ['en', 'ru']) {
    const strings = readFileSync(`ios/Snapdo/Supporting/${l}.lproj/InfoPlist.strings`, 'utf8');
    assert.ok(strings.includes('"CFBundleDisplayName" = "Pinodi";') && !oldNames.test(strings), `${l} InfoPlist.strings`);
    assert.ok(!oldNames.test(readFileSync(`locales/${l}.json`, 'utf8')), `locales/${l}.json`);
  }
  assert.equal(app.name, 'Pinodi');
  for (const f of ['src/i18n/strings.ts', 'src/purchases/store.web.ts', 'src/sheets/ShareSheet.tsx', 'docs/index.html', 'docs/privacy.html'])
    assert.ok(!oldNames.test(readFileSync(f, 'utf8')), f);
  assert.ok(!/<string>[^<]*(Snapdo|Pushpin)/.test(plist), 'Info.plist texts');
});
test('privacy policy is on brauny.pro', () => assert.equal(PRIVACY_URL, 'https://www.brauny.pro/privacy-snapdo.html'));
test('launch animation is short, matches the launch screen and respects Reduce Motion', () => {
  const src = readFileSync('src/overlays/LaunchIntro.tsx', 'utf8');
  assert.ok(INTRO_TOTAL_MS <= 800, `launch animation ${INTRO_TOTAL_MS} ms`);
  const splash = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen')[1];
  assert.equal(INTRO.iconPt, splash.imageWidth);
  assert.ok(readFileSync('src/theme/tokens.ts', 'utf8').includes(`bg: '${splash.backgroundColor.toLowerCase()}'`), 'launch screen colour = board colour');
  assert.ok(src.includes('isReduceMotionEnabled'), 'Reduce Motion');
  assert.ok(!readFileSync('App.tsx', 'utf8').includes('hideAsync'), 'only LaunchIntro hides the splash');
});
done('release');
