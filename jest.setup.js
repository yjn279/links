/**
 * Jest global setup for SDK 55 / RN 0.83 compatibility.
 *
 * RN 0.83 moved several previously bridge-based modules to TurboModules and
 * changed how NativeModules / TurboModuleRegistry are initialised.  This file
 * runs as the first entry in `setupFiles` (before react-native/jest/setup.js
 * and jest-expo/src/preset/setup.js) and fixes two global pre-conditions:
 *
 * 1. `global.nativeModuleProxy`
 *    NativeModules.js (BatchedBridge) checks nativeModuleProxy first; if
 *    absent it reads __fbBatchedBridgeConfig which is undefined in jest and
 *    throws an invariant.  We set nativeModuleProxy to the standard RN jest
 *    NativeModules mock so that code calling NativeModules.* via
 *    requireActual() (which bypasses jest.doMock) gets correct stubs.
 *    We extend the mock with Expo-specific and RN-0.83-specific entries.
 *
 * 2. `global.__turboModuleProxy`
 *    TurboModuleRegistry.getEnforcing() checks __turboModuleProxy before
 *    falling back to NativeModules.  Several modules (AppState, SettingsManager,
 *    Appearance, etc.) were migrated to TurboModules in RN 0.83 but are not
 *    present in the legacy NativeModules mock.  We return the mock-map entry
 *    when it exists, and for unknown modules return an auto-stub (a Proxy that
 *    satisfies any property/method access) to prevent getEnforcing() from
 *    throwing.  The real jest-expo mock layer will override individual module
 *    behaviour through its own jest.doMock() calls.
 */

// ── Load official RN jest NativeModules mock ──────────────────────────────
// The file uses Flow annotations (e.g. `jest.fn() as JestMockFn<…>`) which
// babel-jest handles in setupFiles.
const rnMockNativeModules =
  require('react-native/jest/mocks/NativeModules').default;

// ── Expo additions ────────────────────────────────────────────────────────
// expo-modules-core/NativeViewManagerAdapter.native.tsx reads
// NativeModules.NativeUnimoduleProxy.viewManagersMetadata at load time.
if (!rnMockNativeModules.NativeUnimoduleProxy) {
  rnMockNativeModules.NativeUnimoduleProxy = {
    viewManagersMetadata: {},
    exportedMethods: {},
    modulesConstants: {},
    callMethod: jest.fn(() => Promise.resolve()),
  };
}

// ── RN 0.83 UIManager ─────────────────────────────────────────────────────
// react-native/jest/mocks/NativeModules.js has `UIManager: {}`.
// PaperUIManager.js (loaded via NativeViewManagerAdapter) calls
// NativeUIManager.getConstants() which fails on an empty object.
if (rnMockNativeModules.UIManager && !rnMockNativeModules.UIManager.getConstants) {
  rnMockNativeModules.UIManager.getConstants = jest.fn(() => ({}));
  rnMockNativeModules.UIManager.getConstantsForViewManager = jest.fn(() => null);
}

// ── RN 0.83 SettingsManager ───────────────────────────────────────────────
// Settings.ios.js reads NativeSettingsManager.getConstants().settings at
// module load time.  Without a proper `settings` map, accessing any Settings
// key throws "Cannot read properties of undefined".
if (!rnMockNativeModules.SettingsManager) {
  rnMockNativeModules.SettingsManager = {
    getConstants: jest.fn(() => ({ settings: {} })),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  };
}

// ── RN 0.83 SourceCode ────────────────────────────────────────────────────
// getDevServer.js calls NativeSourceCode.getConstants().scriptURL.match(…).
// When scriptURL is null match() throws.  The existing mock returns null so
// we override it with an empty string which safely returns null from match()
// and triggers the FALLBACK URL path.
rnMockNativeModules.SourceCode = {
  getConstants: jest.fn(() => ({ scriptURL: '' })),
};

// ── (1) nativeModuleProxy ─────────────────────────────────────────────────
global.nativeModuleProxy = rnMockNativeModules;

// ── (2) __turboModuleProxy ────────────────────────────────────────────────
// Helper: create a recursive auto-stub that returns jest.fn() for any method
// access and itself for any property access.  This prevents getEnforcing()
// from throwing for modules not in the legacy NativeModules map.
function makeAutoStub() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'getConstants') return jest.fn(() => ({}));
        return jest.fn();
      },
    },
  );
}

global.__turboModuleProxy =
  global.__turboModuleProxy ||
  function (name) {
    const mod = rnMockNativeModules[name];
    if (mod !== undefined) return mod;
    // Return an auto-stub for TurboModule-only modules not in the legacy map.
    // This satisfies getEnforcing() without breaking tests that rely on
    // correctly-typed mocks, since jest-expo's own doMock layer runs later
    // and installs real mocks via jest.mock()/jest.doMock().
    return makeAutoStub();
  };
