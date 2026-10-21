/**
 * InterestMate — Data Store (IndexedDB)
 * 100% On-Device Mobile Storage.
 * Handles persistent offline storage: User Accounts, Loans, Payments, Documents, and Audit Trail.
 * Strictly zero cloud sync — private & secure on this mobile device.
 */

const Store = (() => {
  'use strict';

  const DB_NAME = 'InterestMateDB';
  const DB_VERSION = 2;
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      // Request persistent device storage on mobile
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {});
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;

        // User Accounts (Device-only)
        if (!d.objectStoreNames.contains('accounts')) {
          const accs = d.createObjectStore('accounts', { keyPath: 'id' });
          accs.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Loans
        if (!d.objectStoreNames.contains('loans')) {
          const ls = d.createObjectStore('loans', { keyPath: 'id' });
          ls.createIndex('status', 'status', { unique: false });
          ls.createIndex('createdAt', 'createdAt', { unique: false });
          ls.createIndex('accountId', 'accountId', { unique: false });
        } else {
          const ls = e.target.transaction.objectStore('loans');
          if (!ls.indexNames.contains('accountId')) {
            ls.createIndex('accountId', 'accountId', { unique: false });
          }
        }

        // Payments
        if (!d.objectStoreNames.contains('payments')) {
          const ps = d.createObjectStore('payments', { keyPath: 'id' });
          ps.createIndex('loanId', 'loanId', { unique: false });
          ps.createIndex('date', 'date', { unique: false });
          ps.createIndex('accountId', 'accountId', { unique: false });
        } else {
          const ps = e.target.transaction.objectStore('payments');
          if (!ps.indexNames.contains('accountId')) {
            ps.createIndex('accountId', 'accountId', { unique: false });
          }
        }

        // Documents
        if (!d.objectStoreNames.contains('documents')) {
          const ds = d.createObjectStore('documents', { keyPath: 'id' });
          ds.createIndex('loanId', 'loanId', { unique: false });
          ds.createIndex('accountId', 'accountId', { unique: false });
        } else {
          const ds = e.target.transaction.objectStore('documents');
          if (!ds.indexNames.contains('accountId')) {
            ds.createIndex('accountId', 'accountId', { unique: false });
          }
        }

        // Audit events
        if (!d.objectStoreNames.contains('audit')) {
          const as2 = d.createObjectStore('audit', { keyPath: 'id' });
          as2.createIndex('loanId', 'loanId', { unique: false });
          as2.createIndex('accountId', 'accountId', { unique: false });
          as2.createIndex('timestamp', 'timestamp', { unique: false });
        } else {
          const as2 = e.target.transaction.objectStore('audit');
          if (!as2.indexNames.contains('accountId')) {
            as2.createIndex('accountId', 'accountId', { unique: false });
          }
        }

        // Settings
        if (!d.objectStoreNames.contains('settings')) {
          d.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // ─── Generic CRUD ─────────────────────────────────────────

  async function getAll(storeName) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getById(storeName, id) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(storeName, obj) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(obj);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(storeName, id) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function getByIndex(storeName, indexName, value) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── User Accounts (100% Device Local) ─────────────────────

  const ACTIVE_ACCOUNT_KEY = 'interestmate_active_account_id';

  async function getAccounts() {
    return await getAll('accounts');
  }

  async function getActiveAccount() {
    const accounts = await getAccounts();
    if (!accounts || accounts.length === 0) return null;
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    let active = accounts.find(a => a.id === activeId);
    if (!active) {
      active = accounts[0];
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, active.id);
    }
    return active;
  }

  async function setActiveAccount(id) {
    const acc = await getById('accounts', id);
    if (!acc) throw new Error('Account not found');
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
    localStorage.setItem('interestmate_username', acc.name);
    return acc;
  }

  async function createAccount(data) {
    const existing = await getAll('accounts');
    const account = {
      id: 'acc_' + generateId(),
      name: data.name ? data.name.trim() : 'My Account',
      phone: data.phone ? data.phone.trim() : '',
      pin: data.pin ? data.pin.trim() : '',
      color: data.color || '#1A6FE8',
      isDefault: existing.length === 0,
      createdAt: new Date().toISOString()
    };
    await put('accounts', account);
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);
    localStorage.setItem('interestmate_username', account.name);
    await addAuditEvent(null, 'account_created', `Local account "${account.name}" registered on device`);
    return account;
  }

  async function updateAccount(id, updates) {
    const acc = await getById('accounts', id);
    if (!acc) throw new Error('Account not found');
    Object.assign(acc, updates, { updatedAt: new Date().toISOString() });
    await put('accounts', acc);
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (activeId === id && updates.name) {
      localStorage.setItem('interestmate_username', updates.name);
    }
    return acc;
  }

  async function deleteAccount(id) {
    const accounts = await getAccounts();
    if (accounts.length <= 1) {
      throw new Error('Cannot delete the only account on device');
    }

    // Delete all loans and payments belonging to this account
    const allLoans = await getAll('loans');
    for (const l of allLoans) {
      if (l.accountId === id) {
        await remove('loans', l.id);
      }
    }

    await remove('accounts', id);

    // If active account was deleted, switch to the first available
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (activeId === id) {
      const remaining = accounts.filter(a => a.id !== id);
      await setActiveAccount(remaining[0].id);
    }
    return true;
  }

  // ─── Loan Operations (Filtered by Active Account) ─────────

  async function getLoansForActiveAccount() {
    const activeAcc = await getActiveAccount();
    const all = await getAll('loans');
    // Match loans belonging to active account, or loans without accountId for legacy primary account
    return all.filter(l => !l.accountId || l.accountId === activeAcc.id);
  }

  async function createLoan(data) {
    const activeAcc = await getActiveAccount();
    const loan = {
      id: generateId(),
      accountId: activeAcc.id,
      ref: 'LN-' + Date.now().toString().slice(-6),
      counterparty: data.counterparty || '',
      counterpartyType: data.counterpartyType || 'borrower',
      principal: Number(data.principal),
      rate: Number(data.rate),
      ratePeriod: data.ratePeriod || 'monthly',
      interestMethod: data.interestMethod || 'simple',
      compoundFrequency: data.compoundFrequency || 'monthly',
      dayCountConvention: data.dayCountConvention || 'actual/365',
      allocationPolicy: data.allocationPolicy || 'interest-first',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || null,
      status: data.status || 'active',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      termsSnapshot: null,
      closedAt: null,
      closureType: null,
      closureReason: null
    };
    await put('loans', loan);
    await addAuditEvent(loan.id, 'loan_created', `Loan ${loan.ref} created in ${activeAcc.name}'s account`);
    return loan;
  }

  async function startLoan(loanId, effectiveDate) {
    const loan = await getById('loans', loanId);
    if (!loan || loan.status !== 'draft') throw new Error('Only draft loans can be started');
    loan.status = 'active';
    loan.startDate = effectiveDate || new Date().toISOString().split('T')[0];
    loan.termsSnapshot = {
      principal: loan.principal,
      rate: loan.rate,
      ratePeriod: loan.ratePeriod,
      interestMethod: loan.interestMethod,
      compoundFrequency: loan.compoundFrequency,
      dayCountConvention: loan.dayCountConvention,
      allocationPolicy: loan.allocationPolicy,
      startDate: loan.startDate,
      frozenAt: new Date().toISOString()
    };
    loan.updatedAt = new Date().toISOString();
    await put('loans', loan);
    await addAuditEvent(loanId, 'loan_started', `Loan started with effective date ${loan.startDate}`);
    return loan;
  }

  async function closeLoan(loanId, closingDate, closureType, reason) {
    const loan = await getById('loans', loanId);
    if (!loan || loan.status !== 'active') throw new Error('Only active loans can be closed');
    loan.status = closureType === 'settled' ? 'closed-settled' : 'closed-outstanding';
    loan.closedAt = closingDate;
    loan.closureType = closureType;
    loan.closureReason = reason || '';
    loan.updatedAt = new Date().toISOString();
    await put('loans', loan);
    const typeLabel = closureType === 'settled' ? 'Settled' : 'Closed with outstanding balance';
    await addAuditEvent(loanId, 'loan_closed', `${typeLabel}: ${reason || 'No reason provided'}`);
    return loan;
  }

  async function updateLoan(loanId, updates) {
    const loan = await getById('loans', loanId);
    if (!loan) throw new Error('Loan not found');
    Object.assign(loan, updates, { updatedAt: new Date().toISOString() });
    await put('loans', loan);
    return loan;
  }

  // ─── Payments ─────────────────────────────────────────────

  async function recordPayment(data) {
    const activeAcc = await getActiveAccount();
    // Idempotency check
    const existing = await getByIndex('payments', 'loanId', data.loanId);
    const isDuplicate = existing.some(p =>
      p.date === data.date &&
      Number(p.amount) === Number(data.amount) &&
      p.reference === (data.reference || '')
    );
    if (isDuplicate) throw new Error('Duplicate payment detected');

    const payment = {
      id: generateId(),
      accountId: activeAcc.id,
      loanId: data.loanId,
      date: data.date,
      amount: Number(data.amount),
      currency: 'INR',
      reference: data.reference || '',
      notes: data.notes || '',
      allocation: data.allocation || 'interest-first',
      createdAt: new Date().toISOString(),
      reversed: false
    };
    await put('payments', payment);
    await addAuditEvent(data.loanId, 'payment_recorded',
      `Payment of ₹${Number(data.amount).toLocaleString('en-IN')} on ${data.date}`);
    return payment;
  }

  async function reversePayment(paymentId, reason) {
    const payment = await getById('payments', paymentId);
    if (!payment) throw new Error('Payment not found');
    payment.reversed = true;
    payment.reversedAt = new Date().toISOString();
    payment.reversalReason = reason;
    await put('payments', payment);

    const reversal = {
      id: generateId(),
      accountId: payment.accountId,
      loanId: payment.loanId,
      date: payment.date,
      amount: -payment.amount,
      currency: 'INR',
      reference: `REV-${payment.id}`,
      notes: `Reversal: ${reason}`,
      allocation: payment.allocation,
      createdAt: new Date().toISOString(),
      reversed: false,
      isReversal: true,
      originalPaymentId: paymentId
    };
    await put('payments', reversal);
    await addAuditEvent(payment.loanId, 'payment_reversed',
      `Payment ${payment.reference || payment.id} reversed: ${reason}`);
    return reversal;
  }

  async function getLoanPayments(loanId) {
    const payments = await getByIndex('payments', 'loanId', loanId);
    return payments.filter(p => !p.reversed).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // ─── Documents ────────────────────────────────────────────

  async function saveDocument(data) {
    const activeAcc = await getActiveAccount();
    const doc = {
      id: generateId(),
      accountId: activeAcc.id,
      loanId: data.loanId,
      title: data.title || 'Untitled Document',
      type: data.type || 'promise-bond',
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileData: data.fileData, // base64
      referenceNumber: data.referenceNumber || '',
      executionDate: data.executionDate || '',
      maturityDate: data.maturityDate || '',
      parties: data.parties || '',
      principalStated: data.principalStated || '',
      witnessDetails: data.witnessDetails || '',
      notes: data.notes || '',
      verificationStatus: 'unreviewed',
      uploadedAt: new Date().toISOString(),
      versions: []
    };
    await put('documents', doc);
    await addAuditEvent(data.loanId, 'document_uploaded', `Document "${doc.title}" uploaded`);
    return doc;
  }

  async function getLoanDocuments(loanId) {
    return getByIndex('documents', 'loanId', loanId);
  }

  // ─── Audit ────────────────────────────────────────────────

  async function addAuditEvent(loanId, action, description) {
    const activeAcc = await getActiveAccount();
    const event = {
      id: generateId(),
      accountId: activeAcc ? activeAcc.id : null,
      loanId: loanId || null,
      action,
      description,
      timestamp: new Date().toISOString(),
      user: activeAcc ? activeAcc.name : 'Owner'
    };
    await put('audit', event);
    return event;
  }

  async function getLoanAudit(loanId) {
    const events = await getByIndex('audit', 'loanId', loanId);
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async function getAllAudit() {
    const activeAcc = await getActiveAccount();
    const events = await getAll('audit');
    return events
      .filter(e => !e.accountId || e.accountId === activeAcc.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // ─── Aggregates for Active Account ────────────────────────

  async function getDashboardStats() {
    const loans = await getLoansForActiveAccount();
    // Include all active loans and any non-settled loans with remaining principal
    const active = loans.filter(l => l.status === 'active' || l.status === 'closed-outstanding' || (l.status === 'draft' && l.principal > 0));
    const today = new Date().toISOString().split('T')[0];
    let totalOutstanding = 0;
    let totalInterest = 0;
    let moneyLentPaise = 0;
    let moneyBorrowedPaise = 0;
    let lentPrincipalPaise = 0;
    let borrowedPrincipalPaise = 0;
    let lentInterestPaise = 0;
    let borrowedInterestPaise = 0;
    let activeLentCount = 0;
    let activeBorrowedCount = 0;

    for (const loan of active) {
      const payments = await getLoanPayments(loan.id);
      loan.payments = payments;
      const pos = CalcEngine.calculateLoanPosition(loan, today);
      totalOutstanding += pos.totalOutstandingPaise;
      totalInterest += pos.unpaidInterestPaise;

      if (loan.counterpartyType === 'lender') {
        moneyBorrowedPaise += pos.totalOutstandingPaise;
        borrowedPrincipalPaise += pos.outstandingPrincipalPaise;
        borrowedInterestPaise += pos.unpaidInterestPaise;
        activeBorrowedCount++;
      } else {
        moneyLentPaise += pos.totalOutstandingPaise;
        lentPrincipalPaise += pos.outstandingPrincipalPaise;
        lentInterestPaise += pos.unpaidInterestPaise;
        activeLentCount++;
      }
    }

    const settled = loans.filter(l => l.status === 'closed-settled');
    const overdue = active.filter(l => l.dueDate && l.dueDate < today);
    const upcoming = active.filter(l => {
      if (!l.dueDate) return false;
      const diff = CalcEngine.daysBetween(today, l.dueDate);
      return diff >= 0 && diff <= 30;
    });

    // Payments this month for current account
    const activeAcc = await getActiveAccount();
    const allPayments = await getAll('payments');
    const monthStart = today.slice(0, 7) + '-01';
    const monthPayments = allPayments.filter(p =>
      (!p.accountId || (activeAcc && p.accountId === activeAcc.id)) &&
      !p.reversed && p.date >= monthStart && p.date <= today
    );
    const paymentsThisMonth = monthPayments.reduce((s, p) => s + CalcEngine.toPaise(p.amount), 0);

    // Net portfolio balance: Lent (asset) minus Borrowed (liability)
    const netBalancePaise = moneyLentPaise - moneyBorrowedPaise;

    return {
      activeCount: active.length,
      activeLentCount,
      activeBorrowedCount,
      totalOutstandingPaise: totalOutstanding,
      totalInterestPaise: totalInterest,
      moneyLentPaise,
      moneyBorrowedPaise,
      lentPrincipalPaise,
      borrowedPrincipalPaise,
      lentInterestPaise,
      borrowedInterestPaise,
      netBalancePaise,
      settledCount: settled.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      paymentsThisMonthPaise: paymentsThisMonth,
      totalLoans: loans.length,
      recentLoans: loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      overdueLoans: overdue,
      upcomingLoans: upcoming
    };
  }

  async function importBackup(backupData) {
    if (!backupData) throw new Error('Invalid backup file');
    const d = await open();
    for (const acc of backupData.accounts || []) {
      await put('accounts', acc);
    }
    for (const loan of backupData.loans || []) {
      await put('loans', loan);
    }
    for (const p of backupData.payments || []) {
      await put('payments', p);
    }
    for (const doc of backupData.documents || []) {
      await put('documents', doc);
    }
    for (const a of backupData.audit || []) {
      await put('audit', a);
    }
    await addAuditEvent(null, 'backup_restored', `Restored ${backupData.loans ? backupData.loans.length : 0} loans to phone storage`);
    return true;
  }

  return {
    open,
    generateId,
    getAll,
    getById,
    put,
    remove,
    getAccounts,
    getActiveAccount,
    setActiveAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    getLoansForActiveAccount,
    createLoan,
    startLoan,
    closeLoan,
    updateLoan,
    recordPayment,
    reversePayment,
    getLoanPayments,
    saveDocument,
    getLoanDocuments,
    addAuditEvent,
    getLoanAudit,
    getAllAudit,
    getDashboardStats,
    importBackup
  };
})();

if (typeof module !== 'undefined') module.exports = Store;
