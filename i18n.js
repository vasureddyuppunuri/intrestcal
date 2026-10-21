/**
 * InterestMate — Internationalization (i18n) Engine
 * Full multi-language support: English, Telugu, Hindi, Tamil, Kannada, Marathi.
 */

const I18n = (() => {
  'use strict';

  const STORAGE_KEY = 'interestmate_language';
  let currentLang = 'en';
  const listeners = [];

  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' }
  ];

  const translations = {
    en: {
      appName: 'InterestMate',
      tagline: 'Personal Loan & Interest Tracker',
      welcome: 'Welcome to InterestMate',
      helloUser: 'Hello, Friend',
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      myBalance: 'My Net Balance',
      totalDue: 'Total Accrued / Due',
      payNow: 'Pay Now',
      recordPayment: 'Record Payment',
      newLoan: 'New Loan',
      createLoan: 'Create Loan',
      seeMore: 'See More',
      viewDetails: 'View Details',
      searchPlaceholder: 'Search loans, borrowers, reference...',
      searchDocs: 'Search documents...',

      // Tabs & Navigation
      navHome: 'Home',
      navCalc: 'Calculator',
      navLoans: 'Loans',
      navBonds: 'Bonds',
      navSettings: 'Settings',

      // Filter Chips
      filterAll: 'All',
      filterActive: 'Active',
      filterLent: 'Money Lent',
      filterBorrowed: 'Money Borrowed',
      filterSettled: 'Settled',
      filterDraft: 'Draft',
      filterOutstanding: 'Outstanding',

      // Dashboard Stats & Categories
      accountsHeader: 'Categories & Balances',
      activeLoans: 'Active Loans',
      outstandingPrincipal: 'Outstanding Principal',
      accruedInterest: 'Accrued Interest',
      thisMonth: 'This Month Paid',
      moneyLent: 'Money Lent',
      moneyBorrowed: 'Money Borrowed',
      settledLoans: 'Settled Loans',
      noActiveLoans: 'NO ACTIVE LOANS YET',
      noActiveSub: 'Add your first loan to begin tracking principal, interest, and promise bonds.',
      recentLoans: 'Recent Loans',
      recentActivity: 'Recent Activity',
      viewAll: 'View All',
      noLoansYet: 'No loans added yet',
      noLoansDesc: 'Start by creating your first loan record or calculating interest.',
      noActivity: 'No recent activity',

      // Calculator Page
      calculatorTitle: 'Interest Calculator',
      calculatorSubtitle: 'Instant, audit-grade calculation with step-by-step breakdown',
      principalAmount: 'Principal Amount',
      interestRate: 'Interest Rate',
      ratePeriod: 'Rate Period',
      monthly: 'Monthly',
      annual: 'Annual',
      daily: 'Daily',
      interestMethod: 'Interest Method',
      simpleInterest: 'Simple Interest',
      compoundInterest: 'Compound Interest',
      startDate: 'Start Date',
      endDate: 'Calculation / End Date',
      dayCount: 'Day-Count Convention',
      compoundingFreq: 'Compounding Frequency',
      quarterly: 'Quarterly',
      halfYearly: 'Half-Yearly',
      calculateBtn: 'Calculate Interest',
      calcBreakdown: 'Calculation Breakdown',
      totalInterest: 'Total Interest',
      totalMaturity: 'Total Maturity Amount',
      elapsedTime: 'Elapsed Time',
      saveAsDraft: 'Save as Draft Loan',
      days: 'days',
      months: 'months',
      years: 'years',

      // Loans Page
      loanRef: 'Reference',
      counterparty: 'Counterparty',
      counterpartyType: 'Loan Type',
      borrower: 'Lent to (Borrower)',
      lender: 'Borrowed from (Lender)',
      status: 'Status',
      actions: 'Actions',
      dueDate: 'Due Date',
      notStarted: 'Not started',
      noBondsLinked: 'No bond linked',
      bondLinked: 'Promise Bond Linked',

      // Loan Details
      backToLoans: 'Back to Loans',
      startLoan: 'Start Loan',
      closeLoan: 'Close Loan',
      addRepayment: 'Record Repayment',
      uploadBond: 'Upload Promise Bond',
      loanOverview: 'Loan Overview',
      paymentHistory: 'Repayment History',
      linkedDocs: 'Promise Bonds & Documents',
      auditHistory: 'Audit History',
      noPaymentsRecorded: 'No repayments recorded yet',
      noDocsUploaded: 'No documents attached yet',

      // Settlement Dialog
      settleLoanTitle: 'Close Loan / Settlement Review',
      settleConfirmMsg: 'Review the final payoff calculation before closing this loan.',
      confirmSettlement: 'Confirm Settlement & Close',
      closeOutstanding: 'Close with Outstanding Balance',
      cancel: 'Cancel',
      confirm: 'Confirm',

      // Settings
      settingsTitle: 'Settings & Data',
      settingsSubtitle: 'Manage preferences, languages, and offline backups',
      languageOption: 'Language / భాష / भाषा',
      accountOption: 'My Local Accounts',
      switchAccount: 'Switch Account',
      createAccount: 'Create New Account',
      noCloudNotice: '100% On-Device Account — Zero Cloud Sync',
      allTransactions: 'All Transactions',
      auditTrail: 'Audit Trail',
      exportData: 'Backup Data to Device',
      importData: 'Import Backup',
      aboutApp: 'About InterestMate',
      versionInfo: 'Version 1.2 (Deterministic Engine)',
      legalNotice: 'Private recordkeeping tool. Deterministic math with paise accuracy. Not legal or financial advice.',

      // Toasts & Alerts
      loanCreatedSuccess: 'Loan created successfully as draft',
      loanStartedSuccess: 'Loan started successfully',
      loanClosedSuccess: 'Loan closed successfully',
      paymentSavedSuccess: 'Payment recorded successfully',
      docSavedSuccess: 'Document attached successfully',
      invalidDates: 'End date must be on or after start date',
      enterValidPrincipal: 'Please enter a valid principal amount',
      enterValidRate: 'Please enter a valid interest rate',
      languageChanged: 'Language changed successfully',
      accountSwitched: 'Switched to account'
    },

    te: {
      appName: 'ఇంట్రెస్ట్ మేట్',
      tagline: 'రుణాలు & వడ్డీ లెక్కల సహాయకుడు',
      welcome: 'ఇంట్రెస్ట్ మేట్‌కి స్వాగతం',
      helloUser: 'నమస్కారం, మిత్రమా',
      goodMorning: 'శుభోదయం',
      goodAfternoon: 'శుభ మధ్యాహ్నం',
      goodEvening: 'శుభ సాయంత్రం',
      myBalance: 'మొత్తం బ్యాలెన్స్',
      totalDue: 'రావలసిన వడ్డీ / బకాయి',
      payNow: 'చెల్లించండి',
      recordPayment: 'చెల్లింపు నమోదు',
      newLoan: 'కొత్త రుణం',
      createLoan: 'రుణం సృష్టించండి',
      seeMore: 'వివరాలు చూడండి',
      viewDetails: 'పూర్తి వివరాలు',
      searchPlaceholder: 'రుణాలు, వ్యక్తులు, నంబర్ వెతకండి...',
      searchDocs: 'పత్రాలు వెతకండి...',

      // Tabs & Navigation
      navHome: 'హోమ్',
      navCalc: 'కాలిక్యులేటర్',
      navLoans: 'రుణాలు',
      navBonds: 'ప్రామిసరీ బాండ్లు',
      navSettings: 'సెట్టింగ్స్',

      // Filter Chips
      filterAll: 'అన్నీ',
      filterActive: 'యాక్టివ్',
      filterLent: 'నేను ఇచ్చినవి',
      filterBorrowed: 'నేను తీసుకున్నవి',
      filterSettled: 'పూర్తయినవి',
      filterDraft: 'డ్రాఫ్ట్',
      filterOutstanding: 'బకాయి ఉన్నవి',

      // Dashboard Stats & Categories
      accountsHeader: 'రుణ వర్గాలు & నిధులు',
      activeLoans: 'నడుస్తున్న రుణాలు',
      outstandingPrincipal: 'అసలు బకాయి',
      accruedInterest: 'వచ్చిన వడ్డీ',
      thisMonth: 'ఈ నెల వసూలు',
      moneyLent: 'నేను ఇచ్చిన సొమ్ము',
      moneyBorrowed: 'తీసుకున్న రుణం',
      settledLoans: 'పరిష్కరించబడినవి',
      noActiveLoans: 'ప్రస్తుతం రుణాలు ఏవీ లేవు',
      noActiveSub: 'అసలు, వడ్డీ మరియు ప్రామిసరీ బాండ్లను లెక్కించడానికి మీ మొదటి రుణాన్ని జోడించండి.',
      recentLoans: 'ఇటీవలి రుణాలు',
      recentActivity: 'ఇటీవలి కార్యకలాపాలు',
      viewAll: 'అన్నీ చూడండి',
      noLoansYet: 'ఇంకా రుణాలు ఏవీ లేవు',
      noLoansDesc: 'కొత్త రుణం సృష్టించి లేదా వడ్డీ లెక్కించి ప్రారంభించండి.',
      noActivity: 'ఏమీ కార్యకలాపాలు లేవు',

      // Calculator Page
      calculatorTitle: 'వడ్డీ కాలిక్యులేటర్',
      calculatorSubtitle: 'పైసలతో సహా కచ్చితమైన, వేగవంతమైన వడ్డీ లెక్కింపు',
      principalAmount: 'అసలు మొత్తం (రూ.)',
      interestRate: 'వడ్డీ రేటు (నూటికి)',
      ratePeriod: 'వడ్డీ వ్యవధి',
      monthly: 'నెలవారీ (వడ్డీ నూటికి)',
      annual: 'వార్షిక (సంవత్సరానికి)',
      daily: 'రోజువారీ',
      interestMethod: 'వడ్డీ పద్ధతి',
      simpleInterest: 'సాధారణ వడ్డీ (బారు వడ్డీ)',
      compoundInterest: 'చక్రవడ్డీ',
      startDate: 'ప్రారంభ తేదీ',
      endDate: 'ముగింపు / లెక్కింపు తేదీ',
      dayCount: 'రోజుల లెక్కింపు విధానం',
      compoundingFreq: 'చక్రవడ్డీ వ్యవధి',
      quarterly: 'త్రైమాసిక (3 నెలలు)',
      halfYearly: 'అర్ధ-వార్షిక (6 నెలలు)',
      calculateBtn: 'వడ్డీ లెక్కించండి',
      calcBreakdown: 'లెక్కింపు వివరాలు',
      totalInterest: 'మొత్తం వడ్డీ',
      totalMaturity: 'మొత్తం చెల్లించాల్సినది (అసలు + వడ్డీ)',
      elapsedTime: 'గడిచిన సమయం',
      saveAsDraft: 'డ్రాఫ్ట్ రుణంగా దాచండి',
      days: 'రోజులు',
      months: 'నెలలు',
      years: 'సంవత్సరాలు',

      // Loans Page
      loanRef: 'రెఫరెన్స్ నంబర్',
      counterparty: 'వ్యక్తి / పార్టీ',
      counterpartyType: 'రుణం రకం',
      borrower: 'ఇచ్చిన వ్యక్తి (తీసుకున్నవాడు)',
      lender: 'తీసుకున్న వ్యక్తి (ఇచ్చినవాడు)',
      status: 'స్థితి',
      actions: 'చర్యలు',
      dueDate: 'గడువు తేదీ',
      notStarted: 'ప్రారంభం కాలేదు',
      noBondsLinked: 'బాండ్ జతచేయబడలేదు',
      bondLinked: 'ప్రామిసరీ బాండ్ జతచేయబడింది',

      // Loan Details
      backToLoans: 'తిరిగి రుణాల జాబితాకు',
      startLoan: 'రుణం ప్రారంభించు',
      closeLoan: 'రుణం ముగించు',
      addRepayment: 'చెల్లింపు నమోదు',
      uploadBond: 'బాండ్ పత్రం అప్‌లోడ్',
      loanOverview: 'రుణ సారాంశం',
      paymentHistory: 'చెల్లింపుల చరిత్ర',
      linkedDocs: 'జతచేసిన బాండ్లు & పత్రాలు',
      auditHistory: 'ఆడిట్ రికార్డు',
      noPaymentsRecorded: 'ఇంకా ఎలాంటి చెల్లింపులు నమోదు కాలేదు',
      noDocsUploaded: 'ఇంకా ఎలాంటి పత్రాలు అప్‌లోడ్ చేయలేదు',

      // Settlement Dialog
      settleLoanTitle: 'రుణ పరిష్కారం / ముగింపు సమీక్ష',
      settleConfirmMsg: 'రుణాన్ని పూర్తిగా ముగించే ముందు లెక్కలను సమీక్షించండి.',
      confirmSettlement: 'చెల్లింపు పూర్తయింది - ముగించండి',
      closeOutstanding: 'మిగిలిన బకాయితో ముగించండి',
      cancel: 'రద్దు',
      confirm: 'ధృవీకరించండి',

      // Settings
      settingsTitle: 'సెట్టింగ్స్ & డేటా',
      settingsSubtitle: 'భాష, ప్రాధాన్యతలు మరియు బ్యాకప్ నిర్వహణ',
      languageOption: 'భాష ఎంపిక (Language)',
      accountOption: 'నా స్థానిక ఖాతాలు (డివైస్ మాత్రమే)',
      switchAccount: 'ఖాతా మార్చండి',
      createAccount: 'కొత్త ఖాతాను సృష్టించండి',
      noCloudNotice: '100% మీ ఫోన్‌లోనే సురక్షితం — క్లౌడ్ అవసరం లేదు',
      allTransactions: 'అన్ని లావాదేవీలు',
      auditTrail: 'ఆడిట్ ట్రయిల్ (చరిత్ర)',
      exportData: 'డేటా బ్యాకప్ సేవ్ చేయండి',
      importData: 'బ్యాకప్ దిగుమతి',
      aboutApp: 'ఇంట్రెస్ట్ మేట్ గురించి',
      versionInfo: 'వెర్షన్ 1.2 (ఖచ్చితమైన గణన యంత్రం)',
      legalNotice: 'వ్యక్తిగత రికార్డుల సాధనం. పైసల ఖచ్చితత్వంతో పనిచేస్తుంది.',

      // Toasts & Alerts
      loanCreatedSuccess: 'రుణం విజయవంతంగా డ్రాఫ్ట్‌గా సృష్టించబడింది',
      loanStartedSuccess: 'రుణం విజయవంతంగా ప్రారంభించబడింది',
      loanClosedSuccess: 'రుణం విజయవంతంగా ముగించబడింది',
      paymentSavedSuccess: 'చెల్లింపు నమోదు చేయబడింది',
      docSavedSuccess: 'పత్రం జతచేయబడింది',
      invalidDates: 'ముగింపు తేదీ ప్రారంభ తేదీ కంటే తర్వాత ఉండాలి',
      enterValidPrincipal: 'దయచేసి సరైన అసలు మొత్తాన్ని నమోదు చేయండి',
      enterValidRate: 'దయచేసి సరైన వడ్డీ రేటును నమోదు చేయండి',
      languageChanged: 'భాష విజయవంతంగా మార్చబడింది',
      accountSwitched: 'ఖాతా మార్చబడింది'
    },

    hi: {
      appName: 'इंटरेस्टमेट',
      tagline: 'ऋण और ब्याज का सटीक हिसाब',
      welcome: 'इंटरेस्टमेट में आपका स्वागत है',
      helloUser: 'नमस्ते, साथी',
      goodMorning: 'शुभ प्रभात',
      goodAfternoon: 'शुभ दोपहर',
      goodEvening: 'शुभ संध्या',
      myBalance: 'कुल शेष राशि',
      totalDue: 'कुल देय ब्याज / बकाया',
      payNow: 'भुगतान करें',
      recordPayment: 'भुगतान दर्ज करें',
      newLoan: 'नया ऋण',
      createLoan: 'ऋण बनाएं',
      seeMore: 'विवरण देखें',
      viewDetails: 'पूरा विवरण',
      searchPlaceholder: 'ऋण, नाम या संदर्भ खोजें...',
      searchDocs: 'दस्तावेज़ खोजें...',

      // Tabs & Navigation
      navHome: 'होम',
      navCalc: 'कैलकुलेटर',
      navLoans: 'ऋण सूची',
      navBonds: 'प्रॉमिसरी बॉन्ड',
      navSettings: 'सेटिंग्स',

      // Filter Chips
      filterAll: 'सभी',
      filterActive: 'सक्रिय',
      filterLent: 'दिया गया धन',
      filterBorrowed: 'लिया गया ऋण',
      filterSettled: 'निपटारा हुआ',
      filterDraft: 'ड्राफ्ट',
      filterOutstanding: 'बकाया',

      // Dashboard Stats & Categories
      accountsHeader: 'खाता श्रेणियां और शेष',
      activeLoans: 'सक्रिय ऋण',
      outstandingPrincipal: 'बकाया मूलधन',
      accruedInterest: 'अर्जित ब्याज',
      thisMonth: 'इस महीने भुगतान',
      moneyLent: 'दिया गया कर्ज',
      moneyBorrowed: 'लिया गया कर्ज',
      settledLoans: 'पूर्ण ऋण',
      noActiveLoans: 'वर्तमान में कोई ऋण सक्रिय नहीं है',
      noActiveSub: 'मूलधन, ब्याज और बॉन्ड का हिसाब रखने के लिए अपना पहला ऋण जोड़ें।',
      recentLoans: 'हाल के ऋण',
      recentActivity: 'हाल की गतिविधि',
      viewAll: 'सभी देखें',
      noLoansYet: 'अभी कोई ऋण नहीं जोड़ा गया',
      noLoansDesc: 'पहला ऋण बनाकर या ब्याज की गणना करके शुरुआत करें।',
      noActivity: 'कोई गतिविधि नहीं',

      // Calculator Page
      calculatorTitle: 'ब्याज कैलकुलेटर',
      calculatorSubtitle: 'पैसे-पैसे का सटीक और त्वरित ब्याज हिसाब',
      principalAmount: 'मूलधन राशि (₹)',
      interestRate: 'ब्याज दर (%)',
      ratePeriod: 'ब्याज अवधि',
      monthly: 'मासिक (सैकड़ा प्रति माह)',
      annual: 'वार्षिक (प्रति वर्ष)',
      daily: 'दैनिक',
      interestMethod: 'ब्याज पद्धति',
      simpleInterest: 'साधारण ब्याज',
      compoundInterest: 'चक्रवृद्धि ब्याज',
      startDate: 'आरंभ तिथि',
      endDate: 'गणना / अंतिम तिथि',
      dayCount: 'दिन गणना नियम',
      compoundingFreq: 'चक्रवृद्धि आवृत्ति',
      quarterly: 'त्रैमासिक',
      halfYearly: 'अर्ध-वार्षिक',
      calculateBtn: 'ब्याज की गणना करें',
      calcBreakdown: 'गणना का पूरा विवरण',
      totalInterest: 'कुल ब्याज',
      totalMaturity: 'कुल देय राशि (मूलधन + ब्याज)',
      elapsedTime: 'बीता हुआ समय',
      saveAsDraft: 'ड्राफ्ट के रूप में सहेजें',
      days: 'दिन',
      months: 'महीने',
      years: 'वर्ष',

      // Loans Page
      loanRef: 'ऋण संदर्भ',
      counterparty: 'व्यक्ति / पक्षकार',
      counterpartyType: 'ऋण प्रकार',
      borrower: 'उधारकर्ता (जिसको दिया)',
      lender: 'ऋणदाता (जिससे लिया)',
      status: 'स्थिति',
      actions: 'कार्रवाई',
      dueDate: 'नियत तिथि',
      notStarted: 'शुरू नहीं हुआ',
      noBondsLinked: 'कोई बॉन्ड संलग्न नहीं',
      bondLinked: 'प्रॉमिसरी बॉन्ड संलग्न है',

      // Loan Details
      backToLoans: 'ऋण सूची पर वापस',
      startLoan: 'ऋण प्रारंभ करें',
      closeLoan: 'ऋण बंद करें',
      addRepayment: 'भुगतान दर्ज करें',
      uploadBond: 'बॉन्ड दस्तावेज़ अपलोड करें',
      loanOverview: 'ऋण अवलोकन',
      paymentHistory: 'भुगतान इतिहास',
      linkedDocs: 'संलग्न बॉन्ड और दस्तावेज़',
      auditHistory: 'ऑडिट इतिहास',
      noPaymentsRecorded: 'अभी तक कोई भुगतान दर्ज नहीं हुआ',
      noDocsUploaded: 'कोई दस्तावेज़ संलग्न नहीं है',

      // Settlement Dialog
      settleLoanTitle: 'ऋण निपटान / समापन समीक्षा',
      settleConfirmMsg: 'ऋण को बंद करने से पहले अंतिम गणना की समीक्षा करें।',
      confirmSettlement: 'निपटान की पुष्टि करें और बंद करें',
      closeOutstanding: 'बकाया राशि के साथ बंद करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',

      // Settings
      settingsTitle: 'सेटिंग्स और डेटा',
      settingsSubtitle: 'भाषा, प्राथमिकताएं और ऑफ़लाइन बैकअप',
      languageOption: 'भाषा चुनें (Select Language)',
      accountOption: 'मेरे लोकल खाते (केवल डिवाइस)',
      switchAccount: 'खाता बदलें',
      createAccount: 'नया खाता बनाएं',
      noCloudNotice: '100% केवल आपके फ़ोन में सुरक्षित — कोई क्लाउड नहीं',
      allTransactions: 'सभी लेन-देन',
      auditTrail: 'ऑडिट ट्रेल',
      exportData: 'डेटा बैकअप सुरक्षित करें',
      importData: 'बैकअप आयात करें',
      aboutApp: 'ऐप के बारे में',
      versionInfo: 'संस्करण 1.2 (सटीक वित्तीय इंजन)',
      legalNotice: 'निजी रिकॉर्ड रखने का टूल। पाई-पाई की शुद्धता।',

      // Toasts & Alerts
      loanCreatedSuccess: 'ऋण सफलतापूर्वक ड्राफ्ट के रूप में बना',
      loanStartedSuccess: 'ऋण प्रारंभ हो चुका है',
      loanClosedSuccess: 'ऋण सफलतापूर्वक बंद कर दिया गया',
      paymentSavedSuccess: 'भुगतान सफलतापूर्वक दर्ज किया गया',
      docSavedSuccess: 'दस्तावेज़ सफलतापूर्वक संलग्न हुआ',
      invalidDates: 'अंतिम तिथि आरंभ तिथि के बाद होनी चाहिए',
      enterValidPrincipal: 'कृपया एक वैध मूलधन राशि दर्ज करें',
      enterValidRate: 'कृपया एक वैध ब्याज दर दर्ज करें',
      languageChanged: 'भाषा सफलतापूर्वक बदल दी गई',
      accountSwitched: 'खाता सफलतापूर्वक बदला गया'
    },

    ta: {
      appName: 'இன்ட்ரஸ்ட்மேட்',
      tagline: 'கடன் மற்றும் வட்டி கண்காணிப்பாளர்',
      welcome: 'இன்ட்ரஸ்ட்மேட்டிற்கு வரவேற்கிறோம்',
      helloUser: 'வணக்கம், நண்பரே',
      goodMorning: 'காலை வணக்கம்',
      goodAfternoon: 'மதிய வணக்கம்',
      goodEvening: 'மாலை வணக்கம்',
      myBalance: 'மொத்த இருப்பு',
      totalDue: 'மொத்த வட்டி / நிலுவை',
      payNow: 'செலுத்துக',
      recordPayment: 'பணம் பதிவு செய்',
      newLoan: 'புதிய கடன்',
      createLoan: 'கடன் உருவாக்கு',
      seeMore: 'விவரம் பார்',
      viewDetails: 'முழு விவரங்கள்',
      searchPlaceholder: 'தேடுக...',
      searchDocs: 'ஆவணங்களை தேடுக...',

      navHome: 'முகப்பு',
      navCalc: 'கால்குலேட்டர்',
      navLoans: 'கடன்கள்',
      navBonds: 'பாண்டுகள்',
      navSettings: 'அமைப்புகள்',

      filterAll: 'அனைத்தும்',
      filterActive: 'செயலில் உள்ளவை',
      filterLent: 'கொடுத்த கடன்',
      filterBorrowed: 'வாங்கிய கடன்',
      filterSettled: 'முடிவுற்றவை',
      filterDraft: 'வரைவு',
      filterOutstanding: 'நிலுவை',

      accountsHeader: 'கடன் வகைகள் & இருப்பு',
      activeLoans: 'செயலில் உள்ள கடன்கள்',
      outstandingPrincipal: 'அசல் நிலுவை',
      accruedInterest: 'திரண்ட வட்டி',
      thisMonth: 'இந்த மாதம்',
      moneyLent: 'கொடுத்த தொகை',
      moneyBorrowed: 'வாங்கிய தொகை',
      settledLoans: 'முடிக்கப்பட்ட கடன்கள்',
      noActiveLoans: 'தற்போது கடன்கள் எதுவும் இல்லை',
      noActiveSub: 'உங்கள் முதல் கடனைச் சேர்க்கவும்.',
      recentLoans: 'சமீபத்திய கடன்கள்',
      recentActivity: 'சமீபத்திய செயல்பாடுகள்',
      viewAll: 'அனைத்தும் காண்க',
      noLoansYet: 'கடன்கள் எதுவும் இல்லை',
      noLoansDesc: 'புதிய கடனை உருவாக்கித் தொடங்குங்கள்.',
      noActivity: 'செயல்பாடுகள் இல்லை',

      calculatorTitle: 'வட்டி கால்குலேட்டர்',
      calculatorSubtitle: 'துல்லியமான வட்டி கணக்கீடு',
      principalAmount: 'அசல் தொகை (₹)',
      interestRate: 'வட்டி விகிதம் (%)',
      ratePeriod: 'வட்டி காலம்',
      monthly: 'மாதாந்திர (நூற்றுக்கு)',
      annual: 'ஆண்டுக்கு',
      daily: 'தினசரி',
      interestMethod: 'வட்டி முறை',
      simpleInterest: 'தனி வட்டி',
      compoundInterest: 'கூட்டு வட்டி',
      startDate: 'தொடக்க தேதி',
      endDate: 'முடிவு தேதி',
      dayCount: 'நாட்கள் கணக்கீட்டு முறை',
      compoundingFreq: 'கூட்டு வட்டி இடைவெளி',
      quarterly: 'காலாண்டு',
      halfYearly: 'அரையாண்டு',
      calculateBtn: 'வட்டியைக் கணக்கிடு',
      calcBreakdown: 'கணக்கீட்டு விவரங்கள்',
      totalInterest: 'மொத்த வட்டி',
      totalMaturity: 'மொத்த தொகை (அசல் + வட்டி)',
      elapsedTime: 'கடந்த காலம்',
      saveAsDraft: 'வரைவாக சேமி',
      days: 'நாட்கள்',
      months: 'மாதங்கள்',
      years: 'ஆண்டுகள்',

      loanRef: 'குறிப்பு எண்',
      counterparty: 'நபர் / கட்சி',
      counterpartyType: 'கடன் வகை',
      borrower: 'கடனாளி (பெற்றவர்)',
      lender: 'கடன் கொடுத்தவர்',
      status: 'நிலை',
      actions: 'செயல்கள்',
      dueDate: 'தவணை தேதி',
      notStarted: 'தொடங்கப்படவில்லை',
      noBondsLinked: 'பத்திரம் இணைக்கப்படவில்லை',
      bondLinked: 'பிராமிசரி பத்திரம் இணைக்கப்பட்டது',

      backToLoans: 'கடன்களுக்கு திரும்பு',
      startLoan: 'கடன் தொடங்கு',
      closeLoan: 'கடன் முடி',
      addRepayment: 'செலுத்துதலைப் பதிவு செய்',
      uploadBond: 'பத்திரம் பதிவேற்று',
      loanOverview: 'கடன் மேலோட்டம்',
      paymentHistory: 'பணம் செலுத்திய வரலாறு',
      linkedDocs: 'இணைக்கப்பட்ட ஆவணங்கள்',
      auditHistory: 'தணிக்கை வரலாறு',
      noPaymentsRecorded: 'பணம் செலுத்துதல் எதுவும் இல்லை',
      noDocsUploaded: 'ஆவணங்கள் எதுவும் இல்லை',

      settleLoanTitle: 'கடன் தீர்வு / நிறைவு மதிப்பாய்வு',
      settleConfirmMsg: 'கடனை முடிப்பதற்கு முன் இறுதி கணக்கீட்டை மதிப்பாய்வு செய்யவும்.',
      confirmSettlement: 'தீர்வை உறுதி செய்து முடி',
      closeOutstanding: 'நிலுவையுடன் முடி',
      cancel: 'ரத்து',
      confirm: 'உறுதி செய்',

      settingsTitle: 'அமைப்புகள் & தரவு',
      settingsSubtitle: 'விருப்பங்கள் மற்றும் மொழி மாற்றம்',
      languageOption: 'மொழியைத் தேர்ந்தெடுக்கவும்',
      accountOption: 'என் சாதன கணக்குகள்',
      switchAccount: 'கணக்கை மாற்று',
      createAccount: 'புதிய கணக்கை உருவாக்கு',
      noCloudNotice: '100% சாதனத்தில் மட்டுமே — கிளவுட் இல்லை',
      allTransactions: 'அனைத்து பரிவர்த்தனைகள்',
      auditTrail: 'தணிக்கை பாதை',
      exportData: 'காப்புப் பிரதி சேமிக்கவும்',
      importData: 'காப்புப் பிரதி இறக்குமதி',
      aboutApp: 'பற்றி',
      versionInfo: 'பதிப்பு 1.2 (துல்லிய கணக்கீடு)',
      legalNotice: 'தனிப்பட்ட பதிவு கருவி. துல்லியமான பைசா கணக்கீடு.',

      loanCreatedSuccess: 'கடன் வெற்றிகரமாக உருவாக்கப்பட்டது',
      loanStartedSuccess: 'கடன் தொடங்கப்பட்டது',
      loanClosedSuccess: 'கடன் முடிக்கப்பட்டது',
      paymentSavedSuccess: 'பணம் செலுத்துதல் பதிவு செய்யப்பட்டது',
      docSavedSuccess: 'ஆவணம் இணைக்கப்பட்டது',
      invalidDates: 'முடிவு தேதி தொடக்க தேதிக்கு பிறகு இருக்க வேண்டும்',
      enterValidPrincipal: 'சரியான அசல் தொகையை உள்ளிடவும்',
      enterValidRate: 'சரியான வட்டி விகிதத்தை உள்ளிடவும்',
      languageChanged: 'மொழி வெற்றிகரமாக மாற்றப்பட்டது',
      accountSwitched: 'கணக்கு மாற்றப்பட்டது'
    },

    kn: {
      appName: 'ಇಂಟರೆಸ್ಟ್‌ಮೇಟ್',
      tagline: 'ಸಾಲ ಮತ್ತು ಬಡ್ಡಿ ಟ್ರ್ಯಾಕರ್',
      welcome: 'ಇಂಟರೆಸ್ಟ್‌ಮೇಟ್‌ಗೆ ಸುಸ್ವಾಗತ',
      helloUser: 'ನಮಸ್ಕಾರ, ಸ್ನೇಹಿತರೆ',
      goodMorning: 'ಶುಭೋದಯ',
      goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
      goodEvening: 'ಶುಭ ಸಂಜೆ',
      myBalance: 'ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತ',
      totalDue: 'ಒಟ್ಟು ಬಡ್ಡಿ / ಬಾಕಿ',
      payNow: 'ಪಾವತಿಸಿ',
      recordPayment: 'ಪಾವತಿ ದಾಖಲಿಸಿ',
      newLoan: 'ಹೊಸ ಸಾಲ',
      createLoan: 'ಸಾಲ ರಚಿಸಿ',
      seeMore: 'ವಿವರ ನೋಡಿ',
      viewDetails: 'ಪೂರ್ಣ ವಿವರಗಳು',
      searchPlaceholder: 'ಹುಡುಕಿ...',
      searchDocs: 'ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ...',

      navHome: 'ಮುಖಪುಟ',
      navCalc: 'ಕ್ಯಾಲ್ಕುಲೇಟರ್',
      navLoans: 'ಸಾಲಗಳು',
      navBonds: 'ಬಾಂಡ್‌ಗಳು',
      navSettings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',

      filterAll: 'ಎಲ್ಲವೂ',
      filterActive: 'ಸಕ್ರಿಯ',
      filterLent: 'ನೀಡಿದ ಸಾಲ',
      filterBorrowed: 'ಪಡೆದ ಸಾಲ',
      filterSettled: 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ',
      filterDraft: 'ಡ್ರಾಫ್ಟ್',
      filterOutstanding: 'ಬಾಕಿ',

      accountsHeader: 'ಖಾತೆಗಳು ಮತ್ತು ಬಾಕಿ ವಿವರ',
      activeLoans: 'ಸಕ್ರಿಯ ಸಾಲಗಳು',
      outstandingPrincipal: 'ಅಸಲು ಬಾಕಿ',
      accruedInterest: 'ಬಂದ ಬಡ್ಡಿ',
      thisMonth: 'ಈ ತಿಂಗಳು',
      moneyLent: 'ನೀಡಿದ ಸಾಲ',
      moneyBorrowed: 'ತೆಗೆದುಕೊಂಡ ಸಾಲ',
      settledLoans: 'ಪೂರ್ಣಗೊಂಡ ಸಾಲಗಳು',
      noActiveLoans: 'ಯಾವುದೇ ಸಕ್ರಿಯ ಸಾಲಗಳಿಲ್ಲ',
      noActiveSub: 'ನಿಮ್ಮ ಮೊದಲ ಸಾಲವನ್ನು ಸೇರಿಸಿ ಲೆಕ್ಕ ಪ್ರಾರಂಭಿಸಿ.',
      recentLoans: 'ಇತ್ತೀಚಿನ ಸಾಲಗಳು',
      recentActivity: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
      viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
      noLoansYet: 'ಇನ್ನೂ ಯಾವುದೇ ಸಾಲಗಳಿಲ್ಲ',
      noLoansDesc: 'ಹೊಸ ಸಾಲವನ್ನು ರಚಿಸಿ ಪ್ರಾರಂಭಿಸಿ.',
      noActivity: 'ಯಾವುದೇ ಚಟುವಟಿಕೆ ಇಲ್ಲ',

      calculatorTitle: 'ಬಡ್ಡಿ ಕ್ಯಾಲ್ಕುಲೇಟರ್',
      calculatorSubtitle: 'ನಿಖರವಾದ ಬಡ್ಡಿ ಲೆಕ್ಕಾಚಾರ',
      principalAmount: 'ಅಸಲು ಮೊತ್ತ (₹)',
      interestRate: 'ಬಡ್ಡಿ ದರ (%)',
      ratePeriod: 'ಬಡ್ಡಿ ಅವಧಿ',
      monthly: 'ಮಾಸಿಕ (ನೂರಕ್ಕೆ ಪ್ರತಿ ತಿಂಗಳು)',
      annual: 'ವಾರ್ಷಿಕ (ವರ್ಷಕ್ಕೆ)',
      daily: 'ದೈನಂದಿನ',
      interestMethod: 'ಬಡ್ಡಿ ವಿಧಾನ',
      simpleInterest: 'ಸರಳ ಬಡ್ಡಿ',
      compoundInterest: 'ಚಕ್ರಬಡ್ಡಿ',
      startDate: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ',
      endDate: 'ಮುಕ್ತಾಯ ದಿನಾಂಕ',
      dayCount: 'ದಿನಗಳ ಎಣಿಕೆ ವಿಧಾನ',
      compoundingFreq: 'ಚಕ್ರಬಡ್ಡಿ ಆವರ್ತನ',
      quarterly: 'ತ್ರೈಮಾಸಿಕ',
      halfYearly: 'ಅರ್ಧವಾರ್ಷಿಕ',
      calculateBtn: 'ಬಡ್ಡಿ ಲೆಕ್ಕ ಹಾಕಿ',
      calcBreakdown: 'ಲೆಕ್ಕಾಚಾರದ ವಿವರಗಳು',
      totalInterest: 'ಒಟ್ಟು ಬಡ್ಡಿ',
      totalMaturity: 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ',
      elapsedTime: 'ಕಳೆದ ಸಮಯ',
      saveAsDraft: 'ಡ್ರಾಫ್ಟ್ ಆಗಿ ಉಳಿಸಿ',
      days: 'ದಿನಗಳು',
      months: 'ತಿಂಗಳುಗಳು',
      years: 'ವರ್ಷಗಳು',

      loanRef: 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ',
      counterparty: 'ವ್ಯಕ್ತಿ / ಪಾರ್ಟಿ',
      counterpartyType: 'ಸಾಲದ ಪ್ರಕಾರ',
      borrower: 'ಸಾಲಗಾರ (ಪಡೆದವರು)',
      lender: 'ಸಾಲದಾತ (ನೀಡಿದವರು)',
      status: 'ಸ್ಥಿತಿ',
      actions: 'ಕ್ರಮಗಳು',
      dueDate: 'ಗಡುವು ದಿನಾಂಕ',
      notStarted: 'ಪ್ರಾರಂಭವಾಗಿಲ್ಲ',
      noBondsLinked: 'ಯಾವುದೇ ಬಾಂಡ್ ಇಲ್ಲ',
      bondLinked: 'ಬಾಂಡ್ ಲಗತ್ತಿಸಲಾಗಿದೆ',

      backToLoans: 'ಸಾಲಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ',
      startLoan: 'ಸಾಲ ಪ್ರಾರಂಭಿಸಿ',
      closeLoan: 'ಸಾಲ ಮುಕ್ತಾಯಗೊಳಿಸಿ',
      addRepayment: 'ಪಾವತಿ ದಾಖಲಿಸಿ',
      uploadBond: 'ಬಾಂಡ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      loanOverview: 'ಸಾಲದ ಅವಲೋಕನ',
      paymentHistory: 'ಪಾವತಿ ಇತಿಹಾಸ',
      linkedDocs: 'ದಾಖಲೆಗಳು',
      auditHistory: 'ಆಡಿಟ್ ಇತಿಹಾಸ',
      noPaymentsRecorded: 'ಇನ್ನೂ ಯಾವುದೇ ಪಾವತಿ ದಾಖಲಾಗಿಲ್ಲ',
      noDocsUploaded: 'ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ',

      settleLoanTitle: 'ಸಾಲ ಮುಕ್ತಾಯ ಪರಿಶೀಲನೆ',
      settleConfirmMsg: 'ಸಾಲ ಮುಗಿಸುವ ಮುನ್ನ ಅಂತಿಮ ಲೆಕ್ಕ ಪರಿಶೀಲಿಸಿ.',
      confirmSettlement: 'ಪೂರ್ಣ ಪಾವತಿಯೊಂದಿಗೆ ಮುಕ್ತಾಯ',
      closeOutstanding: 'ಬಾಕಿ ಮೊತ್ತದೊಂದಿಗೆ ಮುಕ್ತಾಯ',
      cancel: 'ರದ್ದು',
      confirm: 'ಖಚಿತಪಡಿಸಿ',

      settingsTitle: 'ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ಡೇಟಾ',
      settingsSubtitle: 'ಭಾಷೆ ಮತ್ತು ಬ್ಯಾಕಪ್ ನಿರ್ವಹಣೆ',
      languageOption: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
      accountOption: 'ನನ್ನ ಸ್ಥಳೀಯ ಖಾತೆಗಳು',
      switchAccount: 'ಖಾತೆ ಬದಲಾಯಿಸಿ',
      createAccount: 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ',
      noCloudNotice: '100% ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಸುರಕ್ಷಿತ — ಕ್ಲೌಡ್ ಇಲ್ಲ',
      allTransactions: 'ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು',
      auditTrail: 'ಆಡಿಟ್ ವಿವರ',
      exportData: 'ಡೇಟಾ ಬ್ಯಾಕಪ್ ಉಳಿಸಿ',
      importData: 'ಬ್ಯಾಕಪ್ ಆಮದು',
      aboutApp: 'ಆಪ್ ಬಗ್ಗೆ',
      versionInfo: 'ಆವೃತ್ತಿ 1.2 (ನಿಖರ ಲೆಕ್ಕಾಚಾರ)',
      legalNotice: 'ವೈಯಕ್ತಿಕ ದಾಖಲೆಗಳ ಸಾಧನ.',

      loanCreatedSuccess: 'ಸಾಲವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ',
      loanStartedSuccess: 'ಸಾಲ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ',
      loanClosedSuccess: 'ಸಾಲ ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ',
      paymentSavedSuccess: 'ಪಾವತಿ ದಾಖಲಾಗಿದೆ',
      docSavedSuccess: 'ದಾಖಲೆ ಲಗತ್ತಿಸಲಾಗಿದೆ',
      invalidDates: 'ಮುಕ್ತಾಯ ದಿನಾಂಕ ಪ್ರಾರಂಭ ದಿನಾಂಕಕ್ಕಿಂತ ನಂತರವಿರಬೇಕು',
      enterValidPrincipal: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಅಸಲು ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ',
      enterValidRate: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಬಡ್ಡಿ ದರವನ್ನು ನಮೂದಿಸಿ',
      languageChanged: 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ',
      accountSwitched: 'ಖಾತೆ ಬದಲಾಯಿಸಲಾಗಿದೆ'
    },

    mr: {
      appName: 'इंटरेस्टमेट',
      tagline: 'कर्ज आणि व्याजाची अचूक नोंद',
      welcome: 'इंटरेस्टमेट मध्ये आपले स्वागत आहे',
      helloUser: 'नमस्कार, मित्रा',
      goodMorning: 'शुभ प्रभात',
      goodAfternoon: 'शुभ दुपार',
      goodEvening: 'शुभ संध्याकाळ',
      myBalance: 'एकूण शिल्लक',
      totalDue: 'एकूण देय व्याज / थकबाकी',
      payNow: 'पे करा',
      recordPayment: 'पेमेंट नोंदवा',
      newLoan: 'नवीन कर्ज',
      createLoan: 'कर्ज तयार करा',
      seeMore: 'तपशील पहा',
      viewDetails: 'पूर्ण तपशील',
      searchPlaceholder: 'शोधा...',
      searchDocs: 'कागदपत्रे शोधा...',

      navHome: 'होम',
      navCalc: 'कॅल्क्युलेटर',
      navLoans: 'कर्ज यादी',
      navBonds: 'प्रॉमिसरी बाँड्स',
      navSettings: 'सेटिंग्ज',

      filterAll: 'सर्व',
      filterActive: 'सक्रिय',
      filterLent: 'दिलेले कर्ज',
      filterBorrowed: 'घेतलेले कर्ज',
      filterSettled: 'पूर्ण झालेले',
      filterDraft: 'मसुदा',
      filterOutstanding: 'थकबाकी',

      accountsHeader: 'खाती आणि शिल्लक',
      activeLoans: 'सक्रिय कर्जे',
      outstandingPrincipal: 'थकबाकी मुद्दल',
      accruedInterest: 'जमा झालेले व्याज',
      thisMonth: 'या महिन्यातील भरणा',
      moneyLent: 'दिलेले पैसे',
      moneyBorrowed: 'घेतलेले पैसे',
      settledLoans: 'पूर्ण झालेली कर्जे',
      noActiveLoans: 'सध्या कोणतेही सक्रिय कर्ज नाही',
      noActiveSub: 'मुद्दल आणि व्याज ट्रॅक करण्यासाठी पहिले कर्ज जोडा.',
      recentLoans: 'अलीकडील कर्जे',
      recentActivity: 'अलीकडील हालचाली',
      viewAll: 'सर्व पहा',
      noLoansYet: 'अद्याप कोणतेही कर्ज जोडलेले नाही',
      noLoansDesc: 'नवीन कर्ज तयार करून सुरुवात करा.',
      noActivity: 'कोणतीही हालचाल नाही',

      calculatorTitle: 'व्याज कॅल्क्युलेटर',
      calculatorSubtitle: 'अचूक आणि जलद व्याज हिशोब',
      principalAmount: 'मुद्दल रक्कम (₹)',
      interestRate: 'व्याज दर (%)',
      ratePeriod: 'व्याज कालावधी',
      monthly: 'मासिक (दरमहा शेकडा)',
      annual: 'वार्षिक (प्रति वर्ष)',
      daily: 'दैनिक',
      interestMethod: 'व्याज पद्धत',
      simpleInterest: 'सरळ व्याज',
      compoundInterest: 'चक्रवाढ व्याज',
      startDate: 'सुरुवात तारीख',
      endDate: 'गणना / समाप्ती तारीख',
      dayCount: 'दिवस मोजणी नियम',
      compoundingFreq: 'चक्रवाढ वारंवारता',
      quarterly: 'त्रैमासिक',
      halfYearly: 'सहामाही',
      calculateBtn: 'व्याज मोजा',
      calcBreakdown: 'गणनेचा तपशील',
      totalInterest: 'एकूण व्याज',
      totalMaturity: 'एकूण रक्कम (मुद्दल + व्याज)',
      elapsedTime: 'उलटलेला वेळ',
      saveAsDraft: 'मसुदा म्हणून सेव्ह करा',
      days: 'दिवस',
      months: 'महिने',
      years: 'वर्षे',

      loanRef: 'संदर्भ क्रमांक',
      counterparty: 'व्यक्ती / पार्टी',
      counterpartyType: 'कर्ज प्रकार',
      borrower: 'कर्जदार (ज्याला दिले)',
      lender: 'कर्जदाता (ज्याकडून घेतले)',
      status: 'स्थिती',
      actions: 'कृती',
      dueDate: 'देय तारीख',
      notStarted: 'सुरू झाले नाही',
      noBondsLinked: 'कोणताही बाँड जोडलेला नाही',
      bondLinked: 'प्रॉमिसरी बाँड जोडला आहे',

      backToLoans: 'कर्ज यादीवर परत या',
      startLoan: 'कर्ज सुरू करा',
      closeLoan: 'कर्ज बंद करा',
      addRepayment: 'पेमेंट नोंदवा',
      uploadBond: 'बाँड कागदपत्र अपलोड करा',
      loanOverview: 'कर्ज विहंगावलोकन',
      paymentHistory: 'पेमेंट इतिहास',
      linkedDocs: 'कागदपत्रे',
      auditHistory: 'ऑडिट इतिहास',
      noPaymentsRecorded: 'अद्याप कोणतेही पेमेंट नोंदवलेले नाही',
      noDocsUploaded: 'कोणतीही कागदपत्रे नाहीत',

      settleLoanTitle: 'कर्ज निपटारा / समाप्ती पुनरावलोकन',
      settleConfirmMsg: 'कर्ज बंद करण्यापूर्वी अंतिम गणनेचे पुनरावलोकन करा.',
      confirmSettlement: 'निपटारा निश्चित करून बंद करा',
      closeOutstanding: 'थकबाकीसह बंद करा',
      cancel: 'रद्द करा',
      confirm: 'निश्चित करा',

      settingsTitle: 'सेटिंग्ज आणि डेटा',
      settingsSubtitle: 'भाषा आणि डेटा व्यवस्थापन',
      languageOption: 'भाषा निवडा',
      accountOption: 'माझी स्थानिक खाती',
      switchAccount: 'खाते बदला',
      createAccount: 'नवीन खाते तयार करा',
      noCloudNotice: '१००% केवळ डिव्हाइसवर सुरक्षित — क्लाउड नाही',
      allTransactions: 'सर्व व्यवहार',
      auditTrail: 'ऑडिट नोंद',
      exportData: 'डेटा बॅकअप सेव्ह करा',
      importData: 'बॅकअप आयात करा',
      aboutApp: 'अ‍ॅपबद्दल',
      versionInfo: 'आवृत्ती 1.2 (अचूक गणना)',
      legalNotice: 'वैयक्तिक रेकॉर्ड साधन.',

      loanCreatedSuccess: 'कर्ज यशस्वीरित्या तयार झाले',
      loanStartedSuccess: 'कर्ज सुरू झाले आहे',
      loanClosedSuccess: 'कर्ज यशस्वीरित्या बंद झाले',
      paymentSavedSuccess: 'पेमेंट नोंदवले गेले',
      docSavedSuccess: 'कागदपत्र जोडले गेले',
      invalidDates: 'समाप्ती तारीख सुरुवात तारखेनंतर असावी',
      enterValidPrincipal: 'कृपया वैध मुद्दल रक्कम प्रविष्ट करा',
      enterValidRate: 'कृपया वैध व्याज दर प्रविष्ट करा',
      languageChanged: 'भाषा यशस्वीरित्या बदलली',
      accountSwitched: 'खाते बदलले'
    }
  };

  function init() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) {
        currentLang = saved;
      }
    }
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    applyTranslations();
    listeners.forEach(fn => fn(lang));
  }

  function getLanguage() {
    return currentLang;
  }

  function getLanguages() {
    return languages;
  }

  function t(key, fallback) {
    const langDict = translations[currentLang] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback !== undefined ? fallback : key;
  }

  function onLanguageChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  function applyTranslations() {
    if (typeof document === 'undefined') return;

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    // Translate placeholder specifically
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) el.placeholder = val;
    });

    // Update active language labels in UI
    const curObj = languages.find(l => l.code === currentLang) || languages[0];
    document.querySelectorAll('.current-lang-text').forEach(el => {
      el.textContent = curObj.native;
    });
    document.querySelectorAll('.current-lang-code').forEach(el => {
      el.textContent = curObj.code.toUpperCase();
    });
  }

  init();

  return {
    t,
    setLanguage,
    getLanguage,
    getLanguages,
    onLanguageChange,
    applyTranslations
  };
})();

if (typeof module !== 'undefined') module.exports = I18n;
