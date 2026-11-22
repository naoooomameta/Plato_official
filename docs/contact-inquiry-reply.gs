/**
 * プラトン 問い合わせページ（contact.html）用 自動返信
 * ─────────────────────────────────────────────
 * Apps Script「Plato公式_予約カレンダー」の InquiryReply.gs に設置済み（2026/11/19・バージョン18）。
 * handleContact() 内のサンクスメール分岐は次のとおり：
 *   if (email && p.source === 'platon-inquiry') { sendInquiryReply(p); } else if (email) { ...従来のサンクスメール... }
 *
 * - 「資料をメールで受け取りたい」or「受講料を知りたい」→ 資料PDFリンク付きメール
 * - それ以外 → 受付サンクスメール
 * - 本文は HTML（htmlBody）で送信。プレーンテキストは Gmail が全角38文字で強制改行するため。
 * - 文字色は指定しない（Gmailダークモードで反転してピンクに見えるため）。
 * - このファイルは1行1関数の「貼り付け用」形式（Apps Scriptエディタの自動補完で崩れないため）。
 */
var INQUIRY_DOC_URL = 'https://drive.google.com/file/d/1Io_vRHNcR4tzkdV2RlHFcqoyvsEzAnqC/view?usp=sharing';
var INQUIRY_BOOKING_URL = 'https://plato-humanities.com/#contact';
var INQUIRY_LINE_URL = 'https://line.me/ti/p/%40905eguri';
var INQUIRY_SITE_URL = 'https://plato-humanities.com/';
var INQUIRY_FROM_NAME = '文系の大学受験専門塾 プラトン';
var INQUIRY_REPLY_TO = 'info@plato-humanities.com';
var INQUIRY_DOC_KINDS = ['受講料を知りたい', '資料をメールで受け取りたい'];
function isInquiryPage(params) { return String(params.source || '') === 'platon-inquiry'; }
function inquiryWantsDoc(params) { if (String(params.wantsDoc || '') === '1') return true; var kinds = String(params.kinds || '').split('／'); for (var i = 0; i < kinds.length; i++) { if (INQUIRY_DOC_KINDS.indexOf(kinds[i].trim()) !== -1) return true; } return false; }
function inquiryAskedFee(params) { return String(params.kinds || '').indexOf('受講料を知りたい') !== -1; }
function sendInquiryReply(params) { if (!params.email) return; if (inquiryWantsDoc(params)) { sendInquiryDocReply(params); } else { sendInquiryThanksReply(params); } }
function inquirySummary_(params) { return ['========▼お問い合わせ内容▼========', '', '■ お問い合わせ内容：' + (params.kinds || '—'), '■ お問い合わせ者：' + (params.contactType || '—'), '■ お名前：' + (params.name || '—'), '■ お電話番号：' + (params.tel || '—'), '■ メールアドレス：' + (params.email || '—'), '■ お子様の学年：' + (params.grade || '—'), '■ 志望大学：' + (params.university || '—'), '■ 気になる科目：' + (params.subjects || '—'), '■ ご連絡がつきやすい時間帯：' + (params.contactTime || '指定なし'), ''].join('\n'); }
function inquirySignature_() { return ['━━━━━━━━━━━━━━━━━', INQUIRY_FROM_NAME, 'E-mail：' + INQUIRY_REPLY_TO, '公式サイト：' + INQUIRY_SITE_URL, '公式LINE：' + INQUIRY_LINE_URL, '━━━━━━━━━━━━━━━━━', '', '※ 本メールは自動送信です。ご返信は上記メールアドレスまたは公式LINEへお願いいたします。'].join('\n'); }
function inquiryHtml_(body) { var lines = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="word-break:break-all;">$1</a>').split('\n'); var out = []; for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (l === '') { out.push('<br>'); } else if (l.indexOf('・') === 0) { out.push('<div style="padding-left:1em;text-indent:-1em;">' + l + '</div>'); } else { out.push('<div>' + l + '</div>'); } } return '<div style="font-family:-apple-system,BlinkMacSystemFont,Hiragino Sans,Hiragino Kaku Gothic ProN,Meiryo,sans-serif;font-size:15px;line-height:1.8;">' + out.join('') + '</div>'; }
function inquirySend_(to, subject, body) { MailApp.sendEmail({ to: to, subject: subject, body: body, htmlBody: inquiryHtml_(body), name: INQUIRY_FROM_NAME, replyTo: INQUIRY_REPLY_TO }); }
function sendInquiryDocReply(params) { var userName = params.name || 'お客様'; var subject = '【プラトン】ご案内資料（サービス概要・受講料）をお送りします'; var lines = [userName + ' 様', '', 'この度は、文系の大学受験専門塾 プラトンにお問い合わせいただき、誠にありがとうございます。', 'ご希望いただいた「ご案内資料（サービス概要・コース・受講料）」をお送りします。', '', '■ ご案内資料（PDF・12ページ）', INQUIRY_DOC_URL, '', '【資料の内容】', '・P.2：プラトンとは／主な合格大学', '・P.3〜4：3つの仕組み／毎日課題システム', '・P.5〜9：コース・プラン比較・対応科目・学習カウンセリング・ご納入方法', '・P.10〜12：体験から入塾までの流れ／よくあるご質問／お問い合わせ先', '', '【受講料について】', '月額35,000円（税込）〜で、コース・指導回数（月2回／週1回／週2回）によって異なります。', 'お子様に合ったコースと正確な金額は、無料学習相談（オンライン・約30分）にてご案内しています。']; if (inquiryAskedFee(params)) { lines.push('受講料についてのご質問には、担当者からも改めてご連絡いたします。'); } lines.push('', '■ 無料学習相談のご予約', '（空いている日時をその場で選べます）', INQUIRY_BOOKING_URL, '', '入塾の強制は一切ありません。', '資料を見てのご質問だけでも、お気軽にご連絡ください。', '', inquirySummary_(params), inquirySignature_()); inquirySend_(params.email, subject, lines.join('\n')); }
function sendInquiryThanksReply(params) { var userName = params.name || 'お客様'; var subject = '【プラトン】お問い合わせありがとうございます'; var lines = [userName + ' 様', '', 'この度は、文系の大学受験専門塾 プラトンにお問い合わせいただき、誠にありがとうございます。', '内容を確認のうえ、担当者より1〜2営業日以内にお電話またはメールにてご連絡いたします。', '', '■ 無料学習相談のご予約', '（空いている日時をその場で選べます）', INQUIRY_BOOKING_URL, '', '■ 公式LINEでのご相談', INQUIRY_LINE_URL, '', '入塾の強制は一切ありません。', 'お気軽にご相談ください。', '', inquirySummary_(params), inquirySignature_()]; inquirySend_(params.email, subject, lines.join('\n')); }
function testInquiryReply() { var me = Session.getActiveUser().getEmail(); var base = { source: 'platon-inquiry', contactType: '保護者', name: 'テスト 太郎', tel: '09012345678', email: me, grade: '高校2年生', university: '早稲田大学', subjects: '英語', contactTime: '平日 夕方以降（17時〜21時）' }; var a = JSON.parse(JSON.stringify(base)); a.kinds = '受講料を知りたい／資料をメールで受け取りたい'; a.wantsDoc = '1'; var b = JSON.parse(JSON.stringify(base)); b.kinds = 'お試しコースを受けたい'; b.wantsDoc = ''; sendInquiryReply(a); sendInquiryReply(b); }
