import XLSX from 'xlsx-js-style';

const SUMMARY_DATA = `Partner Name\txxx
Report filled by\txxx
Report date\t*** 2024
Quarter (for ex. Jan _ Match, 2024)



Qualitative/Narrative Report (Expand this section as needed)

Please share here what cannot be captured by numbers  - the highlights, stories, status, issues, photos, etc 

Highlights for example any screening camp conducted / awareness activities with respective photos








Issues if any


Stories
Stories can talk about 
Name of beneficiary if consent given
Place
Disease for sight loss
Percentage of retained sight
What age of sight loss
challenges faced due to visual impairment
In case of child with CVI, how the parents feel about the care given
How did candidate/ paretns come to know about XYZ hospital and their rehab centre and Vision aid
what impact Vision-Aid program played in life  
Feed back regarding Vision-Aid Resource center


UPLOAD ONE OR MORE PHOTOS OF THE WORK USING THE INSERT -> PICTURES OPTION with Description of the event / Success story 
`;
export const buildSummarySheet = () => {
  const sheetData = SUMMARY_DATA.split('\n').map(row => row.split('\t'));
  return XLSX.utils.aoa_to_sheet(sheetData);
}