/* =====================================================================
   お問い合わせページ（contact.html）用 自動返信の出し分け
   ---------------------------------------------------------------------
   対象GAS: index.html / contact.html の送信先
     https://script.google.com/macros/s/AKfycbwrX64y_igArlYnE7JUS42uCswPldC9FlR8teSMAKqOzKRdUexdfexE_uX8ftNj8_tj/exec
     （action=contact を受けて問い合わせスプレッドシートに記録し、通知メール・自動返信を送っているプロジェクト）

   contact.html は、トップの無料相談フォームと同じ action=contact で送信しますが、
   source=platon-inquiry が付き、次のパラメータが追加で届きます。
     kinds       … お問い合わせ内容（「／」区切り。例「受講料を知りたい／資料をメールで受け取りたい」）
     subjects    … 気になる科目
     contactTime … ご連絡がつきやすい時間帯
     wantsDoc    … 「資料をメールで受け取りたい」にチェックがあれば '1'
     university  … 志望大学（トップのフォームと同じキー）
   ※ message 本文にも【お問い合わせ内容】などをまとめて入れてあるので、
      GASを変更しなくてもスプレッドシートと通知メールには全項目が残ります。

   このファイルがやること（自動返信だけを出し分けます）:
     ・「受講料を知りたい」または「資料をメールで受け取りたい」を含む → ご案内資料（PDF）のリンク付きメール
     ・それ以外（コース相談・お試し・併塾・無料相談予約・その他）        → サンクスのみ（担当者から連絡）
     ・メールアドレス未入力 → 自動返信なし
   トップの無料相談フォーム（source=platon）など他の導線は従来の自動返信のまま変わりません。

   設置手順（ガリレオの galileo_inquiry_reply.gs と同じ）:
     (1) Apps Script のプロジェクトに「ファイルを追加 → スクリプト」で新規ファイルを作り、本ファイルの内容を貼り付ける
     (2) doPost の action === 'contact' 分岐で、既存の自動返信を呼んでいる箇所を次のように1か所だけ書き換える
           if (params.source === 'platon-inquiry') {
             sendInquiryReply(params);          // ← 本ファイル
           } else {
             （既存の自動返信の呼び出しはそのまま）
           }
         ※ スプレッドシートへの記録・管理者通知はそのまま残す（本ファイルは触らない）
     (3) 下の INQUIRY_DOC_URL に、Drive 上の資料PDFの共有リンク（リンクを知っている全員が閲覧可）を入れる
     (4) testInquiryReply() を実行すると、自分宛に2パターン（資料リンク付き／サンクスのみ）のメールが届く
     (5) 必ず「デプロイ → デプロイを管理 → 編集 → 新しいバージョン → デプロイ」（URLは不変）
   ===================================================================== */

var INQUIRY_DOC_URL      = 'https://drive.google.com/file/d/19NRZcJv4TWuo74XHbuKTHfIqC8LJGCXu/view?usp=sharing'; // ご案内資料PDF（2026年11月版）
var INQUIRY_BOOKING_URL  = 'https://plato-humanities.com/#contact';   // 無料学習相談の予約（トップのフォーム）
var INQUIRY_LINE_URL     = 'https://line.me/ti/p/%40905eguri';         // 公式LINE
var INQUIRY_SITE_URL     = 'https://plato-humanities.com/';
var INQUIRY_FROM_NAME    = '文系の大学受験専門塾 プラトン';
var INQUIRY_REPLY_TO     = 'info@plato-humanities.com';
var INQUIRY_DOC_KINDS    = ['受講料を知りたい', '資料をメールで受け取りたい'];

// ===== 判定 =====
function isInquiryPage(params) {
  return String(params.source || '') === 'platon-inquiry';
}

function inquiryWantsDoc(params) {
  if (String(params.wantsDoc || '') === '1') return true;
  var kinds = String(params.kinds || '').split('／');
  for (var i = 0; i < kinds.length; i++) {
    if (INQUIRY_DOC_KINDS.indexOf(kinds[i].trim()) !== -1) return true;
  }
  return false;
}

function inquiryAskedFee(params) {
  return String(params.kinds || '').indexOf('受講料を知りたい') !== -1;
}

// ===== 入口（doPost から呼ぶ） =====
function sendInquiryReply(params) {
  if (!params.email) return; // メール未入力の場合は自動返信なし
  if (inquiryWantsDoc(params)) {
    sendInquiryDocReply(params);
  } else {
    sendInquiryThanksReply(params);
  }
}

// ===== 共通パーツ =====
function inquirySummary_(params) {
  return [
    '========▼お問い合わせ内容▼========',
    '',
    '■ お問い合わせ内容：' + (params.kinds || '—'),
    '■ お問い合わせ者：' + (params.contactType || '—'),
    '■ お名前：' + (params.name || '—'),
    '■ お電話番号：' + (params.tel || '—'),
    '■ メールアドレス：' + (params.email || '—'),
    '■ お子様の学年：' + (params.grade || '—'),
    '■ 志望大学：' + (params.university || '—'),
    '■ 気になる科目：' + (params.subjects || '—'),
    '■ ご連絡がつきやすい時間帯：' + (params.contactTime || '指定なし'),
    ''
  ].join('\n');
}

function inquirySignature_() {
  return [
    '━━━━━━━━━━━━━━━━━',
    INQUIRY_FROM_NAME,
    'E-mail：' + INQUIRY_REPLY_TO,
    '公式サイト：' + INQUIRY_SITE_URL,
    '公式LINE：' + INQUIRY_LINE_URL,
    '━━━━━━━━━━━━━━━━━',
    '',
    '※ 本メールは自動送信です。ご返信は上記メールアドレスまたは公式LINEへお願いいたします。'
  ].join('\n');
}

function inquirySend_(to, subject, body) {
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
    name: INQUIRY_FROM_NAME,
    replyTo: INQUIRY_REPLY_TO
  });
}

// ===== パターンA：資料リンク付き（受講料を知りたい／資料をメールで受け取りたい） =====
function sendInquiryDocReply(params) {
  var userName = params.name || 'お客様';
  var subject = '【プラトン】ご案内資料（サービス概要・受講料）をお送りします';
  var body = [
    userName + ' 様',
    '',
    'この度は、文系の大学受験専門塾 プラトンにお問い合わせいただき、誠にありがとうございます。',
    'ご希望いただいた「ご案内資料（サービス概要・コース・受講料）」をお送りします。',
    '',
    '■ ご案内資料（PDF・12ページ）',
    INQUIRY_DOC_URL,
    '',
    '　・2ページ：プラトンとは／主な合格大学',
    '　・3〜4ページ：3つの仕組み／毎日課題システム',
    '　・5〜9ページ：3つのコース・プラン比較・オプション・学習カウンセリング・ご納入方法',
    '　・10〜12ページ：体験と入塾までの流れ／よくあるご質問／お問い合わせ先',
    '',
    '受講料は月額35,000円（税込）〜で、コース・指導回数（月2回／週1回／週2回）・科目数によって異なります。',
    'お子様の状況に合ったコースと正確な金額は、無料学習相談（オンライン・約30分）にてご案内しています。',
    inquiryAskedFee(params) ? '受講料についてのご質問は、担当者からも改めてご連絡いたします。' : '',
    '',
    '■ 無料学習相談のご予約（空いている日時をその場で選べます）',
    INQUIRY_BOOKING_URL,
    '',
    '入塾の強制は一切ありません。資料を見てのご質問だけでも、お気軽にご連絡ください。',
    '',
    inquirySummary_(params),
    inquirySignature_()
  ].filter(function (l) { return l !== null && l !== undefined; }).join('\n').replace(/\n\n\n+/g, '\n\n');
  inquirySend_(params.email, subject, body);
}

// ===== パターンB：サンクスのみ（コース相談・お試し・併塾・無料相談予約・その他） =====
function sendInquiryThanksReply(params) {
  var userName = params.name || 'お客様';
  var subject = '【プラトン】お問い合わせありがとうございます';
  var body = [
    userName + ' 様',
    '',
    'この度は、文系の大学受験専門塾 プラトンにお問い合わせいただき、誠にありがとうございます。',
    '内容を確認のうえ、担当者より1〜2営業日以内にお電話またはメールにてご連絡いたします。',
    '',
    '■ 無料学習相談のご予約（空いている日時をその場で選べます）',
    INQUIRY_BOOKING_URL,
    '',
    '■ 公式LINEでのご相談',
    INQUIRY_LINE_URL,
    '',
    '入塾の強制は一切ありません。お気軽にご相談ください。',
    '',
    inquirySummary_(params),
    inquirySignature_()
  ].join('\n');
  inquirySend_(params.email, subject, body);
}

// ===== テスト（Apps Script エディタで実行 → 自分宛に2通届く） =====
function testInquiryReply() {
  var me = Session.getActiveUser().getEmail();
  var base = {
    source: 'platon-inquiry', contactType: '保護者', name: 'テスト 太郎', tel: '09012345678', email: me,
    grade: '高校2年生', university: '早稲田大学', subjects: '英語', contactTime: '平日 夕方以降（17時〜21時）'
  };
  var a = JSON.parse(JSON.stringify(base)); a.kinds = '受講料を知りたい／資料をメールで受け取りたい'; a.wantsDoc = '1';
  var b = JSON.parse(JSON.stringify(base)); b.kinds = 'お試しコースを受けたい'; b.wantsDoc = '';
  sendInquiryReply(a); // → 資料リンク付き
  sendInquiryReply(b); // → サンクスのみ
}
