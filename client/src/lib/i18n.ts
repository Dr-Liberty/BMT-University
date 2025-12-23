import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const languages = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'zh', name: '中文', flag: 'CN' },
  { code: 'ja', name: '日本語', flag: 'JP' },
  { code: 'ko', name: '한국어', flag: 'KR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'pt', name: 'Português', flag: 'BR' },
  { code: 'ru', name: 'Русский', flag: 'RU' },
  { code: 'tr', name: 'Türkçe', flag: 'TR' },
  { code: 'ar', name: 'العربية', flag: 'SA' },
];

const en = {
  nav: { home: "Home", courses: "Courses", about: "About", dashboard: "Dashboard", analytics: "Analytics", admin: "Admin" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Learn Kaspa. Earn.", subtitleHighlight: "Collect Tears.",
    description: "Master BlockDAG and crypto through detailed courses with interactive quizzes. Join us in unlocking Kaspa's Learn-to-Earn potential. Complete lessons, pass quizzes, and earn $BMT tokens on the Kaspa network.",
    exploreCourses: "Explore Courses", dashboard: "Dashboard",
    vpnWarning: "Please disable your VPN before connecting your wallet. VPN usage may flag your account.",
    important: "Important:"
  },
  stats: { courses: "Courses", students: "Students", coursesCompleted: "Courses Completed", bmtDistributed: "$BMT Distributed" },
  wallet: {
    connect: "Connect Wallet", connecting: "Connecting...", disconnect: "Disconnect",
    wrongNetwork: "Switch to IGRA", switching: "Switching...", demoMode: "Demo Mode",
    exitDemo: "Exit Demo", tryDemo: "Try Demo", connectionFailed: "Connection Failed",
    openInWalletApp: "Open in Wallet App",
    mobileWalletMessage: "Please open this site inside your MetaMask or Trust Wallet app browser.",
    noWalletFound: "No wallet extension found. Please install MetaMask.",
    connectionRejected: "Connection rejected. Please approve in your wallet.",
    networkIssue: "Network configuration issue. Check your wallet settings.",
    tryAgain: "Failed to connect wallet. Please try again.",
    networkSwitched: "Network Switched", connectedToIgra: "Connected to IGRA Testnet",
    networkNotFound: "Network Not Found",
    addNetworkManually: "Add IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Switch Cancelled", approveSwitchInWallet: "Approve network switch in wallet.",
    switchFailed: "Network Switch Failed", couldNotSwitch: "Could not switch to IGRA Testnet."
  },
  courses: {
    title: "All Courses", subtitle: "Explore our curriculum from Bitcoin basics to Kaspa development",
    featured: "Featured", featuredSubtitle: "Begin with our most popular courses",
    trending: "Trending", best: "Best", new: "New",
    viewAll: "View All Courses", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
    lessons: "lessons", minutes: "min", earn: "Earn", bmt: "BMT",
    startCourse: "Start Course", continueCourse: "Continue", completed: "Completed", enrolled: "enrolled",
    search: "Search courses...", filter: "Filter", all: "All",
    fundamentals: "Fundamentals", development: "Development", defi: "DeFi",
    noCoursesFound: "No courses found"
  },
  dashboard: {
    title: "My Dashboard", welcome: "Welcome back", yourProgress: "Your Progress",
    totalEarned: "Total Earned", coursesCompleted: "Courses Completed", certificates: "Certificates",
    currentStreak: "Current Streak", days: "days", enrolledCourses: "Enrolled Courses",
    recentActivity: "Recent Activity", rewards: "Rewards", rewardHistory: "Reward History",
    pending: "Pending", confirmed: "Confirmed", failed: "Failed",
    noCourses: "No courses enrolled yet", startLearning: "Start Learning",
    referralProgram: "Referral Program",
    referralDescription: "Share your code and earn BMT when friends complete a course!",
    yourReferralCode: "Your Referral Code", copyCode: "Copy Code", codeCopied: "Copied!",
    referralStats: "Referral Stats", totalReferrals: "Total Referrals",
    pendingReferrals: "Pending", completedReferrals: "Completed", referralEarnings: "Referral Earnings"
  },
  quiz: {
    title: "Course Quiz", question: "Question", of: "of", submit: "Submit Answer",
    next: "Next Question", finish: "Finish Quiz", correct: "Correct!", incorrect: "Incorrect",
    score: "Your Score", passed: "Congratulations! You passed!", failed: "You didn't pass",
    retake: "Retake Quiz", passScore: "Pass Score", yourScore: "Your Score"
  },
  about: { title: "About BMT University", mission: "Our Mission", vision: "Our Vision", team: "Our Team" },
  footer: {
    description: "Learn Kaspa and earn $BMT tokens on Kasplex L2.",
    quickLinks: "Quick Links", resources: "Resources", documentation: "Documentation",
    support: "Support", community: "Community", rights: "All rights reserved."
  },
  common: {
    loading: "Loading...", error: "Error", success: "Success", cancel: "Cancel",
    save: "Save", delete: "Delete", edit: "Edit", back: "Back", next: "Next",
    previous: "Previous", close: "Close", confirm: "Confirm", submit: "Submit",
    search: "Search", noResults: "No results found", seeMore: "See More", seeLess: "See Less"
  },
  language: { title: "Language", select: "Select Language" }
};

const es = {
  nav: { home: "Inicio", courses: "Cursos", about: "Acerca de", dashboard: "Panel", analytics: "Análisis", admin: "Admin" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Aprende Kaspa. Gana.", subtitleHighlight: "Colecciona Lágrimas.",
    description: "Domina BlockDAG y criptomonedas con cursos detallados y cuestionarios interactivos. Completa lecciones, aprueba cuestionarios y gana tokens $BMT en la red Kaspa.",
    exploreCourses: "Explorar Cursos", dashboard: "Panel",
    vpnWarning: "Desactiva tu VPN antes de conectar tu billetera.",
    important: "Importante:"
  },
  stats: { courses: "Cursos", students: "Estudiantes", coursesCompleted: "Cursos Completados", bmtDistributed: "$BMT Distribuidos" },
  wallet: {
    connect: "Conectar Billetera", connecting: "Conectando...", disconnect: "Desconectar",
    wrongNetwork: "Cambiar a IGRA", switching: "Cambiando...", demoMode: "Modo Demo",
    exitDemo: "Salir del Demo", tryDemo: "Probar Demo", connectionFailed: "Conexión Fallida",
    openInWalletApp: "Abrir en App de Billetera",
    mobileWalletMessage: "Abre este sitio en el navegador de MetaMask o Trust Wallet.",
    noWalletFound: "No se encontró billetera. Instala MetaMask.",
    connectionRejected: "Conexión rechazada. Aprueba en tu billetera.",
    networkIssue: "Problema de configuración de red.",
    tryAgain: "Error al conectar. Intenta de nuevo.",
    networkSwitched: "Red Cambiada", connectedToIgra: "Conectado a IGRA Testnet",
    networkNotFound: "Red No Encontrada",
    addNetworkManually: "Agrega IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Cambio Cancelado", approveSwitchInWallet: "Aprueba el cambio de red.",
    switchFailed: "Cambio de Red Fallido", couldNotSwitch: "No se pudo cambiar a IGRA Testnet."
  },
  courses: {
    title: "Todos los Cursos", subtitle: "Explora nuestro currículo de fundamentos a desarrollo avanzado",
    featured: "Destacados", featuredSubtitle: "Comienza con nuestros cursos más populares",
    trending: "Tendencia", best: "Mejor", new: "Nuevo",
    viewAll: "Ver Todos los Cursos", beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado",
    lessons: "lecciones", minutes: "min", earn: "Gana", bmt: "BMT",
    startCourse: "Comenzar Curso", continueCourse: "Continuar", completed: "Completado", enrolled: "inscritos",
    search: "Buscar cursos...", filter: "Filtrar", all: "Todos",
    fundamentals: "Fundamentos", development: "Desarrollo", defi: "DeFi",
    noCoursesFound: "No se encontraron cursos"
  },
  dashboard: {
    title: "Mi Panel", welcome: "Bienvenido", yourProgress: "Tu Progreso",
    totalEarned: "Total Ganado", coursesCompleted: "Cursos Completados", certificates: "Certificados",
    currentStreak: "Racha Actual", days: "días", enrolledCourses: "Cursos Inscritos",
    recentActivity: "Actividad Reciente", rewards: "Recompensas", rewardHistory: "Historial",
    pending: "Pendiente", confirmed: "Confirmado", failed: "Fallido",
    noCourses: "Sin cursos inscritos", startLearning: "Comenzar a Aprender",
    referralProgram: "Programa de Referidos",
    referralDescription: "Comparte tu código y gana BMT cuando amigos completen un curso!",
    yourReferralCode: "Tu Código", copyCode: "Copiar", codeCopied: "Copiado!",
    referralStats: "Estadísticas", totalReferrals: "Total Referidos",
    pendingReferrals: "Pendientes", completedReferrals: "Completados", referralEarnings: "Ganancias"
  },
  quiz: {
    title: "Cuestionario", question: "Pregunta", of: "de", submit: "Enviar",
    next: "Siguiente", finish: "Finalizar", correct: "Correcto!", incorrect: "Incorrecto",
    score: "Tu Puntuación", passed: "Felicidades! Aprobaste!", failed: "No aprobaste",
    retake: "Repetir", passScore: "Puntuación para Aprobar", yourScore: "Tu Puntuación"
  },
  about: { title: "Acerca de BMT University", mission: "Nuestra Misión", vision: "Nuestra Visión", team: "Nuestro Equipo" },
  footer: {
    description: "Aprende Kaspa y gana tokens $BMT en Kasplex L2.",
    quickLinks: "Enlaces Rápidos", resources: "Recursos", documentation: "Documentación",
    support: "Soporte", community: "Comunidad", rights: "Todos los derechos reservados."
  },
  common: {
    loading: "Cargando...", error: "Error", success: "Éxito", cancel: "Cancelar",
    save: "Guardar", delete: "Eliminar", edit: "Editar", back: "Atrás", next: "Siguiente",
    previous: "Anterior", close: "Cerrar", confirm: "Confirmar", submit: "Enviar",
    search: "Buscar", noResults: "Sin resultados", seeMore: "Ver Más", seeLess: "Ver Menos"
  },
  language: { title: "Idioma", select: "Seleccionar Idioma" }
};

const zh = {
  nav: { home: "首页", courses: "课程", about: "关于", dashboard: "仪表板", analytics: "分析", admin: "管理" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "学习 Kaspa。获得收益。", subtitleHighlight: "收集眼泪。",
    description: "通过互动测验的详细课程掌握 BlockDAG 和加密货币知识。完成课程，通过测验，赚取 $BMT 代币。",
    exploreCourses: "浏览课程", dashboard: "仪表板",
    vpnWarning: "请在连接钱包前禁用 VPN。",
    important: "重要提示："
  },
  stats: { courses: "课程", students: "学员", coursesCompleted: "已完成课程", bmtDistributed: "已分发 $BMT" },
  wallet: {
    connect: "连接钱包", connecting: "连接中...", disconnect: "断开连接",
    wrongNetwork: "切换到 IGRA", switching: "切换中...", demoMode: "演示模式",
    exitDemo: "退出演示", tryDemo: "试用演示", connectionFailed: "连接失败",
    openInWalletApp: "在钱包应用中打开",
    mobileWalletMessage: "请在 MetaMask 或 Trust Wallet 应用内的浏览器中打开此网站。",
    noWalletFound: "未找到钱包扩展。请安装 MetaMask。",
    connectionRejected: "连接被拒绝。请在钱包中批准。",
    networkIssue: "网络配置问题。",
    tryAgain: "连接失败。请重试。",
    networkSwitched: "网络已切换", connectedToIgra: "已连接到 IGRA 测试网",
    networkNotFound: "未找到网络",
    addNetworkManually: "请手动添加 IGRA 测试网：RPC https://rpc.kasplex.org，链 ID 202555",
    switchCancelled: "切换已取消", approveSwitchInWallet: "请在钱包中批准网络切换。",
    switchFailed: "网络切换失败", couldNotSwitch: "无法切换到 IGRA 测试网。"
  },
  courses: {
    title: "全部课程", subtitle: "探索我们的课程体系",
    featured: "精选", featuredSubtitle: "从最受欢迎的课程开始",
    trending: "热门", best: "最佳", new: "最新",
    viewAll: "查看全部课程", beginner: "初级", intermediate: "中级", advanced: "高级",
    lessons: "课时", minutes: "分钟", earn: "获得", bmt: "BMT",
    startCourse: "开始课程", continueCourse: "继续", completed: "已完成", enrolled: "已注册",
    search: "搜索课程...", filter: "筛选", all: "全部",
    fundamentals: "基础", development: "开发", defi: "DeFi",
    noCoursesFound: "未找到课程"
  },
  dashboard: {
    title: "我的仪表板", welcome: "欢迎回来", yourProgress: "您的进度",
    totalEarned: "总收益", coursesCompleted: "已完成课程", certificates: "证书",
    currentStreak: "连续天数", days: "天", enrolledCourses: "已注册课程",
    recentActivity: "最近活动", rewards: "奖励", rewardHistory: "奖励历史",
    pending: "待处理", confirmed: "已确认", failed: "失败",
    noCourses: "尚未注册课程", startLearning: "开始学习",
    referralProgram: "推荐计划",
    referralDescription: "分享您的推荐码，当朋友完成课程时赚取 BMT！",
    yourReferralCode: "您的推荐码", copyCode: "复制", codeCopied: "已复制！",
    referralStats: "推荐统计", totalReferrals: "总推荐数",
    pendingReferrals: "待处理", completedReferrals: "已完成", referralEarnings: "推荐收益"
  },
  quiz: {
    title: "课程测验", question: "问题", of: "/", submit: "提交答案",
    next: "下一题", finish: "完成测验", correct: "正确！", incorrect: "错误",
    score: "您的得分", passed: "恭喜！您通过了！", failed: "未通过",
    retake: "重新测验", passScore: "通过分数", yourScore: "您的得分"
  },
  about: { title: "关于 BMT University", mission: "我们的使命", vision: "我们的愿景", team: "我们的团队" },
  footer: {
    description: "学习 Kaspa，赚取 $BMT 代币。",
    quickLinks: "快速链接", resources: "资源", documentation: "文档",
    support: "支持", community: "社区", rights: "版权所有。"
  },
  common: {
    loading: "加载中...", error: "错误", success: "成功", cancel: "取消",
    save: "保存", delete: "删除", edit: "编辑", back: "返回", next: "下一步",
    previous: "上一步", close: "关闭", confirm: "确认", submit: "提交",
    search: "搜索", noResults: "未找到结果", seeMore: "查看更多", seeLess: "收起"
  },
  language: { title: "语言", select: "选择语言" }
};

const ja = {
  nav: { home: "ホーム", courses: "コース", about: "概要", dashboard: "ダッシュボード", analytics: "分析", admin: "管理" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Kaspaを学ぶ。稼ぐ。", subtitleHighlight: "涙を集める。",
    description: "インタラクティブなクイズ付きの詳細なコースでBlockDAGと暗号通貨をマスター。レッスンを完了し、クイズに合格して$BMTトークンを獲得。",
    exploreCourses: "コースを探す", dashboard: "ダッシュボード",
    vpnWarning: "ウォレット接続前にVPNを無効にしてください。",
    important: "重要："
  },
  stats: { courses: "コース", students: "学生", coursesCompleted: "完了したコース", bmtDistributed: "配布済み$BMT" },
  wallet: {
    connect: "ウォレットを接続", connecting: "接続中...", disconnect: "切断",
    wrongNetwork: "IGRAに切り替え", switching: "切り替え中...", demoMode: "デモモード",
    exitDemo: "デモを終了", tryDemo: "デモを試す", connectionFailed: "接続失敗",
    openInWalletApp: "ウォレットアプリで開く",
    mobileWalletMessage: "MetaMaskまたはTrust Walletアプリ内のブラウザでこのサイトを開いてください。",
    noWalletFound: "ウォレット拡張機能が見つかりません。",
    connectionRejected: "接続が拒否されました。",
    networkIssue: "ネットワーク設定の問題です。",
    tryAgain: "接続に失敗しました。もう一度お試しください。",
    networkSwitched: "ネットワーク切り替え完了", connectedToIgra: "IGRAテストネットに接続",
    networkNotFound: "ネットワークが見つかりません",
    addNetworkManually: "IGRAテストネットを手動で追加：RPC https://rpc.kasplex.org、チェーンID 202555",
    switchCancelled: "切り替えがキャンセルされました", approveSwitchInWallet: "ウォレットで承認してください。",
    switchFailed: "ネットワーク切り替え失敗", couldNotSwitch: "IGRAテストネットに切り替えできませんでした。"
  },
  courses: {
    title: "全コース", subtitle: "包括的なカリキュラムを探索",
    featured: "注目", featuredSubtitle: "人気のコースから始めましょう",
    trending: "トレンド", best: "ベスト", new: "新着",
    viewAll: "すべてのコースを見る", beginner: "初級", intermediate: "中級", advanced: "上級",
    lessons: "レッスン", minutes: "分", earn: "獲得", bmt: "BMT",
    startCourse: "コースを開始", continueCourse: "続ける", completed: "完了", enrolled: "登録済み",
    search: "コースを検索...", filter: "フィルター", all: "すべて",
    fundamentals: "基礎", development: "開発", defi: "DeFi",
    noCoursesFound: "コースが見つかりません"
  },
  dashboard: {
    title: "マイダッシュボード", welcome: "おかえりなさい", yourProgress: "あなたの進捗",
    totalEarned: "合計獲得額", coursesCompleted: "完了したコース", certificates: "証明書",
    currentStreak: "連続日数", days: "日", enrolledCourses: "登録済みコース",
    recentActivity: "最近のアクティビティ", rewards: "報酬", rewardHistory: "報酬履歴",
    pending: "保留中", confirmed: "確認済み", failed: "失敗",
    noCourses: "コースに登録していません", startLearning: "学習を始める",
    referralProgram: "紹介プログラム",
    referralDescription: "紹介コードを共有してBMTを獲得！",
    yourReferralCode: "紹介コード", copyCode: "コピー", codeCopied: "コピーしました！",
    referralStats: "紹介統計", totalReferrals: "総紹介数",
    pendingReferrals: "保留中", completedReferrals: "完了", referralEarnings: "紹介収益"
  },
  quiz: {
    title: "コースクイズ", question: "問題", of: "/", submit: "回答を送信",
    next: "次の問題", finish: "クイズを終了", correct: "正解！", incorrect: "不正解",
    score: "あなたのスコア", passed: "おめでとう！合格です！", failed: "不合格でした",
    retake: "再挑戦", passScore: "合格スコア", yourScore: "あなたのスコア"
  },
  about: { title: "BMT Universityについて", mission: "使命", vision: "ビジョン", team: "チーム" },
  footer: {
    description: "Kaspaを学び、$BMTトークンを獲得。",
    quickLinks: "クイックリンク", resources: "リソース", documentation: "ドキュメント",
    support: "サポート", community: "コミュニティ", rights: "All rights reserved."
  },
  common: {
    loading: "読み込み中...", error: "エラー", success: "成功", cancel: "キャンセル",
    save: "保存", delete: "削除", edit: "編集", back: "戻る", next: "次へ",
    previous: "前へ", close: "閉じる", confirm: "確認", submit: "送信",
    search: "検索", noResults: "結果なし", seeMore: "もっと見る", seeLess: "閉じる"
  },
  language: { title: "言語", select: "言語を選択" }
};

const ko = {
  nav: { home: "홈", courses: "강좌", about: "소개", dashboard: "대시보드", analytics: "분석", admin: "관리자" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Kaspa를 배우고. 수익을 얻고.", subtitleHighlight: "눈물을 수집하세요.",
    description: "인터랙티브 퀴즈가 포함된 강좌를 통해 BlockDAG와 암호화폐를 마스터하세요. 레슨을 완료하고, 퀴즈를 통과하고, $BMT 토큰을 획득하세요.",
    exploreCourses: "강좌 탐색", dashboard: "대시보드",
    vpnWarning: "지갑 연결 전에 VPN을 비활성화하세요.",
    important: "중요:"
  },
  stats: { courses: "강좌", students: "학생", coursesCompleted: "완료된 강좌", bmtDistributed: "배포된 $BMT" },
  wallet: {
    connect: "지갑 연결", connecting: "연결 중...", disconnect: "연결 해제",
    wrongNetwork: "IGRA로 전환", switching: "전환 중...", demoMode: "데모 모드",
    exitDemo: "데모 종료", tryDemo: "데모 체험", connectionFailed: "연결 실패",
    openInWalletApp: "지갑 앱에서 열기",
    mobileWalletMessage: "MetaMask 또는 Trust Wallet 앱 브라우저에서 열어주세요.",
    noWalletFound: "지갑 확장 프로그램이 없습니다.",
    connectionRejected: "연결이 거부되었습니다.",
    networkIssue: "네트워크 구성 문제입니다.",
    tryAgain: "연결 실패. 다시 시도하세요.",
    networkSwitched: "네트워크 전환됨", connectedToIgra: "IGRA 테스트넷 연결됨",
    networkNotFound: "네트워크를 찾을 수 없음",
    addNetworkManually: "IGRA 테스트넷 추가: RPC https://rpc.kasplex.org, 체인 ID 202555",
    switchCancelled: "전환 취소됨", approveSwitchInWallet: "지갑에서 승인해주세요.",
    switchFailed: "네트워크 전환 실패", couldNotSwitch: "IGRA로 전환할 수 없습니다."
  },
  courses: {
    title: "전체 강좌", subtitle: "종합 커리큘럼을 탐색하세요",
    featured: "추천", featuredSubtitle: "인기 강좌로 시작하세요",
    trending: "인기", best: "최고", new: "신규",
    viewAll: "전체 강좌 보기", beginner: "초급", intermediate: "중급", advanced: "고급",
    lessons: "레슨", minutes: "분", earn: "획득", bmt: "BMT",
    startCourse: "강좌 시작", continueCourse: "계속하기", completed: "완료됨", enrolled: "등록됨",
    search: "강좌 검색...", filter: "필터", all: "전체",
    fundamentals: "기초", development: "개발", defi: "DeFi",
    noCoursesFound: "강좌를 찾을 수 없습니다"
  },
  dashboard: {
    title: "내 대시보드", welcome: "환영합니다", yourProgress: "나의 진행 상황",
    totalEarned: "총 수익", coursesCompleted: "완료된 강좌", certificates: "인증서",
    currentStreak: "연속 일수", days: "일", enrolledCourses: "등록된 강좌",
    recentActivity: "최근 활동", rewards: "보상", rewardHistory: "보상 내역",
    pending: "대기 중", confirmed: "확인됨", failed: "실패",
    noCourses: "등록한 강좌가 없습니다", startLearning: "학습 시작",
    referralProgram: "추천 프로그램",
    referralDescription: "추천 코드를 공유하고 BMT를 획득하세요!",
    yourReferralCode: "추천 코드", copyCode: "복사", codeCopied: "복사됨!",
    referralStats: "추천 통계", totalReferrals: "총 추천 수",
    pendingReferrals: "대기 중", completedReferrals: "완료됨", referralEarnings: "추천 수익"
  },
  quiz: {
    title: "강좌 퀴즈", question: "문제", of: "/", submit: "답안 제출",
    next: "다음 문제", finish: "퀴즈 종료", correct: "정답!", incorrect: "오답",
    score: "점수", passed: "축하합니다! 합격!", failed: "불합격",
    retake: "다시 도전", passScore: "합격 점수", yourScore: "내 점수"
  },
  about: { title: "BMT University 소개", mission: "사명", vision: "비전", team: "팀" },
  footer: {
    description: "Kaspa를 배우고 $BMT 토큰을 획득하세요.",
    quickLinks: "빠른 링크", resources: "리소스", documentation: "문서",
    support: "지원", community: "커뮤니티", rights: "All rights reserved."
  },
  common: {
    loading: "로딩 중...", error: "오류", success: "성공", cancel: "취소",
    save: "저장", delete: "삭제", edit: "편집", back: "뒤로", next: "다음",
    previous: "이전", close: "닫기", confirm: "확인", submit: "제출",
    search: "검색", noResults: "결과 없음", seeMore: "더 보기", seeLess: "접기"
  },
  language: { title: "언어", select: "언어 선택" }
};

const de = {
  nav: { home: "Startseite", courses: "Kurse", about: "Über uns", dashboard: "Dashboard", analytics: "Analyse", admin: "Admin" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Lerne Kaspa. Verdiene.", subtitleHighlight: "Sammle Tränen.",
    description: "Meistere BlockDAG und Krypto durch detaillierte Kurse mit interaktiven Quizzen. Schließe Lektionen ab, bestehe Quizze und verdiene $BMT Token.",
    exploreCourses: "Kurse Erkunden", dashboard: "Dashboard",
    vpnWarning: "Bitte deaktiviere dein VPN vor dem Verbinden.",
    important: "Wichtig:"
  },
  stats: { courses: "Kurse", students: "Studenten", coursesCompleted: "Abgeschlossene Kurse", bmtDistributed: "Verteilte $BMT" },
  wallet: {
    connect: "Wallet Verbinden", connecting: "Verbinde...", disconnect: "Trennen",
    wrongNetwork: "Zu IGRA wechseln", switching: "Wechsle...", demoMode: "Demo-Modus",
    exitDemo: "Demo Beenden", tryDemo: "Demo Testen", connectionFailed: "Verbindung Fehlgeschlagen",
    openInWalletApp: "In Wallet-App öffnen",
    mobileWalletMessage: "Bitte öffne diese Seite im MetaMask oder Trust Wallet Browser.",
    noWalletFound: "Keine Wallet-Erweiterung gefunden.",
    connectionRejected: "Verbindung abgelehnt.",
    networkIssue: "Netzwerk-Konfigurationsproblem.",
    tryAgain: "Verbindung fehlgeschlagen. Bitte erneut versuchen.",
    networkSwitched: "Netzwerk Gewechselt", connectedToIgra: "Mit IGRA Testnet verbunden",
    networkNotFound: "Netzwerk Nicht Gefunden",
    addNetworkManually: "IGRA Testnet hinzufügen: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Wechsel Abgebrochen", approveSwitchInWallet: "Bitte in der Wallet genehmigen.",
    switchFailed: "Netzwerkwechsel Fehlgeschlagen", couldNotSwitch: "Konnte nicht zu IGRA wechseln."
  },
  courses: {
    title: "Alle Kurse", subtitle: "Erkunde unser umfassendes Curriculum",
    featured: "Empfohlen", featuredSubtitle: "Beginne mit unseren beliebtesten Kursen",
    trending: "Beliebt", best: "Beste", new: "Neu",
    viewAll: "Alle Kurse Anzeigen", beginner: "Anfänger", intermediate: "Fortgeschritten", advanced: "Experte",
    lessons: "Lektionen", minutes: "Min", earn: "Verdiene", bmt: "BMT",
    startCourse: "Kurs Starten", continueCourse: "Fortsetzen", completed: "Abgeschlossen", enrolled: "eingeschrieben",
    search: "Kurse suchen...", filter: "Filtern", all: "Alle",
    fundamentals: "Grundlagen", development: "Entwicklung", defi: "DeFi",
    noCoursesFound: "Keine Kurse gefunden"
  },
  dashboard: {
    title: "Mein Dashboard", welcome: "Willkommen zurück", yourProgress: "Dein Fortschritt",
    totalEarned: "Gesamt Verdient", coursesCompleted: "Abgeschlossene Kurse", certificates: "Zertifikate",
    currentStreak: "Aktuelle Serie", days: "Tage", enrolledCourses: "Eingeschriebene Kurse",
    recentActivity: "Letzte Aktivität", rewards: "Belohnungen", rewardHistory: "Belohnungshistorie",
    pending: "Ausstehend", confirmed: "Bestätigt", failed: "Fehlgeschlagen",
    noCourses: "Keine Kurse eingeschrieben", startLearning: "Lernen Beginnen",
    referralProgram: "Empfehlungsprogramm",
    referralDescription: "Teile deinen Code und verdiene BMT!",
    yourReferralCode: "Empfehlungscode", copyCode: "Kopieren", codeCopied: "Kopiert!",
    referralStats: "Empfehlungsstatistik", totalReferrals: "Gesamte Empfehlungen",
    pendingReferrals: "Ausstehend", completedReferrals: "Abgeschlossen", referralEarnings: "Empfehlungsverdienst"
  },
  quiz: {
    title: "Kurs-Quiz", question: "Frage", of: "von", submit: "Antwort Abgeben",
    next: "Nächste Frage", finish: "Quiz Beenden", correct: "Richtig!", incorrect: "Falsch",
    score: "Deine Punktzahl", passed: "Herzlichen Glückwunsch! Bestanden!", failed: "Nicht bestanden",
    retake: "Quiz Wiederholen", passScore: "Bestehenspunktzahl", yourScore: "Deine Punktzahl"
  },
  about: { title: "Über BMT University", mission: "Mission", vision: "Vision", team: "Team" },
  footer: {
    description: "Lerne Kaspa und verdiene $BMT Token.",
    quickLinks: "Schnelllinks", resources: "Ressourcen", documentation: "Dokumentation",
    support: "Support", community: "Community", rights: "Alle Rechte vorbehalten."
  },
  common: {
    loading: "Laden...", error: "Fehler", success: "Erfolg", cancel: "Abbrechen",
    save: "Speichern", delete: "Löschen", edit: "Bearbeiten", back: "Zurück", next: "Weiter",
    previous: "Vorherige", close: "Schließen", confirm: "Bestätigen", submit: "Absenden",
    search: "Suchen", noResults: "Keine Ergebnisse", seeMore: "Mehr Anzeigen", seeLess: "Weniger"
  },
  language: { title: "Sprache", select: "Sprache Auswählen" }
};

const fr = {
  nav: { home: "Accueil", courses: "Cours", about: "À Propos", dashboard: "Tableau de Bord", analytics: "Analyses", admin: "Admin" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Apprenez Kaspa. Gagnez.", subtitleHighlight: "Collectez des Larmes.",
    description: "Maîtrisez BlockDAG et la crypto grâce à des cours détaillés avec des quiz interactifs. Complétez les leçons, réussissez les quiz et gagnez des tokens $BMT.",
    exploreCourses: "Explorer les Cours", dashboard: "Tableau de Bord",
    vpnWarning: "Veuillez désactiver votre VPN avant de connecter.",
    important: "Important :"
  },
  stats: { courses: "Cours", students: "Étudiants", coursesCompleted: "Cours Complétés", bmtDistributed: "$BMT Distribués" },
  wallet: {
    connect: "Connecter le Portefeuille", connecting: "Connexion...", disconnect: "Déconnecter",
    wrongNetwork: "Passer à IGRA", switching: "Changement...", demoMode: "Mode Démo",
    exitDemo: "Quitter la Démo", tryDemo: "Essayer la Démo", connectionFailed: "Connexion Échouée",
    openInWalletApp: "Ouvrir dans l'App",
    mobileWalletMessage: "Veuillez ouvrir ce site dans le navigateur MetaMask ou Trust Wallet.",
    noWalletFound: "Aucune extension de portefeuille trouvée.",
    connectionRejected: "Connexion refusée.",
    networkIssue: "Problème de configuration réseau.",
    tryAgain: "Échec de la connexion. Réessayez.",
    networkSwitched: "Réseau Changé", connectedToIgra: "Connecté à IGRA Testnet",
    networkNotFound: "Réseau Non Trouvé",
    addNetworkManually: "Ajouter IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Changement Annulé", approveSwitchInWallet: "Approuvez dans votre portefeuille.",
    switchFailed: "Échec du Changement", couldNotSwitch: "Impossible de passer à IGRA Testnet."
  },
  courses: {
    title: "Tous les Cours", subtitle: "Explorez notre programme complet",
    featured: "Vedette", featuredSubtitle: "Commencez avec nos cours les plus populaires",
    trending: "Tendance", best: "Meilleur", new: "Nouveau",
    viewAll: "Voir Tous les Cours", beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé",
    lessons: "leçons", minutes: "min", earn: "Gagnez", bmt: "BMT",
    startCourse: "Commencer le Cours", continueCourse: "Continuer", completed: "Terminé", enrolled: "inscrits",
    search: "Rechercher des cours...", filter: "Filtrer", all: "Tous",
    fundamentals: "Fondamentaux", development: "Développement", defi: "DeFi",
    noCoursesFound: "Aucun cours trouvé"
  },
  dashboard: {
    title: "Mon Tableau de Bord", welcome: "Bon retour", yourProgress: "Votre Progression",
    totalEarned: "Total Gagné", coursesCompleted: "Cours Complétés", certificates: "Certificats",
    currentStreak: "Série Actuelle", days: "jours", enrolledCourses: "Cours Inscrits",
    recentActivity: "Activité Récente", rewards: "Récompenses", rewardHistory: "Historique",
    pending: "En Attente", confirmed: "Confirmé", failed: "Échoué",
    noCourses: "Aucun cours inscrit", startLearning: "Commencer à Apprendre",
    referralProgram: "Programme de Parrainage",
    referralDescription: "Partagez votre code et gagnez du BMT!",
    yourReferralCode: "Code de Parrainage", copyCode: "Copier", codeCopied: "Copié!",
    referralStats: "Statistiques", totalReferrals: "Total Parrainages",
    pendingReferrals: "En Attente", completedReferrals: "Complétés", referralEarnings: "Gains"
  },
  quiz: {
    title: "Quiz du Cours", question: "Question", of: "sur", submit: "Soumettre",
    next: "Question Suivante", finish: "Terminer le Quiz", correct: "Correct!", incorrect: "Incorrect",
    score: "Votre Score", passed: "Félicitations! Vous avez réussi!", failed: "Vous n'avez pas réussi",
    retake: "Reprendre le Quiz", passScore: "Score de Réussite", yourScore: "Votre Score"
  },
  about: { title: "À Propos de BMT University", mission: "Mission", vision: "Vision", team: "Équipe" },
  footer: {
    description: "Apprenez Kaspa et gagnez des tokens $BMT.",
    quickLinks: "Liens Rapides", resources: "Ressources", documentation: "Documentation",
    support: "Support", community: "Communauté", rights: "Tous droits réservés."
  },
  common: {
    loading: "Chargement...", error: "Erreur", success: "Succès", cancel: "Annuler",
    save: "Sauvegarder", delete: "Supprimer", edit: "Modifier", back: "Retour", next: "Suivant",
    previous: "Précédent", close: "Fermer", confirm: "Confirmer", submit: "Soumettre",
    search: "Rechercher", noResults: "Aucun résultat", seeMore: "Voir Plus", seeLess: "Voir Moins"
  },
  language: { title: "Langue", select: "Sélectionner la Langue" }
};

const pt = {
  nav: { home: "Início", courses: "Cursos", about: "Sobre", dashboard: "Painel", analytics: "Análises", admin: "Admin" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Aprenda Kaspa. Ganhe.", subtitleHighlight: "Colecione Lágrimas.",
    description: "Domine BlockDAG e cripto através de cursos detalhados com quizzes interativos. Complete lições, passe nos quizzes e ganhe tokens $BMT.",
    exploreCourses: "Explorar Cursos", dashboard: "Painel",
    vpnWarning: "Desative sua VPN antes de conectar.",
    important: "Importante:"
  },
  stats: { courses: "Cursos", students: "Estudantes", coursesCompleted: "Cursos Concluídos", bmtDistributed: "$BMT Distribuídos" },
  wallet: {
    connect: "Conectar Carteira", connecting: "Conectando...", disconnect: "Desconectar",
    wrongNetwork: "Mudar para IGRA", switching: "Mudando...", demoMode: "Modo Demo",
    exitDemo: "Sair do Demo", tryDemo: "Experimentar Demo", connectionFailed: "Conexão Falhou",
    openInWalletApp: "Abrir no App",
    mobileWalletMessage: "Abra este site no navegador MetaMask ou Trust Wallet.",
    noWalletFound: "Nenhuma extensão de carteira encontrada.",
    connectionRejected: "Conexão rejeitada.",
    networkIssue: "Problema de configuração de rede.",
    tryAgain: "Falha na conexão. Tente novamente.",
    networkSwitched: "Rede Alterada", connectedToIgra: "Conectado à IGRA Testnet",
    networkNotFound: "Rede Não Encontrada",
    addNetworkManually: "Adicione IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Mudança Cancelada", approveSwitchInWallet: "Aprove na sua carteira.",
    switchFailed: "Falha na Mudança", couldNotSwitch: "Não foi possível mudar para IGRA."
  },
  courses: {
    title: "Todos os Cursos", subtitle: "Explore nosso currículo abrangente",
    featured: "Destaque", featuredSubtitle: "Comece com nossos cursos mais populares",
    trending: "Em Alta", best: "Melhor", new: "Novo",
    viewAll: "Ver Todos os Cursos", beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado",
    lessons: "lições", minutes: "min", earn: "Ganhe", bmt: "BMT",
    startCourse: "Iniciar Curso", continueCourse: "Continuar", completed: "Concluído", enrolled: "matriculados",
    search: "Pesquisar cursos...", filter: "Filtrar", all: "Todos",
    fundamentals: "Fundamentos", development: "Desenvolvimento", defi: "DeFi",
    noCoursesFound: "Nenhum curso encontrado"
  },
  dashboard: {
    title: "Meu Painel", welcome: "Bem-vindo de volta", yourProgress: "Seu Progresso",
    totalEarned: "Total Ganho", coursesCompleted: "Cursos Concluídos", certificates: "Certificados",
    currentStreak: "Sequência Atual", days: "dias", enrolledCourses: "Cursos Matriculados",
    recentActivity: "Atividade Recente", rewards: "Recompensas", rewardHistory: "Histórico",
    pending: "Pendente", confirmed: "Confirmado", failed: "Falhou",
    noCourses: "Nenhum curso matriculado", startLearning: "Começar a Aprender",
    referralProgram: "Programa de Indicação",
    referralDescription: "Compartilhe seu código e ganhe BMT!",
    yourReferralCode: "Código de Indicação", copyCode: "Copiar", codeCopied: "Copiado!",
    referralStats: "Estatísticas", totalReferrals: "Total de Indicações",
    pendingReferrals: "Pendentes", completedReferrals: "Concluídas", referralEarnings: "Ganhos"
  },
  quiz: {
    title: "Quiz do Curso", question: "Pergunta", of: "de", submit: "Enviar",
    next: "Próxima Pergunta", finish: "Finalizar Quiz", correct: "Correto!", incorrect: "Incorreto",
    score: "Sua Pontuação", passed: "Parabéns! Você passou!", failed: "Você não passou",
    retake: "Refazer Quiz", passScore: "Pontuação para Passar", yourScore: "Sua Pontuação"
  },
  about: { title: "Sobre a BMT University", mission: "Missão", vision: "Visão", team: "Equipe" },
  footer: {
    description: "Aprenda Kaspa e ganhe tokens $BMT.",
    quickLinks: "Links Rápidos", resources: "Recursos", documentation: "Documentação",
    support: "Suporte", community: "Comunidade", rights: "Todos os direitos reservados."
  },
  common: {
    loading: "Carregando...", error: "Erro", success: "Sucesso", cancel: "Cancelar",
    save: "Salvar", delete: "Excluir", edit: "Editar", back: "Voltar", next: "Próximo",
    previous: "Anterior", close: "Fechar", confirm: "Confirmar", submit: "Enviar",
    search: "Pesquisar", noResults: "Nenhum resultado", seeMore: "Ver Mais", seeLess: "Ver Menos"
  },
  language: { title: "Idioma", select: "Selecionar Idioma" }
};

const ru = {
  nav: { home: "Главная", courses: "Курсы", about: "О нас", dashboard: "Панель", analytics: "Аналитика", admin: "Админ" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Изучай Kaspa. Зарабатывай.", subtitleHighlight: "Собирай Слёзы.",
    description: "Освойте BlockDAG и криптовалюту через подробные курсы с интерактивными тестами. Завершайте уроки, проходите тесты и зарабатывайте токены $BMT.",
    exploreCourses: "Смотреть Курсы", dashboard: "Панель",
    vpnWarning: "Отключите VPN перед подключением кошелька.",
    important: "Важно:"
  },
  stats: { courses: "Курсов", students: "Студентов", coursesCompleted: "Курсов Завершено", bmtDistributed: "Распределено $BMT" },
  wallet: {
    connect: "Подключить Кошелёк", connecting: "Подключение...", disconnect: "Отключить",
    wrongNetwork: "Переключить на IGRA", switching: "Переключение...", demoMode: "Демо-режим",
    exitDemo: "Выйти из Демо", tryDemo: "Попробовать Демо", connectionFailed: "Ошибка Подключения",
    openInWalletApp: "Открыть в Приложении",
    mobileWalletMessage: "Откройте этот сайт в браузере MetaMask или Trust Wallet.",
    noWalletFound: "Расширение кошелька не найдено.",
    connectionRejected: "Подключение отклонено.",
    networkIssue: "Проблема с настройкой сети.",
    tryAgain: "Не удалось подключить. Попробуйте ещё раз.",
    networkSwitched: "Сеть Переключена", connectedToIgra: "Подключено к IGRA Testnet",
    networkNotFound: "Сеть Не Найдена",
    addNetworkManually: "Добавьте IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Переключение Отменено", approveSwitchInWallet: "Подтвердите в кошельке.",
    switchFailed: "Ошибка Переключения", couldNotSwitch: "Не удалось переключиться на IGRA."
  },
  courses: {
    title: "Все Курсы", subtitle: "Изучите нашу полную программу",
    featured: "Популярные", featuredSubtitle: "Начните с самых популярных курсов",
    trending: "В тренде", best: "Лучшие", new: "Новые",
    viewAll: "Все Курсы", beginner: "Начинающий", intermediate: "Средний", advanced: "Продвинутый",
    lessons: "уроков", minutes: "мин", earn: "Заработок", bmt: "BMT",
    startCourse: "Начать Курс", continueCourse: "Продолжить", completed: "Завершён", enrolled: "записаны",
    search: "Поиск курсов...", filter: "Фильтр", all: "Все",
    fundamentals: "Основы", development: "Разработка", defi: "DeFi",
    noCoursesFound: "Курсы не найдены"
  },
  dashboard: {
    title: "Моя Панель", welcome: "С возвращением", yourProgress: "Ваш Прогресс",
    totalEarned: "Всего Заработано", coursesCompleted: "Курсов Завершено", certificates: "Сертификаты",
    currentStreak: "Текущая Серия", days: "дней", enrolledCourses: "Записанные Курсы",
    recentActivity: "Недавняя Активность", rewards: "Награды", rewardHistory: "История Наград",
    pending: "Ожидание", confirmed: "Подтверждено", failed: "Ошибка",
    noCourses: "Курсы не записаны", startLearning: "Начать Обучение",
    referralProgram: "Реферальная Программа",
    referralDescription: "Делитесь кодом и получайте BMT!",
    yourReferralCode: "Реферальный Код", copyCode: "Копировать", codeCopied: "Скопировано!",
    referralStats: "Статистика", totalReferrals: "Всего Рефералов",
    pendingReferrals: "Ожидание", completedReferrals: "Завершено", referralEarnings: "Доход"
  },
  quiz: {
    title: "Тест Курса", question: "Вопрос", of: "из", submit: "Отправить",
    next: "Следующий Вопрос", finish: "Завершить Тест", correct: "Правильно!", incorrect: "Неправильно",
    score: "Ваш Результат", passed: "Поздравляем! Вы прошли!", failed: "Не получилось",
    retake: "Пройти Заново", passScore: "Проходной Балл", yourScore: "Ваш Результат"
  },
  about: { title: "О BMT University", mission: "Миссия", vision: "Видение", team: "Команда" },
  footer: {
    description: "Изучайте Kaspa и зарабатывайте токены $BMT.",
    quickLinks: "Быстрые Ссылки", resources: "Ресурсы", documentation: "Документация",
    support: "Поддержка", community: "Сообщество", rights: "Все права защищены."
  },
  common: {
    loading: "Загрузка...", error: "Ошибка", success: "Успех", cancel: "Отмена",
    save: "Сохранить", delete: "Удалить", edit: "Редактировать", back: "Назад", next: "Далее",
    previous: "Назад", close: "Закрыть", confirm: "Подтвердить", submit: "Отправить",
    search: "Поиск", noResults: "Ничего не найдено", seeMore: "Показать Больше", seeLess: "Свернуть"
  },
  language: { title: "Язык", select: "Выбрать Язык" }
};

const tr = {
  nav: { home: "Ana Sayfa", courses: "Kurslar", about: "Hakkında", dashboard: "Panel", analytics: "Analiz", admin: "Yönetici" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "Kaspa Öğren. Kazan.", subtitleHighlight: "Gözyaşı Topla.",
    description: "Etkileşimli sınavlarla detaylı kurslar aracılığıyla BlockDAG ve kripto konusunda uzmanlaşın. Dersleri tamamlayın, sınavları geçin ve $BMT token kazanın.",
    exploreCourses: "Kursları Keşfet", dashboard: "Panel",
    vpnWarning: "Cüzdanınızı bağlamadan önce VPN'inizi devre dışı bırakın.",
    important: "Önemli:"
  },
  stats: { courses: "Kurs", students: "Öğrenci", coursesCompleted: "Tamamlanan Kurs", bmtDistributed: "Dağıtılan $BMT" },
  wallet: {
    connect: "Cüzdan Bağla", connecting: "Bağlanıyor...", disconnect: "Bağlantıyı Kes",
    wrongNetwork: "IGRA'ya Geç", switching: "Değiştiriliyor...", demoMode: "Demo Modu",
    exitDemo: "Demodan Çık", tryDemo: "Demo Dene", connectionFailed: "Bağlantı Başarısız",
    openInWalletApp: "Uygulamada Aç",
    mobileWalletMessage: "Bu siteyi MetaMask veya Trust Wallet tarayıcısında açın.",
    noWalletFound: "Cüzdan uzantısı bulunamadı.",
    connectionRejected: "Bağlantı reddedildi.",
    networkIssue: "Ağ yapılandırma sorunu.",
    tryAgain: "Bağlantı başarısız. Tekrar deneyin.",
    networkSwitched: "Ağ Değiştirildi", connectedToIgra: "IGRA Testnet'e bağlandı",
    networkNotFound: "Ağ Bulunamadı",
    addNetworkManually: "IGRA Testnet'i ekleyin: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "Geçiş İptal Edildi", approveSwitchInWallet: "Cüzdanınızda onaylayın.",
    switchFailed: "Geçiş Başarısız", couldNotSwitch: "IGRA'ya geçilemedi."
  },
  courses: {
    title: "Tüm Kurslar", subtitle: "Kapsamlı müfredatımızı keşfedin",
    featured: "Öne Çıkan", featuredSubtitle: "En popüler kurslarımızla başlayın",
    trending: "Popüler", best: "En İyi", new: "Yeni",
    viewAll: "Tüm Kursları Gör", beginner: "Başlangıç", intermediate: "Orta", advanced: "İleri",
    lessons: "ders", minutes: "dk", earn: "Kazan", bmt: "BMT",
    startCourse: "Kursa Başla", continueCourse: "Devam Et", completed: "Tamamlandı", enrolled: "kayıtlı",
    search: "Kurs ara...", filter: "Filtrele", all: "Tümü",
    fundamentals: "Temel", development: "Geliştirme", defi: "DeFi",
    noCoursesFound: "Kurs bulunamadı"
  },
  dashboard: {
    title: "Panelim", welcome: "Tekrar hoş geldiniz", yourProgress: "İlerlemeniz",
    totalEarned: "Toplam Kazanç", coursesCompleted: "Tamamlanan Kurslar", certificates: "Sertifikalar",
    currentStreak: "Mevcut Seri", days: "gün", enrolledCourses: "Kayıtlı Kurslar",
    recentActivity: "Son Aktivite", rewards: "Ödüller", rewardHistory: "Ödül Geçmişi",
    pending: "Beklemede", confirmed: "Onaylandı", failed: "Başarısız",
    noCourses: "Kayıtlı kurs yok", startLearning: "Öğrenmeye Başla",
    referralProgram: "Referans Programı",
    referralDescription: "Kodunuzu paylaşın ve BMT kazanın!",
    yourReferralCode: "Referans Kodunuz", copyCode: "Kopyala", codeCopied: "Kopyalandı!",
    referralStats: "İstatistikler", totalReferrals: "Toplam Referans",
    pendingReferrals: "Beklemede", completedReferrals: "Tamamlandı", referralEarnings: "Kazanç"
  },
  quiz: {
    title: "Kurs Sınavı", question: "Soru", of: "/", submit: "Gönder",
    next: "Sonraki Soru", finish: "Sınavı Bitir", correct: "Doğru!", incorrect: "Yanlış",
    score: "Puanınız", passed: "Tebrikler! Geçtiniz!", failed: "Geçemediniz",
    retake: "Yeniden Dene", passScore: "Geçme Puanı", yourScore: "Puanınız"
  },
  about: { title: "BMT University Hakkında", mission: "Misyon", vision: "Vizyon", team: "Ekip" },
  footer: {
    description: "Kaspa öğrenin ve $BMT token kazanın.",
    quickLinks: "Hızlı Bağlantılar", resources: "Kaynaklar", documentation: "Dokümantasyon",
    support: "Destek", community: "Topluluk", rights: "Tüm hakları saklıdır."
  },
  common: {
    loading: "Yükleniyor...", error: "Hata", success: "Başarılı", cancel: "İptal",
    save: "Kaydet", delete: "Sil", edit: "Düzenle", back: "Geri", next: "İleri",
    previous: "Önceki", close: "Kapat", confirm: "Onayla", submit: "Gönder",
    search: "Ara", noResults: "Sonuç bulunamadı", seeMore: "Daha Fazla", seeLess: "Daha Az"
  },
  language: { title: "Dil", select: "Dil Seç" }
};

const ar = {
  nav: { home: "الرئيسية", courses: "الدورات", about: "حول", dashboard: "لوحة التحكم", analytics: "التحليلات", admin: "الإدارة" },
  hero: {
    title: "BMT", titleHighlight: "UNIVERSITY", subtitle: "تعلم Kaspa. اكسب.", subtitleHighlight: "اجمع الدموع.",
    description: "أتقن BlockDAG والعملات المشفرة من خلال دورات تفصيلية مع اختبارات تفاعلية. أكمل الدروس واجتز الاختبارات واكسب رموز $BMT.",
    exploreCourses: "استكشف الدورات", dashboard: "لوحة التحكم",
    vpnWarning: "يرجى تعطيل VPN قبل ربط محفظتك.",
    important: "مهم:"
  },
  stats: { courses: "دورات", students: "طلاب", coursesCompleted: "دورات مكتملة", bmtDistributed: "$BMT موزعة" },
  wallet: {
    connect: "ربط المحفظة", connecting: "جاري الاتصال...", disconnect: "قطع الاتصال",
    wrongNetwork: "التبديل إلى IGRA", switching: "جاري التبديل...", demoMode: "وضع التجريبي",
    exitDemo: "الخروج من التجريبي", tryDemo: "جرب التجريبي", connectionFailed: "فشل الاتصال",
    openInWalletApp: "فتح في التطبيق",
    mobileWalletMessage: "افتح هذا الموقع في متصفح MetaMask أو Trust Wallet.",
    noWalletFound: "لم يتم العثور على محفظة.",
    connectionRejected: "تم رفض الاتصال.",
    networkIssue: "مشكلة في الإعدادات.",
    tryAgain: "فشل الاتصال. حاول مرة أخرى.",
    networkSwitched: "تم تبديل الشبكة", connectedToIgra: "متصل بـ IGRA Testnet",
    networkNotFound: "الشبكة غير موجودة",
    addNetworkManually: "أضف IGRA Testnet: RPC https://rpc.kasplex.org, Chain ID 202555",
    switchCancelled: "تم إلغاء التبديل", approveSwitchInWallet: "وافق في محفظتك.",
    switchFailed: "فشل التبديل", couldNotSwitch: "تعذر التبديل إلى IGRA."
  },
  courses: {
    title: "جميع الدورات", subtitle: "استكشف منهجنا الشامل",
    featured: "مميزة", featuredSubtitle: "ابدأ بأكثر دوراتنا شعبية",
    trending: "رائج", best: "الأفضل", new: "جديد",
    viewAll: "عرض جميع الدورات", beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم",
    lessons: "دروس", minutes: "دقيقة", earn: "اكسب", bmt: "BMT",
    startCourse: "ابدأ الدورة", continueCourse: "متابعة", completed: "مكتمل", enrolled: "مسجل",
    search: "البحث...", filter: "تصفية", all: "الكل",
    fundamentals: "الأساسيات", development: "التطوير", defi: "DeFi",
    noCoursesFound: "لم يتم العثور على دورات"
  },
  dashboard: {
    title: "لوحة التحكم", welcome: "مرحباً بعودتك", yourProgress: "تقدمك",
    totalEarned: "إجمالي الأرباح", coursesCompleted: "الدورات المكتملة", certificates: "الشهادات",
    currentStreak: "السلسلة الحالية", days: "أيام", enrolledCourses: "الدورات المسجلة",
    recentActivity: "النشاط الأخير", rewards: "المكافآت", rewardHistory: "سجل المكافآت",
    pending: "قيد الانتظار", confirmed: "مؤكد", failed: "فشل",
    noCourses: "لم تسجل في أي دورات", startLearning: "ابدأ التعلم",
    referralProgram: "برنامج الإحالة",
    referralDescription: "شارك رمزك واكسب BMT!",
    yourReferralCode: "رمز الإحالة", copyCode: "نسخ", codeCopied: "تم النسخ!",
    referralStats: "إحصائيات", totalReferrals: "إجمالي الإحالات",
    pendingReferrals: "قيد الانتظار", completedReferrals: "مكتملة", referralEarnings: "أرباح"
  },
  quiz: {
    title: "اختبار الدورة", question: "السؤال", of: "من", submit: "إرسال",
    next: "السؤال التالي", finish: "إنهاء الاختبار", correct: "صحيح!", incorrect: "خطأ",
    score: "نتيجتك", passed: "تهانينا! لقد نجحت!", failed: "لم تنجح",
    retake: "إعادة الاختبار", passScore: "درجة النجاح", yourScore: "درجتك"
  },
  about: { title: "حول BMT University", mission: "مهمتنا", vision: "رؤيتنا", team: "فريقنا" },
  footer: {
    description: "تعلم Kaspa واكسب رموز $BMT.",
    quickLinks: "روابط سريعة", resources: "الموارد", documentation: "التوثيق",
    support: "الدعم", community: "المجتمع", rights: "جميع الحقوق محفوظة."
  },
  common: {
    loading: "جاري التحميل...", error: "خطأ", success: "نجاح", cancel: "إلغاء",
    save: "حفظ", delete: "حذف", edit: "تعديل", back: "رجوع", next: "التالي",
    previous: "السابق", close: "إغلاق", confirm: "تأكيد", submit: "إرسال",
    search: "بحث", noResults: "لا توجد نتائج", seeMore: "المزيد", seeLess: "أقل"
  },
  language: { title: "اللغة", select: "اختر اللغة" }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt },
      ru: { translation: ru },
      tr: { translation: tr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
