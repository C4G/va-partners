import XLSX from 'xlsx-js-style';

const CASH_GRANT_SUMMARY_OF_FINANCES = `\tSummary of finances sheet\t\t\t\tAll figures in INR
\tPlease fill in the summary of funds received and spent.
S/N\tDescription\tQ1 Jan-Mar 2024\tQ2 Apr-Jun 2024\tQ3 Jul-Sep 2024\tQ4 Oct-Dec 2024\tGuide

\tOpening Balance\t\t\t\t\tThis should be the closing balance of the previous quarter
1\tAmount received during the quarter
2\tDate of receipt\t\t\t\t\tFormula to be put
3\tExpenses *
4\tClosing balance\t\t\t\t\tFormula to be put
5\tReceipt from distribution of devices
6\tNet amount of Grant for the next quarter ( Standard Grant minus receipt from distribution of Devices)
7\tOne time grant requested, if any

\t*Breakdown the total expenses in the current quarter into separate line items. Modify this as needed to suit your own accounting heads. 	

S/N\tBudget Heads\tQ1 Jan-Mar 2024\tQ2 Apr-Jun 2024\tQ3 Jul-Sep 2024\tQ4 Oct - Dec 2024
1\tManpower cost (VEC)
2\tEquipment cost (VEC)
3\tOperational expenses (VEC - Electricity, water, IT, maintenance, security, etc.)
4\tFree LVDs (LVC)
5\t(to specify)
6\t(to specify)
\tTotal  Expenses

\tDetails of the One time grant ( if any)
\tFor assessment and training resources which under purchase processing
\tDate of receipt
\t(to specify)
\t(to specify)
\t(to specify)
\tTotal





\tDescription\tNumber\tAmount in INR
\tAmount of free LVD (including all LVD and PDM)
\tAmount generated through devices

\tStock statement of Digital magnifiers\t3.5\t4.3\t5
\tOpening balance
\tTotal devices given for free
\tTotal devices given for subsidised cost
\tTotal devices given for full cost*
\tAmount received from distribution of digital magnifiers (INR)
\tClosing balance
\tNumber of devices needed for next quarter
`;
export const buildCashGrantSummaryOfFinances = () => {
  const sheetData = CASH_GRANT_SUMMARY_OF_FINANCES.split('\n').map(row => row.split('\t'));
  return XLSX.utils.aoa_to_sheet(sheetData);
}