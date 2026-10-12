import { lazy, Suspense, useSyncExternalStore } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MOBILE_EDITOR_QUERY } from '../utils/editorEnvironment';

const MobileCodeEditor = lazy(() => import('./MobileCodeEditor'));
const getSnapshot = () => window.matchMedia(MOBILE_EDITOR_QUERY).matches;
const getServerSnapshot = () => false;
function subscribe(callback) {
  const media = window.matchMedia(MOBILE_EDITOR_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export default function ResponsiveCodeEditor({ autocompleteEnabled = true, ...props }) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!mobile) return <MonacoEditor {...props} />;
  return <Suspense fallback={<div style={{ height: props.height, width: props.width ?? '100%' }}>{props.loading ?? 'Se încarcă editorul…'}</div>}>
    <MobileCodeEditor {...props} autocompleteEnabled={autocompleteEnabled} />
  </Suspense>;
}
