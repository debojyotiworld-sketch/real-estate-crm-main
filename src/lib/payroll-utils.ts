export const getMonthDateRange = (
    month: number,
    year: number
) => {

    const startDate =
        `${year}-${String(month)
            .padStart(2, "0")}-01`;

    const endDate =
        new Date(
            year,
            month,
            0
        )
            .toISOString()
            .split("T")[0];

    return {
        startDate,
        endDate,
    };
};

export const calculatePerDaySalary = (
    grossSalary: number,
    workingDays: number
) => {

    return grossSalary / workingDays;
};

export const calculateLopDays = (
    unpaidLeaves: number,
    halfDays: number,
    lateDays: number
) => {

    return (
        unpaidLeaves +
        (halfDays * 0.5) +
        (lateDays * 0.25)
    );
};

export const calculateLeaveDeduction = (
    perDaySalary: number,
    lopDays: number
) => {

    return perDaySalary * lopDays;
};

// +++ NOTUN CODE: Advance Deduction Logic +++
export const calculateAdvanceDeduction = (
    remainingAdvance: number,
    deductionType: 'FULL' | 'EMI',
    emiAmount: number = 0,
    availableNetSalary: number
) => {
    if (remainingAdvance <= 0) return 0;

    let deductionThisMonth = 0;

    if (deductionType === 'EMI' && emiAmount > 0) {
        // EMI hole emi amount ba remaining advance (jeta choto) seta katbe
        deductionThisMonth = Math.min(emiAmount, remainingAdvance);
    } else {
        // FULL hole pura baki taka katbe, kintu salary er theke besi katte parbe na
        deductionThisMonth = Math.min(remainingAdvance, availableNetSalary);
    }

    // Ekebare net salary er theke besi katan jabe na
    return Math.min(deductionThisMonth, availableNetSalary);
};