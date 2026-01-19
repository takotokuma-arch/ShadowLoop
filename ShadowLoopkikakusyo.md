# **1\. プロジェクト概要**

## **1.1 開発目的と背景**

本プロジェクトは、YouTube上の任意の英語動画を、効果的なシャドーイング（Shadowing）教材へと即座に変換するWebアプリケーション「ShadowLoop」を開発することを目的とする。

既存の英語学習における以下の課題を解決する：

1. **教材不足**: 自分の興味のあるトピック（TED、ニュース、Vlog等）で、かつ適切な長さ・難易度の教材を見つけるコストが高い。  
2. **学習の分断**: 動画を視聴しながら、別途スクリプトを確認し、辞書を引くというマルチタスクが学習効率を下げている。  
3. **構造の欠如**: 生の動画は長すぎ、また息継ぎのポイント（センスグループ）が視覚化されていないため、初学者が挫折しやすい。

本アプリは、Generative AI（Gemini 1.5 Pro）を活用してこれらの課題を自動的に解決し、「動画URLを入力するだけ」で、語彙解説・区切り・和訳が完備された「プロ仕様の教材」を生成する。

## **1.2 プロダクトゴール（定義）**

本アプリケーションの完成形（Definition of Done）は以下の通りとする：

* **完全な自律動作**: 開発者がサーバー保守やコンテンツ更新を行うことなく、ユーザー自身がAPIキーを入力することで永続的に機能する。  
* **構造化された学習体験**: 単に動画と字幕を並べるだけでなく、AIによる「意味的な分割（チャンキング）」と「言語学的解析（強勢・区切り）」が視覚的に適用されている状態。  
* **即時性**: ユーザーが学習を開始したいと思った瞬間から、1分以内に教材生成が完了し、学習を開始できるUX。

## **1.3 運用・アーキテクチャ方針（技術的制約）**

本プロジェクトは「個人開発者がコストゼロで運用し続けられること」を絶対的な制約とする。開発AIは以下のルールを厳守すること。

1. **完全無料・サーバーレス (Zero Cost & Serverless)**  
   * VercelやGitHub Pages等の静的ホスティングのみで動作すること。  
   * 独自のバックエンドサーバー（Node.js, Python等）の構築は**禁止**する。  
   * BaaS（Firebase Auth, Firestore等）の使用も、無料枠超過のリスク回避および設定の複雑化を防ぐため、本プロジェクトでは**禁止**する。  
2. **BYOK (Bring Your Own Key) モデル**  
   * AIコストを開発者が負担しない設計とする。  
   * ユーザーが自身のGoogle Gemini APIキーを取得し、アプリ設定画面に入力する。  
   * APIキーはブラウザのLocalStorageにのみ保存し、外部サーバーには一切送信しない（セキュリティ担保）。  
3. **ローカル・データ・プライバシー (Local First)**  
   * 生成された教材データ、学習履歴、設定情報はすべてユーザーのブラウザ内（IndexedDB / Dexie.js）に保存する。  
   * クロスデバイス同期機能は実装しない（データのエクスポート/インポート機能で代替する）。

## **1.4 デザイン・哲学 (Modern Nordic & Dark Mode)**

本アプリケーションのUI/UXは、**「モダン・ノルディック（北欧）デザイン」を基調としたダークモード**を採用する。学習者の集中力を高めつつ、視覚的な心地よさを提供することを目的とする。

* **カラーパレット**:  
  * **背景**: 純粋な黒（\#000000）は避け、深みのあるチャコールグレー（例: Tailwindの slate-900, zinc-900）やダークネイビーをベースとする。  
  * **アクセント**: 北欧らしい彩度を落とした「くすみカラー」を採用する（例: アイスブルー、セージグリーン、ミュートコーラル）。原色は使用しない。  
  * **テキスト**: オフホワイト（\#F8FAFC等）を使用し、コントラスト比を確保しつつ目に刺さらない配色とする。  
* **コンポーネント形状**:  
  * カードやボタンには大きめの角丸（rounded-2xl 等）を適用し、柔らかさを表現する。  
  * 境界線は細く控えめにするか、わずかなエレベーション（浮き上がり）で階層を表現する。  
* **タイポグラフィ**:  
  * 可読性が高く、かつ幾何学的な美しさを持つサンセリフ体（Inter, DM Sans, Roboto等）を採用する。  
  * 余白（Whitespace）を十分に確保し、詰め込みすぎない「抜け感」のあるレイアウトにする。

## **1.5 ターゲットユーザーとユースケース**

* **ペルソナ**:  
  * TOEIC 600〜900点を目指す英語学習者。  
  * デザイン感度が高く、既存の無機質な学習アプリに満足できない層。  
* **デバイス要件 (Mobile First Strategy)**:  
  * **スマートフォン（縦画面）での利用を最優先**とする。  
  * PC画面はモバイル画面のレイアウトを単に引き伸ばしたものではなく、レスポンシブに最適化されたグリッド表示とする。  
  * タップ領域（Touch Target）は最低44px以上を確保し、誤操作を防ぐ。

# **2\. 技術スタックとアーキテクチャ**

本章では、「ShadowLoop」の開発に使用する技術スタックと、その選定理由、および全体的なシステムアーキテクチャを定義する。すべての技術選定は、**「完全無料」「サーバーレス」「堅牢な型安全性」**、そして\*\*「モダンな北欧デザインの実装」\*\*を基準に行われている。

## **2.1 フロントエンド基盤 (Core Frontend)**

* **Framework**: **React 18+**  
  * コンポーネント指向による高い再利用性と、豊富なエコシステムを活用するため。  
* **Build Tool**: **Vite**  
  * 高速なHMR（Hot Module Replacement）による開発効率の向上と、軽量で最適化されたプロダクションビルドを実現するため。  
* **Language**: **TypeScript**  
  * AIによるコーディングにおいて、厳格な型定義を通じた正確な実装を強制し、実行時エラー（特に複雑なJSONデータ構造の不整合）を未然に防ぐため。  
* **Routing**: **React Router DOM (v6)**  
  * SPA（Single Page Application）としてのスムーズな画面遷移と、URLパラメータ（例: /player/:video\_id）によるステート復元を管理するため。

## **2.2 UI/UX・スタイリング (Modern Nordic Design Stack)**

* **CSS Framework**: **Tailwind CSS**  
  * ユーティリティファーストのアプローチにより、デザインシステム（色、余白、角丸）の統一を容易にするため。  
  * **Configuration Strategy**:  
    * tailwind.config.js にて、北欧デザイン用のカスタムカラーパレット（Muted Colors）と、ダークモード用のカラー（Deep Charcoal/Slate）を定義する。  
    * フォントには Inter または Nunito を指定し、可読性と親しみやすさを両立させる。  
* **Animation**: **Framer Motion**  
  * 北欧デザイン特有の「滑らかさ」や「有機的な動き」を表現するため。画面遷移時のフェードインや、リスト項目の並び替えアニメーションに使用する。  
* **Icons**: **Lucide React**  
  * シンプルで線が細く、幾何学的なデザインが北欧スタイルと相性が良いため。視認性の高いSVGアイコンセットとして採用。  
* **Utility**: **clsx / tailwind-merge**  
  * 条件付きクラスの適用（例：再生中ボタンのハイライト切り替え）をクリーンに実装するため。

## **2.3 データ永続化・状態管理 (Data Persistence)**

* **Local Database**: **Dexie.js (IndexedDB Wrapper)**  
  * **選定理由**: ブラウザ標準のIndexedDBを、シンプルで型安全なクエリで使用できるライブラリ。LocalStorageの容量制限（約5MB）を回避し、動画ごとの大量のスクリプトデータや音声録音データを保存するために必須。  
  * **Schema設計**:  
    * materials: 教材データ本体（JSON）  
    * settings: ユーザー設定（APIキー等）  
* **State Management**: **React Hooks (Context API)**  
  * グローバルな状態（ダークモード設定、APIキーの有無）の管理に使用。複雑なライブラリ（Redux等）は避け、React標準機能で完結させる。

## **2.4 AI・外部サービス連携 (External Services)**

* **AI Engine**: **Google Generative AI SDK (@google/generative-ai)**  
  * Gemini 1.5 Pro APIへのリクエストを型安全に行うための公式SDK。  
  * **Schema Validation**: **Zod**  
    * AIが出力したJSONデータが、アプリケーションが期待するスキーマ（構造）と完全に一致しているかを実行時に検証・パースするために使用。AIのハルシネーションによるデータ構造崩れを防ぐ防波堤となる。  
* **Video Player**: **react-youtube**  
  * YouTube IFrame Player APIのReactラッパー。秒単位のシーク、再生速度変更、ループ再生の制御を行う。

## **2.5 システムアーキテクチャ図 (Client-Only Architecture)**

本アプリはバックエンドサーバーを持たない「クライアント完結型」アーキテクチャを採用する。

コード スニペット

graph TD  
    User\[User / Browser\]  
      
    subgraph "ShadowLoop App (Client Side)"  
        UI\[React UI Components\]  
        Logic\[Business Logic / Hooks\]  
        DB\[(IndexedDB / Dexie.js)\]  
        Store\[Local Storage\]  
    end  
      
    subgraph "External Cloud"  
        YouTube\[YouTube IFrame API\]  
        Gemini\[Google Gemini API\]  
    end

    User \--\>|Tap/Input| UI  
    UI \--\>|Read/Write| DB  
    UI \--\>|Save API Key| Store  
      
    Logic \--\>|Fetch Transcript/Gen JSON| Gemini  
    Logic \--\>|Control Video| YouTube  
      
    Gemini \--\>|JSON Response| Logic  
    YouTube \--\>|Video Stream| UI

* **データフロー**:  
  1. ユーザーがAPIキーを入力 → LocalStorageに暗号化せず保存（ブラウザ内完結のため）。  
  2. 動画URLを入力 → アプリがGemini APIを直接叩く。  
  3. 生成された教材データ → IndexedDBに保存される。  
  4. 学習時 → IndexedDBからデータを読み出し、YouTube動画と同期させて表示する。

# **3\. 機能要件詳細 (Functional Requirements)**

本章では、ShadowLoopの各画面およびモジュールが実装すべき具体的な機能と振る舞いを定義する。

## **3.1 設定・データ管理画面 (/settings)**

ユーザーがアプリケーションを利用するための初期設定、およびデータの保全を行う管理コンソール。

### **3.1.1 APIキー管理 (BYOK System)**

* **入力フォーム**: Google Gemini APIキーを入力するテキストフィールド。セキュリティのため、デフォルトではマスク表示（••••••）とし、表示/非表示トグルボタンを設置する。  
* **検証ロジック**:  
  * 入力されたキーを用いてGemini APIへダミーリクエスト（countTokens 等の軽量な処理）を送信し、有効性を検証する「Test Connection」ボタンを実装する。  
* **保存**: 検証に成功した場合のみ、ブラウザの LocalStorage にキーを保存する。  
  * *Security Note*: キーはバックエンドサーバーには送信せず、クライアントサイドのみで保持する。

### **3.1.2 データポータビリティ (Backup & Restore)**

IndexedDBのデータ消失リスク（ブラウザのキャッシュクリア等）に備えるための機能。

* **Export (JSON Download)**:  
  * Dexie.jsから materials および settings テーブルの全データを取得し、単一のJSONファイル（例: shadowloop\_backup\_YYYYMMDD.json）としてダウンロードさせる。  
* **Import (Restore)**:  
  * ユーザーがアップロードしたバックアップ用JSONファイルを解析し、スキーマ整合性をチェックした上で、ローカルDBに上書きまたはマージ保存する。  
  * *Warning*: インポート前に「現在のデータが上書きされます」という確認モーダルを表示する。

---

## **3.2 教材生成モジュール (/create) \- "Plan C" Approach**

YouTube動画から学習データを生成するコア機能。

### **3.2.1 入力インターフェース**

* **URL Input**: YouTube動画のURLを受け付ける入力フィールド。  
* **Thumbnail Preview**: URL入力時に即座にYouTubeのサムネイル画像を取得し、フェードインで表示して対象動画が正しいか確認させる。

### **3.2.2 字幕取得ロジック (Multi-Layer Defense)**

ブラウザのCORS制約を回避しつつ、最大限のUXを提供するフォールバック設計。

1. **Attempt 1 (Automatic Fetch)**:  
   * まず、動画IDを用いてYouTubeの非公式API（または youtube-transcript ライブラリ等）経由での字幕取得を試みる。  
2. **Attempt 2 (Manual Fallback)**:  
   * Attempt 1が失敗した場合（CORSエラーや字幕非公開など）、エラーメッセージを表示せず、静かに\*\*「字幕テキスト手動入力エリア」\*\*をスライドダウン表示する。  
   * ユーザーに対し、「動画ページの『文字起こしを表示』からテキストをコピーしてここに貼り付けてください」というガイダンスを表示する。

### **3.2.3 AI生成プロセスとクリーニング**

* **Loading UI**:  
  * Gemini 1.5 Proの処理（通常30〜60秒）の間、ユーザーを待機させるためのプログレスバーまたはスピナーを表示する。  
  * "Analyzing audio structure...", "Identifying vocabulary...", "Generating sense groups..." といったステップごとのメッセージを表示し、体感待ち時間を短縮する。  
* **Response Cleaning (Crucial)**:  
  * AIからのレスポンスを受け取った際、以下のサニタイズ処理を必ず実行するユーティリティ関数を通すこと：  
    1. Markdownのコードブロック記号（\`\`\`json, \`\`\`）の除去。  
    2. 正規表現 /{\[\\s\\S\]\*}/ を用いて、最初の中括弧 { から最後の中括弧 } までを抽出。  
    3. JSON.parse() でオブジェクト化し、Zod スキーマで構造検証を行う。

---

## **3.3 ライブラリー画面 (/)**

生成済み教材の一覧を表示するホーム画面。

### **3.3.1 表示モード**

* **Grid View**: カード型レイアウト。サムネイル画像を大きく表示。  
* **Metadata**:  
  * タイトル（2行まで表示、以降は「...」）  
  * 難易度（Level 1〜5のスターまたはバー表示）  
  * 総学習時間（例: "35 mins"）  
  * 作成日

### **3.3.2 データ操作**

* **Delete Action**: 各カードのメニューから教材を削除する機能。誤操作防止のため、確認ダイアログ（"Undo" トースト通知でも可）を挟む。  
* **Navigation**: カードをタップすると /player/:id へ遷移する。

---

## **3.4 学習プレイヤー画面 (/player/:id)**

学習体験の中核となる画面。

### **3.4.1 画面レイアウト (Split / Sticky)**

* **Video Container (Sticky)**:  
  * 画面上部（モバイルでは画面の1/3、PCでは左カラム）にYouTubeプレイヤーを固定配置する。スクロールしても動画が常に見える状態を維持する。  
* **Script Container (Scrollable)**:  
  * 画面下部（または右カラム）にスクリプトを表示する。

### **3.4.2 再生モード制御**

* **Full Track Mode**:  
  * 動画の最初から最後まで通しで再生する。  
  * 現在再生中の文をリアルタイムでハイライトする。  
* **Unit Practice Mode (Loop)**:  
  * 現在のUnit（30〜60秒の区間）のみを**自動ループ再生**する。  
  * 前のUnit / 次のUnitへ移動するナビゲーションボタンを配置。

### **3.4.3 プレイヤーコントロール**

* **Playback Rate**: 0.5x, 0.75x, 1.0x のトグルボタン。初期値は 0.75x（学習推奨速度）とする。  
* **AB Repeat**:  
  * スクリプト内の任意の文をタップ長押し、または区間選択することで、その1文だけをリピート再生する機能。

### **3.4.4 学習支援機能**

* **Sense Group Toggle**:  
  * 画面上のスイッチで、英文中のスラッシュ（/）の表示/非表示を切り替える。  
  * データ構造内の is\_sense\_group\_end: true プロパティを参照して描画する。  
* **Interactive Vocabulary**:  
  * 難解単語（データ構造内で定義済み）は点線の下線で示し、タップするとポップオーバーで「意味・発音記号・定義」を表示する。

### **3.4.5 録音機能 (Browser Native)**

* **Recorder**:  
  * マイクアイコンのボタンを配置。  
  * MediaRecorder API を使用し、ユーザーの声をブラウザメモリ内に一時録音する。  
* **Playback**:  
  * 録音停止後、即座に「自分の声」と「お手本（動画音声）」を聞き比べられるUIを表示する。  
  * *Note*: 録音データは容量圧迫を防ぐため、アプリを閉じるかページ遷移すると破棄する（保存しない）。

# **4\. データ設計 (Data Architecture & Schema)**

本章では、IndexedDB (Dexie.js) に保存するデータ構造、および AI (Gemini) が生成すべき JSON スキーマを厳密に定義する。AI のハルシネーション（幻覚）を防ぎ、アプリケーションの堅牢性を担保するため、**TypeScript の型定義**と **Zod スキーマ**の形式で記述する。

## **4.1 データベース構成 (Dexie.js Schema)**

アプリケーションは単一のデータベース ShadowLoopDB を持ち、以下の2つのストア（テーブル）で構成される。

### **4.1.1 Store: materials (教材データ)**

生成されたシャドーイング教材のメインストレージ。

| KeyPath | Type | Description |
| :---- | :---- | :---- |
| id (PK) | string | UUID v4。各教材を一意に識別する。 |
| created\_at | number | 作成日時のタイムスタンプ (Unix time)。 |
| youtube\_id | string | YouTube動画ID（サムネイル取得・再生用）。 |
| title | string | 教材のタイトル。 |
| json\_data | object | **AIが生成した完全な学習データ（後述のSchema参照）。** |

### **4.1.2 Store: settings (ユーザー設定)**

APIキーやアプリの環境設定を保存する。Key-Value形式で運用する。

| KeyPath | Type | Description |
| :---- | :---- | :---- |
| key (PK) | string | 設定項目名（例: "api\_key", "theme", "user\_name"）。 |
| value | any | 設定値。 |

---

## **4.2 AI生成データ構造 (The "Material" Schema)**

Gemini 1.5 Pro が生成し、materials ストアの json\_data カラムに格納される JSON オブジェクトの仕様。

この構造は、\*\*「ハイライト」「センスグループ区切り」「単語解説」\*\*のすべてのUI機能を支える基盤となる。

### **4.2.1 TypeScript Interface Definitions**

開発者は以下のインターフェースをそのままコードベース（types.ts 等）にコピーして使用する。

TypeScript

// 1\. Script Token: 文章を構成する最小単位  
// 単語、または短いフレーズごとに分割される  
export interface ScriptToken {  
  text: string;           // 表示するテキスト（例: "Long ago"）  
  is\_stressed: boolean;   // 強勢（アクセント）があるか。UIで太字にするフラグ  
  is\_sense\_group\_end: boolean; // センスグループの切れ目か。UIでスラッシュ(/)を表示するフラグ  
  start?: number;         // (Optional) この単語の発話開始時間（将来的なKaraoke機能用）  
}

// 2\. Vocabulary Item: 重要語彙の定義  
export interface VocabularyItem {  
  word: string;           // 見出し語（例: "Panicked"）  
  pronunciation: string;  // 発音記号（例: "/ˈpænɪkt/"）  
  definition: string;     // 文脈に即した日本語の意味  
  example\_sentence?: string; // (Optional) 例文  
}

// 3\. Learning Unit: 30-60秒の学習セクション  
export interface LearningUnit {  
  id: number;             // 連番 (1, 2, 3...)  
  title: string;          // セクションの要約タイトル（日本語）  
  start: number;          // 開始時間（秒・小数第2位まで）  
  end: number;            // 終了時間（秒・小数第2位まで）  
  script: ScriptToken\[\];  // このセクションのスクリプト本体  
  vocabulary: VocabularyItem\[\]; // このセクションに登場する重要語彙リスト  
  grammar\_note?: string;  // (Optional) ワンポイント文法解説  
}

// 4\. Root Object: AIが出力するJSONのルート  
export interface MaterialJSON {  
  material\_id?: string;   // 保存時にアプリ側でUUIDを付与  
  youtube\_id: string;     // 動画ID  
  title: string;          // AIが生成した適切なタイトル  
  level: number;          // 難易度 (1: Beginner \~ 5: Advanced)  
  duration\_info: string;  // 学習目安時間（例: "45 mins"）  
  tags: string\[\];         // カテゴリタグ（例: \["Narrative", "Fairy Tale"\]）  
  overview: string;       // 教材全体の短い導入文（日本語）  
  units: LearningUnit\[\];  // 学習ユニットの配列  
}

---

## **4.3 AIプロンプト用出力制約 (Strict JSON Mode)**

AIに対しては、上記の構造を強制するために、以下のJSONテンプレートをプロンプト内に含める。

JSON

{  
  "youtube\_id": "STRING\_VIDEO\_ID",  
  "title": "STRING\_TITLE",  
  "level": 3,  
  "duration\_info": "STRING\_ESTIMATED\_TIME",  
  "tags": \["tag1", "tag2"\],  
  "overview": "STRING\_BRIEF\_SUMMARY\_JP",  
  "units": \[  
    {  
      "id": 1,  
      "title": "STRING\_SECTION\_TITLE\_JP",  
      "start": 0.00,  
      "end": 35.50,  
      "script": \[  
        {  
          "text": "Long ago",  
          "is\_stressed": false,  
          "is\_sense\_group\_end": true  
        },  
        {  
          "text": "in a land far away",  
          "is\_stressed": true,  
          "is\_sense\_group\_end": true  
        }  
      \],  
      "vocabulary": \[  
        {  
          "word": "STRING\_WORD",  
          "pronunciation": "STRING\_IPA",  
          "definition": "STRING\_DEF\_JP"  
        }  
      \],  
      "grammar\_note": "STRING\_GRAMMAR\_TIP\_JP"  
    }  
  \]  
}

## **4.4 データの検証 (Validation Strategy)**

AIの出力は不安定である可能性があるため、アプリ側で保存する前に Zod ライブラリを用いてバリデーションを行う。

* **必須チェック**: youtube\_id, units 配列が空でないこと。  
* **型チェック**: start, end が数値であること。  
* **整合性チェック**: end 時間が start 時間より後であること。  
* **サニタイズ**: script 内のテキストに過剰な改行コードが含まれている場合、トリム処理を行う。

# **5\. AIプロンプト設計 (Prompt Engineering)**

本章では、Gemini 1.5 Pro API に送信するシステムプロンプト（System Instruction）とユーザープロンプトのテンプレートを定義する。

AIの出力品質はプロンプトの精度に依存するため、役割、ルール、制約条件を明確に言語化する。

## **5.1 システムロール定義 (Role Definition)**

AIには、単なる翻訳機ではなく、\*\*「応用言語学（Applied Linguistics）に精通したプロの英語コーチ」\*\*としての振る舞いを強制する。

* **Role**: Expert English Coach & Applied Linguist.  
* **Tone**: Objective, Encouraging, and Educational.  
* **Primary Goal**: YouTubeの字幕テキストを解析し、学習者が「効率的に音読・シャドーイング」を行うための、構造化されたJSONデータを生成すること。

## **5.2 解析・生成ロジックの詳細仕様**

以下のルールをプロンプト内に明記し、AIの思考プロセスを制御する。

### **5.2.1 ユニット分割 (Segmentation Strategy)**

動画全体を、学習しやすい小さな塊（Unit）に分割するルール。

* **Time Constraint**: 各Unitの長さは **30秒〜60秒** を目安とする。  
* **Semantic Constraint**: 決して文の途中で切断しないこと。必ず文末（ピリオド）や、話題の大きな転換点で区切る。  
* **Narrative Flow**: 物語の流れを断ち切らないよう、意味のまとまりを重視する。

### **5.2.2 センスグループとチャンキング (Syntactic Parsing)**

息継ぎやリズムの目安となる「意味の切れ目（Sense Group）」の判定ルール。

以下の条件で is\_sense\_group\_end: true を付与するよう指示する。

1. **前置詞句の前** (before prepositions like *in, at, on, to*).  
2. **接続詞の前** (before conjunctions like *and, but, because, although*).  
3. **関係詞節の前** (before relative clauses starting with *who, which, that*).  
4. **長い主語の後** (after long subjects).  
5. **句読点** (commas, periods).  
* *例外*: 3単語未満の短いフレーズは無理に分割せず、結合させる。  
* 基本的にこのルールはあくまで目安であり、ネイティブスピーカーの感覚に合わせてやってもらってかまわない。

### **5.2.3 語彙選定 (Vocabulary Extraction)**

* **Target Level**: CEFR B2〜C1レベルの単語、または文脈理解に不可欠な固有名詞やキーワード。  
* **Contextual Definition**: 一般的な辞書の定義ではなく、\*\*「その動画の文脈においてどういう意味で使われているか」\*\*を簡潔な日本語で説明する。

---

## **5.3 マスタープロンプト・テンプレート (Implementation Ready)**

開発時、以下のテキストをコード内の prompt 変数として使用する。{{TRANSCRIPT}} 等のプレースホルダーには実際のデータを挿入する。

Markdown

\# Role  
You are an expert English coach specializing in Shadowing techniques. Your task is to convert a raw YouTube transcript into a structured JSON learning material tailored for Japanese learners.

\# Input Data  
\- **\*\*Video Title\*\***: {{VIDEO*\_TITLE}}*  
*\- **\*\*Video ID\*\***: {{VIDEO\_*ID}}  
\- **\*\*Transcript\*\***:  
"""  
{{TRANSCRIPT*\_TEXT}}*  
*"""*

*\# Instructions*

*\#\# Step 1: Segmentation*  
*Split the transcript into "Learning Units" based on the following rules:*  
*\- Length: Approx. 30 to 60 seconds per unit.*  
*\- Boundaries: Must end at a sentence completion (period). Do not split mid-sentence.*  
*\- Content: Ensure each unit has a coherent sub-topic or narrative flow.*

*\#\# Step 2: Linguistic Analysis (Per Unit)*  
*For each unit, perform the following:*  
*1\.  **\*\*Script Tokenization\*\***: Break down the text into meaningful tokens (words or short phrases).*  
*2\.  **\*\*Sense Grouping\*\***: Mark \`is\_*sense*\_group\_*end: true\` at natural pause points (before prepositions, conjunctions, relative clauses, or at punctuation).  
3\.  **\*\*Stress Marking\*\***: Mark \`is\_stressed: true\` for content words (nouns, verbs, adjectives, adverbs) that carry the sentence's primary rhythm.  
4\.  **\*\*Translation\*\***: Provide a natural Japanese translation for the unit.  
5\.  **\*\*Vocabulary\*\***: Extract 3-5 difficult or key words. Provide their IPA pronunciation and context-specific Japanese meaning.

\#\# Step 3: Metadata Generation  
\- **\*\*Level\*\***: Estimate CEFR level (1-5 scale, where 1=A1, 5=C1+).  
\- **\*\*Overview\*\***: A brief summary of the video content in Japanese (approx. 100 characters).  
\- **\*\*Tags\*\***: 2-3 relevant topic tags (e.g., "Narrative", "Science", "Business").

\# Output Format (Strict JSON)  
You must output ONLY a valid JSON object. Do not encompass the JSON in markdown code blocks. Do not add conversational text. Use the following schema:

{  
  "youtube*\_id": "{{VIDEO\_*ID}}",  
  "title": "Refined Title for Learning",  
  "level": 3,  
  "duration*\_info": "Estimated study time (e.g. '45 mins')",*  
  *"tags": \["tag1", "tag2"\],*  
  *"overview": "Summary in Japanese...",*  
  *"units": \[*  
    *{*  
      *"id": 1,*  
      *"title": "Unit Summary (Japanese)",*  
      *"start": 0.0,*  
      *"end": 45.5,*  
      *"script": \[*  
        *{*  
          *"text": "Long ago",*  
          *"is\_*stressed": false,  
          "is\_sense\_group\_end": true  
        },  
        {  
          "text": "in a land far away",  
          "is\_stressed": true,  
          "is\_sense\_group\_end": true  
        }  
      \],  
      "japanese\_translation": "Japanese translation of this unit...",  
      "vocabulary": \[  
        {  
          "word": "panicked",  
          "pronunciation": "/ˈpænɪkt/",  
          "definition": "パニックに陥った（文脈での意味）"  
        }  
      \],  
      "grammar\_note": "Optional brief grammar tip in Japanese"  
    }  
  \]  
}

## **5.4 エラー回避のための追加戦略**

* **JSON Repair**: AIの出力が不完全な場合（閉じ括弧がない等）に備え、フロントエンド側で json-repair ライブラリ（軽量なパース補正ツール）を導入することを推奨する。  
* **Token Count Management**: 動画が長すぎる（15分以上）場合、Geminiのトークンリミットを考慮し、スクリプトを分割して複数回APIを叩くか、最初の5〜10分のみを生成対象とするロジックを実装する。

# **6\. 非機能要件・安全性・UIガイドライン**

本章では、アプリケーションの品質、信頼性、およびユーザー体験（UX）を決定づける非機能要件と、デザインシステムの実装詳細を規定する。

## **6.1 エラーハンドリングと回復性 (Resilience)**

ユーザーの学習フローを中断させないよう、予期せぬエラーに対して親切かつ建設的なフィードバックを行う。

### **6.1.1 APIエラー制御**

* **Gemini API Quota Exceeded (429 Error)**:  
  * **挙動**: 無料枠の上限に達した場合、システムエラーではなく「AIが少し疲れています。1分ほど待ってから再試行してください」といったユーモアを交えたトースト通知を表示する。  
  * **再試行ロジック**: 指数バックオフ（Exponential Backoff）による自動リトライは実装せず、ユーザーによる手動リトライボタン（"Try Again"）を提示する（APIBANのリスク回避）。  
* **YouTube Transcript Unavailable**:  
  * **挙動**: 自動取得に失敗した場合、即座に手動入力モードへフォールバックし、「字幕が見つかりませんでした。手動で貼り付けて続行できます」と案内する。

### **6.1.2 データ保全**

* **LocalStorage/IndexedDB Quota**:  
  * ストレージ容量不足（QuotaExceededError）が発生した場合、最も古い「学習完了済み」の教材からキャッシュを削除する提案、またはデータのエクスポートを促すダイアログを表示する。

---

## **6.2 UI/UXデザインガイドライン (Nordic Dark Theme)**

「集中」と「安らぎ」を両立するモダン・ノルディックデザインの実装スペック。Tailwind CSSのクラス指定を含む。

### **6.2.1 カラーパレット (Tailwind Config)**

完全な黒（\#000）は使用せず、深みのあるスレート（青灰色）をベースとする。

* **Backgrounds**:  
  * **Main Background**: bg-slate-950 (アプリ全体の背景)  
  * **Surface / Card**: bg-slate-900 (カード、モーダル、サイドバー)  
  * **Overlay**: bg-slate-800/50 \+ backdrop-blur-md (すりガラス効果)  
* **Typography**:  
  * **Primary Text**: text-slate-50 (ほぼ白、主要な読み物)  
  * **Secondary Text**: text-slate-400 (メタデータ、補足情報)  
  * **Muted**: text-slate-600 (プレースホルダー等)  
* **Accents (Muted & Organic)**:  
  * **Primary Action**: bg-indigo-500 hover: bg-indigo-400 (彩度を抑えたインディゴ)  
  * **Success / Safe**: text-teal-300 (目に優しいティールグリーン)  
  * **Highlight**: bg-indigo-500/20 (テキストハイライト用背景色)

### **6.2.2 タイポグラフィとレイアウト**

* **Font Family**: Inter, DM Sans, またはシステムフォント。幾何学的でクセのないサンセリフ体。  
* **Whitespace (余白)**:  
  * コンテンツの密集を防ぐため、p-6, gap-4 などの大きめの余白をデフォルトとする。  
  * 行間（Line Height）は leading-relaxed または leading-loose を適用し、スクリプトの可読性を最大化する。

### **6.2.3 モーションとインタラクション**

* **Micro-interactions**:  
  * ボタンのホバー時に scale-105 程度のわずかな拡大。  
  * タップ時に active:scale-95 の押し込みフィードバック。  
* **Transitions**:  
  * 画面遷移やアコーディオン展開には Framer Motion を使用し、バネのような物理挙動（Spring Animation）ではなく、静かで滑らかな ease-out トランジション（0.3s）を採用する。

---

## **6.3 セキュリティ・プライバシー要件**

* **API Key Safety**:  
  * Gemini APIキーは LocalStorage にのみ保存し、暗号化は行わない（クライアントサイドのみで完結するため、XSS脆弱性対策としての HttpOnly Cookie等は使用できないが、外部への漏洩リスクは低い）。  
  * 入力フィールドは type="password" 属性を使用し、ショルダーハッキング（覗き見）を防止する。  
* **Content Sanitization**:  
  * AIが生成したテキストデータ、およびユーザーが入力したテキストを表示する際は、Reactのデフォルトのエスケープ機能に依存するが、万が一 dangerouslySetInnerHTML を使用する場合は必ず DOMPurify を経由させる。

## **6.4 パフォーマンス要件**

* **Code Splitting**:  
  * React.lazy および Suspense を使用し、ルートごとの遅延読み込み（Lazy Loading）を実装する。特に「動画プレイヤー画面」と「設定画面」は分割対象とする。  
* **Lighthouse Score**:  
  * Accessibility（アクセシビリティ）とBest Practicesにおいて、スコア90以上を目指す。  
  * 画像（YouTubeサムネイル）には必ず loading="lazy" 属性と alt テキストを付与する。

