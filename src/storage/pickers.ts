// Camera, photo library and Files pickers → PickedAsset[] (nothing is copied yet).
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { MAX_PICK } from '../model/constants';
import { kindOf, type PickedAsset } from './picked';

export type PickKind = 'camera' | 'photos' | 'videos' | 'files';
export type PickResult = { assets: PickedAsset[] } | { denied: true } | { cancelled: true };

function fromImagePicker(a: ImagePicker.ImagePickerAsset, i: number): PickedAsset {
  const isVideo = a.type === 'video' || kindOf(a.mimeType, a.fileName) === 'video';
  const fallback = isVideo ? `Video ${i + 1}.mov` : `Photo ${i + 1}.jpg`;
  return {
    uri: a.uri,
    name: a.fileName || fallback,
    mime: a.mimeType || (isVideo ? 'video/quicktime' : 'image/jpeg'),
    size: a.fileSize || 0,
    kind: isVideo ? 'video' : 'image',
    width: a.width,
    height: a.height,
    // expo-image-picker reports video length in milliseconds on iPhone (in seconds on the web stand)
    duration: a.duration ? (Platform.OS === 'web' ? a.duration : a.duration / 1000) : undefined,
  };
}

export async function pick(kind: PickKind): Promise<PickResult> {
  if (kind === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { denied: true };
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, exif: false });
    return r.canceled ? { cancelled: true } : { assets: r.assets.map(fromImagePicker) };
  }
  if (kind === 'photos' || kind === 'videos') {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'photos' ? ['images'] : ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PICK,
      orderedSelection: true,
      quality: 1,
      exif: false,
      // HEIC → JPEG so every photo opens everywhere (share sheet, web, Windows).
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    return r.canceled ? { cancelled: true } : { assets: r.assets.map(fromImagePicker) };
  }
  const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
  if (r.canceled) return { cancelled: true };
  return {
    assets: r.assets.map((a) => ({ uri: a.uri, name: a.name || 'File', mime: a.mimeType || 'application/octet-stream', size: a.size || 0, kind: kindOf(a.mimeType, a.name) })),
  };
}
