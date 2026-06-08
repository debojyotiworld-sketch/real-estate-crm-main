export const toNum = (
    value: unknown
): number => {

    return Number(value || 0);
};

export const round2 = (
    value: number
): number => {

    return Math.round(
        value * 100
    ) / 100;
};

export const calculateGrossSalary = (
    values: {
        basic: number;
        hra: number;
        conveyance: number;
        medical: number;
        special_allowance: number;
        other_allowance: number;
    }
) => {

    return round2(
        values.basic +
        values.hra +
        values.conveyance +
        values.medical +
        values.special_allowance +
        values.other_allowance
    );
};

export const calculatePf = (
    basic: number,
    percent = 12
) => {

    return round2(
        (basic * percent) / 100
    );
};

export const calculateEsi = (
    gross: number,
    percent = 0.75
) => {

    return round2(
        (gross * percent) / 100
    );
};

export const calculateEmployerEsi = (
    gross: number,
    percent = 3.25
) => {

    return round2(
        (gross * percent) / 100
    );
};

export const calculateGratuity = (
    basic: number
) => {

    return round2(
        (basic * 4.81) / 100
    );
};

export const calculateTotalDeductions = (
    values: {
        pf: number;
        esi: number;
        professional_tax: number;
        tds: number;
        other_deductions: number;
        advance_deduction?: number; // Optional param added
    }
) => {
    return round2(
        values.pf +
        values.esi +
        values.professional_tax +
        values.tds +
        values.other_deductions +
        (values.advance_deduction || 0)
    );
};

export const calculateNetSalary = (
    gross: number,
    deductions: number
) => {

    return round2(
        gross - deductions
    );
};

export const calculateCtc = (
    gross: number,
    employerPf: number,
    employerEsi: number,
    gratuity: number
) => {

    return round2(
        gross +
        employerPf +
        employerEsi +
        gratuity
    );
};