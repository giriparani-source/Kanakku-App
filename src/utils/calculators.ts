// ==============================================================================
// FINANCIAL CALCULATORS UTILITY MODULE
// ==============================================================================

export interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  principalPercentage: number;
  interestPercentage: number;
}

export interface AmortizationYear {
  year: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  closingBalance: number;
}

export interface SipYearGrowth {
  year: number;
  investedCapital: number;
  interestEarned: number;
  futureValue: number;
}

export interface SipResult {
  totalInvested: number;
  estimatedReturns: number;
  totalMaturityValue: number;
  wealthMultiplier: number;
  inflationAdjustedValue: number; // At 6% inflation
  yearlyBreakdown: SipYearGrowth[];
}

export interface GoalResult {
  targetAmount: number;
  timeframeYears: number;
  expectedReturnRate: number;
  requiredMonthlySavings: number;
  totalInvestment: number;
  interestBenefit: number;
}

export interface LumpSumResult {
  initialInvestment: number;
  totalInterest: number;
  maturityAmount: number;
  wealthMultiplier: number;
  inflationAdjustedValue: number;
  yearlyBreakdown: { year: number; balance: number; interestEarned: number }[];
}

/**
 * Calculates Equated Monthly Installment (EMI), Total Interest, and Total Payable.
 * Formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export const calculateEmi = (
  principal: number,
  annualRate: number,
  tenureYears: number
): EmiResult => {
  if (principal <= 0 || tenureYears <= 0) {
    return {
      monthlyEmi: 0,
      totalInterest: 0,
      totalPayment: 0,
      principalPercentage: 100,
      interestPercentage: 0,
    };
  }

  if (annualRate <= 0) {
    const totalMonths = tenureYears * 12;
    const emi = principal / totalMonths;
    return {
      monthlyEmi: Math.round(emi),
      totalInterest: 0,
      totalPayment: principal,
      principalPercentage: 100,
      interestPercentage: 0,
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  const principalPercentage = Math.round((principal / totalPayment) * 100);
  const interestPercentage = 100 - principalPercentage;

  return {
    monthlyEmi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    principalPercentage,
    interestPercentage,
  };
};

/**
 * Generates Year-by-Year Loan Amortization Schedule
 */
export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  tenureYears: number
): AmortizationYear[] => {
  if (principal <= 0 || tenureYears <= 0) return [];

  const { monthlyEmi } = calculateEmi(principal, annualRate, tenureYears);
  const monthlyRate = (annualRate || 0) / 12 / 100;
  const schedule: AmortizationYear[] = [];

  let balance = principal;

  for (let y = 1; y <= tenureYears; y++) {
    const openingBalance = balance;
    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;

    for (let m = 1; m <= 12; m++) {
      if (balance <= 0) break;
      const monthInterest = balance * monthlyRate;
      const monthPrincipal = Math.min(monthlyEmi - monthInterest, balance);

      yearInterestPaid += monthInterest;
      yearPrincipalPaid += monthPrincipal;
      balance -= monthPrincipal;
    }

    const closingBalance = Math.max(0, balance);

    schedule.push({
      year: y,
      openingBalance: Math.round(openingBalance),
      principalPaid: Math.round(yearPrincipalPaid),
      interestPaid: Math.round(yearInterestPaid),
      totalPaid: Math.round(yearPrincipalPaid + yearInterestPaid),
      closingBalance: Math.round(closingBalance),
    });

    if (closingBalance <= 0) break;
  }

  return schedule;
};

/**
 * Calculates SIP (Systematic Investment Plan) Future Value with optional Step-Up.
 * Formula: M = P * ((1+i)^n - 1) / i * (1+i)
 */
export const calculateSip = (
  monthlyInvestment: number,
  expectedReturnRate: number,
  tenureYears: number,
  stepUpPercent: number = 0
): SipResult => {
  if (monthlyInvestment <= 0 || tenureYears <= 0) {
    return {
      totalInvested: 0,
      estimatedReturns: 0,
      totalMaturityValue: 0,
      wealthMultiplier: 1,
      inflationAdjustedValue: 0,
      yearlyBreakdown: [],
    };
  }

  const monthlyRate = (expectedReturnRate || 0) / 12 / 100;
  const yearlyBreakdown: SipYearGrowth[] = [];

  let totalInvested = 0;
  let currentBalance = 0;
  let currentMonthlyInvestment = monthlyInvestment;

  for (let y = 1; y <= tenureYears; y++) {
    let yearInvested = 0;

    for (let m = 1; m <= 12; m++) {
      yearInvested += currentMonthlyInvestment;
      currentBalance = (currentBalance + currentMonthlyInvestment) * (1 + monthlyRate);
    }

    totalInvested += yearInvested;

    yearlyBreakdown.push({
      year: y,
      investedCapital: Math.round(totalInvested),
      interestEarned: Math.round(Math.max(0, currentBalance - totalInvested)),
      futureValue: Math.round(currentBalance),
    });

    if (stepUpPercent > 0) {
      currentMonthlyInvestment += (currentMonthlyInvestment * stepUpPercent) / 100;
    }
  }

  const totalMaturityValue = Math.round(currentBalance);
  const estimatedReturns = Math.round(Math.max(0, totalMaturityValue - totalInvested));
  const wealthMultiplier =
    totalInvested > 0 ? Math.round((totalMaturityValue / totalInvested) * 10) / 10 : 1;

  // Real purchasing power at 6% inflation
  const inflationAdjustedValue = Math.round(
    totalMaturityValue / Math.pow(1 + 0.06, tenureYears)
  );

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns,
    totalMaturityValue,
    wealthMultiplier,
    inflationAdjustedValue,
    yearlyBreakdown,
  };
};

/**
 * Calculates Required Monthly Savings/SIP to reach a Target Goal Amount.
 */
export const calculateGoalSip = (
  targetAmount: number,
  timeframeYears: number,
  expectedReturnRate: number = 12
): GoalResult => {
  if (targetAmount <= 0 || timeframeYears <= 0) {
    return {
      targetAmount: 0,
      timeframeYears: 0,
      expectedReturnRate: 0,
      requiredMonthlySavings: 0,
      totalInvestment: 0,
      interestBenefit: 0,
    };
  }

  const totalMonths = timeframeYears * 12;
  let requiredMonthlySavings = 0;

  if (expectedReturnRate <= 0) {
    requiredMonthlySavings = targetAmount / totalMonths;
  } else {
    const monthlyRate = expectedReturnRate / 12 / 100;
    requiredMonthlySavings =
      (targetAmount * monthlyRate) /
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
  }

  const totalInvestment = Math.round(requiredMonthlySavings * totalMonths);
  const interestBenefit = Math.round(Math.max(0, targetAmount - totalInvestment));

  return {
    targetAmount: Math.round(targetAmount),
    timeframeYears,
    expectedReturnRate,
    requiredMonthlySavings: Math.round(requiredMonthlySavings),
    totalInvestment,
    interestBenefit,
  };
};

/**
 * Calculates Lump Sum Compound Growth: A = P * (1 + r/100)^t
 */
export const calculateLumpSum = (
  principal: number,
  annualRate: number,
  tenureYears: number
): LumpSumResult => {
  if (principal <= 0 || tenureYears <= 0) {
    return {
      initialInvestment: 0,
      totalInterest: 0,
      maturityAmount: 0,
      wealthMultiplier: 1,
      inflationAdjustedValue: 0,
      yearlyBreakdown: [],
    };
  }

  const yearlyBreakdown: { year: number; balance: number; interestEarned: number }[] = [];
  let balance = principal;

  for (let y = 1; y <= tenureYears; y++) {
    const prevBalance = balance;
    balance = balance * (1 + (annualRate || 0) / 100);
    yearlyBreakdown.push({
      year: y,
      balance: Math.round(balance),
      interestEarned: Math.round(balance - prevBalance),
    });
  }

  const maturityAmount = Math.round(balance);
  const totalInterest = Math.round(maturityAmount - principal);
  const wealthMultiplier = Math.round((maturityAmount / principal) * 10) / 10;
  const inflationAdjustedValue = Math.round(
    maturityAmount / Math.pow(1 + 0.06, tenureYears)
  );

  return {
    initialInvestment: Math.round(principal),
    totalInterest,
    maturityAmount,
    wealthMultiplier,
    inflationAdjustedValue,
    yearlyBreakdown,
  };
};
