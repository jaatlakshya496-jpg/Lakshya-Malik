import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Download, Terminal, CheckCircle2, Copy } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface ApkExportModalProps {
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    soundManager.playClick();
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const capacitorCommand = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Malik Bike Stunt 2D" com.malik.bikestunt2d --web-dir dist
npm run build
npx cap add android
npx cap open android
# In Android Studio: Build > Build APK(s)`;

  const godotExportConfig = `# Godot 4 export_presets.cfg snippet for Android
[preset.0]
name="Android APK"
platform="Android"
runnable=true
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="./bin/MalikBikeStunt2D.apk"

[preset.0.options]
package/unique_name="com.malik.bikestunt2d"
package/name="Malik Bike Stunt 2D"
package/signed=true
screen/orientation=1 # 1 = Landscape
rendering/renderer/rendering_method="mobile"`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-racing">
              ANDROID APK & EXPORT SYSTEM
            </h1>
            <p className="text-xs text-slate-400">Play offline on Android or build a standalone release APK</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto my-auto py-6 space-y-6">
        {/* Method 1: Instant Android Install (PWA / WebAPK) */}
        <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white font-racing">
                METHOD 1: 1-CLICK ANDROID WEBAPK (OFFLINE READY)
              </h2>
              <p className="text-xs text-slate-400">Installs directly to your Android App Drawer with 60 FPS hardware acceleration</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 rounded-xl p-4 border border-slate-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Open this game in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android device.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Tap the browser menu <strong>(⋮)</strong> and select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Android will generate an official WebAPK with custom icon, fullscreen landscape lock, and offline local cache.</span>
            </div>
          </div>
        </div>

        {/* Method 2: Capacitor 1-Command APK Builder */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase text-white font-racing">
                  METHOD 2: DIRECT ANDROID APK BUILD (CAPACITOR / CLI)
                </h2>
                <p className="text-xs text-slate-400">Generate a signed .apk for sideloading or Google Play Store</p>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(capacitorCommand, 'cap')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 border border-slate-700"
            >
              {copied === 'cap' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'cap' ? 'COPIED!' : 'COPY COMMANDS'}
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {capacitorCommand}
          </pre>
        </div>

        {/* Method 3: Godot 4 Android Export Configuration */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase text-white font-racing">
                  METHOD 3: GODOT 4 EXPORT PRESET (EXPORT_PRESETS.CFG)
                </h2>
                <p className="text-xs text-slate-400">Preset configuration file for Godot 4.x Android builds</p>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(godotExportConfig, 'godot')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 flex items-center gap-1.5 border border-slate-700"
            >
              {copied === 'godot' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'godot' ? 'COPIED!' : 'COPY CONFIG'}
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {godotExportConfig}
          </pre>
        </div>
      </div>
    </div>
  );
};
