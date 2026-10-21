/**
 * InterestMate — Financial Calculation Engine
 * High-performance, deterministic financial math.
 * Uses integer arithmetic (paise) to guarantee zero floating-point errors.
 * 1 INR = 100 paise. Precision: exact to 1 paisa.
 */

const CalcEngine = (() => {
  'use strict';

  // ─── Helpers ───────────────────────────────────────────────

  function toPaise(val) {
    if (val === null || val === undefined || val === '') return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const num = Number(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  function toRupees(paise) {
    return (Number(paise) || 0) / 100;
  }

  function formatINR(paise) {
    const p = Number(paise) || 0;
    const sign = p < 0 ? '-' : '';
    const absPaise = Math.abs(p);
    const rupees = Math.floor(absPaise / 100);
    const remPaise = Math.round(absPaise % 100);
    const decPart = (remPaise < 10 ? '0' : '') + remPaise;

    let intStr = rupees.toString();
    if (intStr.length > 3) {
      const last3 = intStr.slice(-3);
      let rest = intStr.slice(0, -3);
      const groups = [];
      while (rest.length > 2) {
        groups.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
      }
      if (rest.length > 0) groups.unshift(rest);
      intStr = groups.join(',') + ',' + last3;
    }
    return `${sign}₹${intStr}.${decPart}`;
  }

  function formatDate(d) {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function daysBetween(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
    return Math.max(0, diff);
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function monthsBetween(start, end) {
    if (!start || !end) return { fullMonths: 0, remainingDays: 0 };
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    if (e.getTime() <= s.getTime()) return { fullMonths: 0, remainingDays: 0 };

    const sYear = s.getFullYear();
    const sMonth = s.getMonth();
    const sDay = s.getDate();
    const eYear = e.getFullYear();
    const eMonth = e.getMonth();
    const eDay = e.getDate();

    let months = (eYear - sYear) * 12 + (eMonth - sMonth);

    if (eDay < sDay) {
      months--;
      // Days in previous month to end date
      const prevMonthLastDate = new Date(eYear, eMonth, 0).getDate();
      const effectiveStartDay = Math.min(sDay, prevMonthLastDate);
      const remainingDays = (prevMonthLastDate - effectiveStartDay) + eDay;
      return { fullMonths: Math.max(0, months), remainingDays: Math.max(0, remainingDays) };
    } else {
      return { fullMonths: Math.max(0, months), remainingDays: eDay - sDay };
    }
  }

  // Exact ISDA Actual/Actual year fraction
  function yearFractionActualActual(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    if (e.getTime() <= s.getTime()) return 0;

    const y1 = s.getFullYear();
    const y2 = e.getFullYear();
    if (y1 === y2) {
      return daysBetween(s, e) / daysInYear(y1);
    }

    const endOfFirstYear = new Date(y1, 11, 31);
    const startOfLastYear = new Date(y2, 0, 1);
    let fraction = (daysBetween(s, endOfFirstYear) + 1) / daysInYear(y1);

    for (let y = y1 + 1; y < y2; y++) {
      fraction += 1.0;
    }

    fraction += (daysBetween(startOfLastYear, e)) / daysInYear(y2);
    return fraction;
  }

  // 30/360 day count
  function days30_360(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    if (e.getTime() <= s.getTime()) return 0;
    const y1 = s.getFullYear();
    const m1 = s.getMonth() + 1;
    let d1 = s.getDate();
    const y2 = e.getFullYear();
    const m2 = e.getMonth() + 1;
    let d2 = e.getDate();

    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 >= 30) d2 = 30;

    const days = (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
    return Math.max(0, days);
  }

  // ─── Simple Interest ──────────────────────────────────────

  function simpleInterest(principalPaise, ratePercent, ratePeriod, startDate, endDate, dayCountConvention) {
    const convention = dayCountConvention || 'actual/365';
    const breakdown = {
      method: 'Simple Interest',
      principalPaise,
      ratePercent,
      ratePeriod,
      startDate,
      endDate,
      dayCountConvention: convention,
      steps: []
    };

    if (principalPaise <= 0 || ratePercent <= 0) {
      breakdown.interestPaise = 0;
      breakdown.steps.push('Principal or rate is zero — no interest accrues.');
      return breakdown;
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e.getTime() <= s.getTime()) {
      breakdown.interestPaise = 0;
      breakdown.steps.push('Calculation date is on or before start date — 0 days elapsed.');
      return breakdown;
    }

    const rate = ratePercent / 100;
    let interestPaise = 0;

    if (ratePeriod === 'monthly') {
      if (convention === '30/360') {
        const total30Days = days30_360(startDate, endDate);
        const fullMonths = Math.floor(total30Days / 30);
        const remDays = total30Days % 30;
        const monthlyInterest = Math.round(principalPaise * rate);
        const monthsInterest = monthlyInterest * fullMonths;
        const daysInterest = Math.round(monthlyInterest * remDays / 30);
        interestPaise = monthsInterest + daysInterest;

        breakdown.steps.push(`Monthly interest rate: ${ratePercent}% (${formatINR(monthlyInterest)}/month)`);
        breakdown.steps.push(`Time (30/360): ${fullMonths} months + ${remDays} days (Total ${total30Days} days)`);
        breakdown.steps.push(`Interest on full months: ${formatINR(monthsInterest)}`);
        if (remDays > 0) {
          breakdown.steps.push(`Interest on ${remDays} days (${remDays}/30): ${formatINR(daysInterest)}`);
        }
      } else {
        // Calendar months + remaining days pro-rata
        const { fullMonths, remainingDays } = monthsBetween(startDate, endDate);
        const monthlyInterest = Math.round(principalPaise * rate);
        interestPaise = monthlyInterest * fullMonths;

        breakdown.steps.push(`Monthly interest rate: ${ratePercent}% (${formatINR(monthlyInterest)}/month)`);
        breakdown.steps.push(`Elapsed full calendar months: ${fullMonths}`);

        if (remainingDays > 0) {
          const partialEnd = new Date(endDate);
          const daysInCurMonth = daysInMonth(partialEnd.getFullYear(), partialEnd.getMonth());
          const partialInterest = Math.round(monthlyInterest * remainingDays / daysInCurMonth);
          interestPaise += partialInterest;
          breakdown.steps.push(`Remaining ${remainingDays} days (pro-rated over ${daysInCurMonth} days in month): ${formatINR(partialInterest)}`);
        }
      }
    } else if (ratePeriod === 'annual') {
      let yearFraction = 0;
      const days = daysBetween(startDate, endDate);

      if (convention === 'actual/360') {
        yearFraction = days / 360;
        breakdown.steps.push(`Days elapsed: ${days}, Basis: 360 days/year (Actual/360)`);
      } else if (convention === '30/360') {
        const d30 = days30_360(startDate, endDate);
        yearFraction = d30 / 360;
        breakdown.steps.push(`Days (30/360): ${d30}, Basis: 360 days/year`);
      } else if (convention === 'actual/actual') {
        yearFraction = yearFractionActualActual(startDate, endDate);
        breakdown.steps.push(`Days elapsed: ${days}, Year fraction (ISDA Actual/Actual): ${yearFraction.toFixed(6)}`);
      } else {
        // actual/365
        yearFraction = days / 365;
        breakdown.steps.push(`Days elapsed: ${days}, Basis: 365 days/year (Actual/365)`);
      }

      interestPaise = Math.round(principalPaise * rate * yearFraction);
      breakdown.steps.push(`Formula: ${formatINR(principalPaise)} × ${ratePercent}% × ${yearFraction.toFixed(5)} yrs = ${formatINR(interestPaise)}`);
    } else {
      // daily
      const days = daysBetween(startDate, endDate);
      interestPaise = Math.round(principalPaise * rate * days);
      breakdown.steps.push(`Days elapsed: ${days}`);
      breakdown.steps.push(`Formula: ${formatINR(principalPaise)} × ${ratePercent}%/day × ${days} days = ${formatINR(interestPaise)}`);
    }

    breakdown.interestPaise = interestPaise;
    return breakdown;
  }

  // ─── Compound Interest ────────────────────────────────────

  function compoundInterest(principalPaise, ratePercent, ratePeriod, startDate, endDate, compoundFrequency, dayCountConvention) {
    const convention = dayCountConvention || 'actual/365';
    const frequency = compoundFrequency || 'monthly';
    const breakdown = {
      method: 'Compound Interest',
      principalPaise,
      ratePercent,
      ratePeriod,
      startDate,
      endDate,
      compoundFrequency: frequency,
      dayCountConvention: convention,
      steps: []
    };

    if (principalPaise <= 0 || ratePercent <= 0) {
      breakdown.interestPaise = 0;
      breakdown.steps.push('Principal or rate is zero — no interest accrues.');
      return breakdown;
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e.getTime() <= s.getTime()) {
      breakdown.interestPaise = 0;
      breakdown.steps.push('Calculation date is on or before start date — 0 days elapsed.');
      return breakdown;
    }

    const rate = ratePercent / 100;

    // Compounding periods per year
    let n = 12;
    switch (frequency) {
      case 'daily': n = 365; break;
      case 'monthly': n = 12; break;
      case 'quarterly': n = 4; break;
      case 'half-yearly': n = 2; break;
      case 'annual': n = 1; break;
      default: n = 12;
    }

    // Convert rate to nominal annual rate
    let annualNominalRate = rate;
    if (ratePeriod === 'monthly') {
      annualNominalRate = rate * 12;
      breakdown.steps.push(`Nominal annual rate: ${ratePercent}%/mo × 12 = ${(annualNominalRate * 100).toFixed(4)}%`);
    } else if (ratePeriod === 'daily') {
      annualNominalRate = rate * 365;
      breakdown.steps.push(`Nominal annual rate: ${ratePercent}%/day × 365 = ${(annualNominalRate * 100).toFixed(4)}%`);
    } else {
      breakdown.steps.push(`Annual interest rate: ${ratePercent}%`);
    }

    // Elapsed time in years (t)
    let t = 0;
    const days = daysBetween(startDate, endDate);
    if (convention === 'actual/360') {
      t = days / 360;
    } else if (convention === '30/360') {
      t = days30_360(startDate, endDate) / 360;
    } else if (convention === 'actual/actual') {
      t = yearFractionActualActual(startDate, endDate);
    } else {
      t = days / 365;
    }

    const ratePerPeriod = annualNominalRate / n;
    const totalPeriods = n * t;
    const fullPeriods = Math.floor(totalPeriods);
    const fractionalPeriod = totalPeriods - fullPeriods;

    // Compound step-by-step for full periods
    let currentAmount = principalPaise;
    for (let i = 0; i < fullPeriods; i++) {
      currentAmount = Math.round(currentAmount * (1 + ratePerPeriod));
    }

    // Simple interest pro-rata for fractional final period
    if (fractionalPeriod > 0) {
      currentAmount = Math.round(currentAmount * (1 + ratePerPeriod * fractionalPeriod));
    }

    const interestPaise = Math.max(0, currentAmount - principalPaise);
    breakdown.interestPaise = interestPaise;
    breakdown.maturityPaise = currentAmount;
    breakdown.steps.push(`Compounding frequency: ${frequency} (${n} times/year)`);
    breakdown.steps.push(`Rate per period: ${(ratePerPeriod * 100).toFixed(4)}%`);
    breakdown.steps.push(`Total compounding periods: ${fullPeriods} full + ${fractionalPeriod.toFixed(4)} partial`);
    breakdown.steps.push(`Maturity amount: ${formatINR(currentAmount)}`);
    breakdown.steps.push(`Total accrued interest: ${formatINR(interestPaise)}`);

    return breakdown;
  }

  // ─── Loan Position & Repayments ───────────────────────────

  function calculateLoanPosition(loan, asOfDate) {
    const principal = toPaise(loan.principal);
    const asOf = asOfDate || new Date().toISOString().split('T')[0];

    // Filter payments up to asOf date
    const payments = (loan.payments || [])
      .filter(p => !p.reversed && p.date && p.date <= asOf)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let outstandingPrincipal = principal;
    let totalInterestAccrued = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let currentStart = loan.startDate || asOf;
    const timeline = [];

    for (const payment of payments) {
      if (payment.date < currentStart) {
        // Payment before start or same day
      } else {
        // Accrue interest from currentStart to payment.date
        let stepResult;
        if (loan.interestMethod === 'compound') {
          stepResult = compoundInterest(outstandingPrincipal, loan.rate, loan.ratePeriod,
            currentStart, payment.date, loan.compoundFrequency || 'monthly', loan.dayCountConvention);
        } else {
          stepResult = simpleInterest(outstandingPrincipal, loan.rate, loan.ratePeriod,
            currentStart, payment.date, loan.dayCountConvention);
        }
        totalInterestAccrued += stepResult.interestPaise;
      }

      const paymentPaise = toPaise(payment.amount);
      let interestPortion = 0;
      let principalPortion = 0;

      const allocationPolicy = payment.allocation || loan.allocationPolicy || 'interest-first';
      const unpaidInterest = Math.max(0, totalInterestAccrued - totalInterestPaid);

      if (allocationPolicy === 'principal-first') {
        principalPortion = Math.min(paymentPaise, outstandingPrincipal);
        interestPortion = Math.min(paymentPaise - principalPortion, unpaidInterest);
      } else {
        // interest-first (standard)
        interestPortion = Math.min(paymentPaise, unpaidInterest);
        principalPortion = Math.min(paymentPaise - interestPortion, outstandingPrincipal);
      }

      totalInterestPaid += interestPortion;
      totalPrincipalPaid += principalPortion;
      outstandingPrincipal = Math.max(0, outstandingPrincipal - principalPortion);

      timeline.push({
        date: payment.date,
        type: 'payment',
        amount: paymentPaise,
        interestPortion,
        principalPortion,
        outstandingPrincipal,
        reference: payment.reference || '',
        notes: payment.notes || ''
      });

      currentStart = payment.date;
    }

    // Accrue interest from last event to asOfDate
    let finalBreakdown;
    if (loan.startDate && asOf > currentStart && outstandingPrincipal > 0) {
      if (loan.interestMethod === 'compound') {
        finalBreakdown = compoundInterest(outstandingPrincipal, loan.rate, loan.ratePeriod,
          currentStart, asOf, loan.compoundFrequency || 'monthly', loan.dayCountConvention);
      } else {
        finalBreakdown = simpleInterest(outstandingPrincipal, loan.rate, loan.ratePeriod,
          currentStart, asOf, loan.dayCountConvention);
      }
      totalInterestAccrued += finalBreakdown.interestPaise;
    } else {
      finalBreakdown = {
        method: loan.interestMethod === 'compound' ? 'Compound Interest' : 'Simple Interest',
        principalPaise: outstandingPrincipal,
        ratePercent: loan.rate,
        ratePeriod: loan.ratePeriod,
        startDate: currentStart,
        endDate: asOf,
        dayCountConvention: loan.dayCountConvention,
        interestPaise: 0,
        steps: ['No remaining days or zero outstanding principal.']
      };
    }

    const unpaidInterest = Math.max(0, totalInterestAccrued - totalInterestPaid);
    const totalOutstanding = outstandingPrincipal + unpaidInterest;
    const totalPaidPaise = totalPrincipalPaid + totalInterestPaid;
    const duration = getHumanDuration(loan.startDate, asOf);
    const dailyAccrual = getDailyAccrualPaise(outstandingPrincipal, loan.rate, loan.ratePeriod);

    let dueInfo = null;
    if (loan.dueDate) {
      if (asOf < loan.dueDate) {
        const left = daysBetween(asOf, loan.dueDate);
        dueInfo = { status: 'upcoming', days: left, badge: `Due in ${left} days (${formatDate(loan.dueDate)})`, isOverdue: false };
      } else if (asOf === loan.dueDate) {
        dueInfo = { status: 'today', days: 0, badge: 'Due Today!', isOverdue: false };
      } else {
        const overdue = daysBetween(loan.dueDate, asOf);
        dueInfo = { status: 'overdue', days: overdue, badge: `Overdue by ${overdue} days!`, isOverdue: true };
      }
    }

    return {
      principalPaise: principal,
      outstandingPrincipalPaise: outstandingPrincipal,
      totalInterestAccruedPaise: totalInterestAccrued,
      totalInterestPaidPaise: totalInterestPaid,
      unpaidInterestPaise: unpaidInterest,
      totalPrincipalPaidPaise: totalPrincipalPaid,
      totalOutstandingPaise: totalOutstanding,
      totalPaidPaise,
      timeline,
      duration,
      dailyAccrualPaise: dailyAccrual,
      dueInfo,
      calculationBreakdown: finalBreakdown,
      asOfDate: asOf
    };
  }

  // ─── Human Duration & Elder Helpers ───────────────────────

  function getHumanDuration(start, end) {
    if (!start || !end) return { totalDays: 0, text: '0 days', breakdownText: '0 days', runningBadge: '0 days' };
    const days = daysBetween(start, end);
    const { fullMonths, remainingDays } = monthsBetween(start, end);

    const years = Math.floor(fullMonths / 12);
    const months = fullMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} ${remainingDays === 1 ? 'Day' : 'Days'}`);

    const breakdownText = parts.join(', ');
    return {
      totalDays: days,
      fullMonths,
      remainingDays,
      years,
      breakdownText,
      runningBadge: `${days} Days Running (${breakdownText})`
    };
  }

  function getDailyAccrualPaise(principalPaise, ratePercent, ratePeriod) {
    if (!principalPaise || !ratePercent) return 0;
    const rate = ratePercent / 100;
    if (ratePeriod === 'monthly') {
      return Math.round((principalPaise * rate) / 30);
    } else if (ratePeriod === 'annual') {
      return Math.round((principalPaise * rate) / 365);
    } else {
      return Math.round(principalPaise * rate);
    }
  }

  function getElderExplanation(principalPaise, ratePercent, ratePeriod) {
    const p = Math.round((principalPaise || 0) / 100);
    const monthlyRate = ratePeriod === 'monthly' ? ratePercent : (ratePeriod === 'annual' ? (ratePercent / 12) : (ratePercent * 30));
    const monthlyInterest = Math.round(p * (monthlyRate / 100));
    const dailyInterest = Math.round(monthlyInterest / 30);

    const formattedP = '₹' + p.toLocaleString('en-IN');
    const formattedMonthly = '₹' + monthlyInterest.toLocaleString('en-IN');
    const formattedDaily = '₹' + dailyInterest.toLocaleString('en-IN');

    return {
      monthlyInterest,
      dailyInterest,
      formattedP,
      formattedMonthly,
      formattedDaily,
      explanationEn: `For every ₹100, the interest is ₹${ratePercent}/month. On ${formattedP}, interest is ${formattedMonthly}/month (about ${formattedDaily}/day).`,
      explanationTe: `ప్రతి నూటికి నెలకు ₹${ratePercent} వడ్డీ. ${formattedP} అసలుకు నెలకు ${formattedMonthly} వడ్డీ అవుతుంది (రోజుకు సుమారు ${formattedDaily}).`,
      explanationHi: `हर ₹100 पर ₹${ratePercent} प्रति माह ब्याज। ${formattedP} मूलधन पर प्रति माह ${formattedMonthly} (लगभग ${formattedDaily}/दिन)।`,
      explanationTa: `ஒவ்வொரு ₹100க்கும் மாதம் ₹${ratePercent} வட்டி. ${formattedP} அசலுக்கு மாதம் ${formattedMonthly} (ஒரு நாளைக்கு ${formattedDaily}).`,
      explanationKn: `ಪ್ರತಿ ₹100ಕ್ಕೆ ತಿಂಗಳಿಗೆ ₹${ratePercent} ಬಡ್ಡಿ. ${formattedP} ಅಸಲಿಗೆ ತಿಂಗಳಿಗೆ ${formattedMonthly} (ದಿನಕ್ಕೆ ಸುಮಾರು ${formattedDaily}).`,
      explanationMr: `दर ₹100 वर दरमहा ₹${ratePercent} व्याज. ${formattedP} मुद्दलावर दरमहा ${formattedMonthly} (दररोज ${formattedDaily}).`
    };
  }

  // ─── Settlement Calculation ───────────────────────────────

  function calculateSettlement(loan, closingDate) {
    const position = calculateLoanPosition(loan, closingDate);
    const isFullySettled = position.totalOutstandingPaise <= 0;
    return {
      ...position,
      closingDate,
      isFullySettled,
      settlementAmountPaise: position.totalOutstandingPaise
    };
  }

  return {
    toPaise,
    toRupees,
    formatINR,
    formatDate,
    daysBetween,
    monthsBetween,
    days30_360,
    getHumanDuration,
    getDailyAccrualPaise,
    getElderExplanation,
    simpleInterest,
    compoundInterest,
    calculateLoanPosition,
    calculateSettlement
  };
})();

if (typeof module !== 'undefined') module.exports = CalcEngine;
