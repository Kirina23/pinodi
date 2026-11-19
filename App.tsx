// Snapdo — photo tasks. Root: providers, the main screen and the overlay layers
// (sheet, long-press menu, photo viewer, toast).
import { getLocales } from 'expo-localization';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ReservedRegionsProvider } from 'react-native-reserved-regions';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SheetHost } from './src/components/SheetHost';
import { ToastHost } from './src/components/ToastHost';
import { pickLang, setLang } from './src/i18n';
import { ContextMenuHost } from './src/overlays/ContextMenu';
import { ViewerHost } from './src/overlays/Viewer';
import { Main } from './src/screens/Main';
import { AddSheet, BatchSheet, EditorSheet } from './src/sheets/AddSheets';
import { CardMenuSheet, DetailSheet, VideoSheet } from './src/sheets/DetailSheets';
import { ListFormSheet, MenuSheet, PeriodSheet } from './src/sheets/MenuSheets';
import { NotifyAskSheet, NotifySheet } from './src/sheets/NotifySheets';
import { NoteSheet } from './src/sheets/NoteSheet';
import { OfferHost } from './src/overlays/Offer';
import { INTRO, LaunchIntro } from './src/overlays/LaunchIntro';
import { useEngagement } from './src/state/useEngagement';
import { ProSheet } from './src/sheets/ProSheet';
import { ShareSheet } from './src/sheets/ShareSheet';
import { AppStateProvider, useApp } from './src/state/AppState';
import { UIProvider, type SheetRoute } from './src/state/UI';
import { C } from './src/theme/tokens';
import { loadWebFonts } from './src/webFonts';
import { applyStandParams } from './src/stand';
import { StandInsets } from './src/components/StandInsets';

setLang(pickLang(getLocales()[0]?.languageCode));
applyStandParams(); // web stand only (no-op on iPhone)
loadWebFonts();
SplashScreen.preventAutoHideAsync().catch(() => {});

function renderSheet(r: SheetRoute) {
  switch (r.name) {
    case 'add':
      return <AddSheet />;
    case 'editor':
      return <EditorSheet id={r.id} draft={r.draft} text={r.text} />;
    case 'batch':
      return <BatchSheet files={r.files} />;
    case 'detail':
      return <DetailSheet id={r.id} />;
    case 'cardMenu':
      return <CardMenuSheet id={r.id} />;
    case 'menu':
      return <MenuSheet />;
    case 'note':
      return <NoteSheet id={r.id} />;
    case 'notify':
      return <NotifySheet />;
    case 'notifyAsk':
      return <NotifyAskSheet />;
    case 'period':
      return <PeriodSheet />;
    case 'listForm':
      return <ListFormSheet id={r.id} />;
    case 'share':
      return <ShareSheet ids={r.ids} title={r.title} />;
    case 'pro':
      return <ProSheet reason={r.reason} />;
    case 'video':
      return <VideoSheet media={r.media} title={r.title} example={r.media.id === 'pro-video-example'} />;
  }
}

function Root() {
  const { ready } = useApp();
  useEngagement();
  // launch animation: the board settles from 96 % while the icon flies away (LaunchIntro hides the splash)
  const board = useRef(new Animated.Value(0)).current;
  const [intro, setIntro] = useState(true);
  if (!ready) return <View style={styles.root} />;
  const boardScale = board.interpolate({ inputRange: [0, 1], outputRange: [INTRO.boardFrom, 1] });
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.root, intro && { transform: [{ scale: boardScale }] }]}>
        <Main />
      </Animated.View>
      <SheetHost render={renderSheet} />
      <ContextMenuHost />
      <ViewerHost />
      <OfferHost />
      <ToastHost />
      {intro && <LaunchIntro board={board} onDone={() => setIntro(false)} />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: C.bg }}>
      <StandInsets>
      <ReservedRegionsProvider style={styles.root}>
        <AppStateProvider>
          <UIProvider>
            <Root />
          </UIProvider>
        </AppStateProvider>
      </ReservedRegionsProvider>
      </StandInsets>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
