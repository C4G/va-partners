import moment from "moment";
import { calculateAge } from "utils/global/calculate-age";
import XLSX from "xlsx-js-style";
import { difference, intersect, isNotNullEmptyOrUndefined, union } from "./globalFunctions";

function getFormattedDate(date) {
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Merge cells in Excel sheet header
const mergeHeaderCells = ({ row = 0, col = 0, rowSpan = 0, colSpan = 0 }) => {
  return { s: { r: row, c: col }, e: { r: row + rowSpan, c: col + colSpan } };
};

// Add empty header cells
const addEmptyElements = (array, element, count) => {
  for (let i = 0; i < count; i++) {
    array.push(element);
  }
};

// Excel header for CLVE sheet
const clveMainHeader = [
  "Date of Evaluation",
  "MRN",
  "Name of the Patient",
  "Age",
  "Gender",
  "Education",
  "Occupation",
  "Diagnosis",
  "Diagnosis Notes",
  "Districts",
  "State",
  "Distance Acuity",
  "",
  "",
  "",
  "Near Acuity",
  "",
  "",
  "",
  "Recommended Optical Aid",
  "Recommended Non-Optical Aid",
  "Recommended Electronic Aid",
  "Spectacles (Refractive Error Only)",
  "Dispensed Optical Aid",
  "Dispensed Non-Optical Aid",
  "Dispensed Electronic Aid",
  "Dispensed Spectacles (Refractive Error Only)",
  "Colour Vision",
  "",
  "Contrast Sensitivity",
  "",
  "Visual Fields",
  "",
  "Cost of all the aids dispensed",
  "Cost to the Beneficiary",
  "Comments",
];

// Escel sub-header for CLVE sheet
let clveSubHeader = [];
addEmptyElements(clveSubHeader, "", 11); // Empty for columns 0-10 (Date through State)
clveSubHeader.push("Notation"); // Column 11 - Distance Acuity Notation
clveSubHeader.push("RE"); // Column 12 - Distance Acuity RE
clveSubHeader.push("LE"); // Column 13 - Distance Acuity LE
clveSubHeader.push("BE"); // Column 14 - Distance Acuity BE
clveSubHeader.push("Notation"); // Column 15 - Near Acuity Notation
clveSubHeader.push("RE"); // Column 16 - Near Acuity RE
clveSubHeader.push("LE"); // Column 17 - Near Acuity LE
clveSubHeader.push("BE"); // Column 18 - Near Acuity BE
addEmptyElements(clveSubHeader, "", 8); // Empty for columns 19-26 (Recommended/Dispensed aids)
clveSubHeader.push("RE"); // Column 27 - Colour Vision RE
clveSubHeader.push("LE"); // Column 28 - Colour Vision LE
clveSubHeader.push("RE"); // Column 29 - Contrast Sensitivity RE
clveSubHeader.push("LE"); // Column 30 - Contrast Sensitivity LE
clveSubHeader.push("RE"); // Column 31 - Visual Fields RE
clveSubHeader.push("LE"); // Column 32 - Visual Fields LE
addEmptyElements(clveSubHeader, "", 3); // Empty for columns 33-35 (Cost, Cost to Beneficiary, Comments)

// Excel header for Low Vision Screening Sheet
const lveMainHeader = [
  "Date of Evaluation",
  "MRN",
  "Name of the Patient",
  "Age",
  "Gender",
  "Education",
  "Occupation",
  "Diagnosis",
  "Districts",
  "State",
  "Session Number",
  "MDVI",
  "Acuity",
  "",
  "",
  "",
  "Near Visual Acuity",
  "",
  "",
  "",
  "Recommended Optical Aid",
  "Recommended Non-Optical Aid",
  "Recommended Electronic Aid",
  "Spectacles (Refractive Error Only)",
  "Extra Information",
];

// Excel sub-header for Low Vision Screening Sheet
let lveSubHeader = [];
addEmptyElements(lveSubHeader, "", 13);
lveSubHeader.push("Notation");
lveSubHeader.push("RE");
lveSubHeader.push("LE");
lveSubHeader.push("BE");
lveSubHeader.push("Notation");
lveSubHeader.push("RE");
lveSubHeader.push("LE");
lveSubHeader.push("BE");
addEmptyElements(lveSubHeader, "", 5);

// Get all sessions from CLVE data where devices were dispensed
function getSessionsForDispenedDevices(clveData) {
  const sessionsForDispensedDevices = clveData.filter(
    (evaluation) =>
      isNotNullEmptyOrUndefined(evaluation.dispensedSpectacle) ||
      isNotNullEmptyOrUndefined(evaluation.dispensedElectronic) ||
      isNotNullEmptyOrUndefined(evaluation.dispensedOptical) ||
      isNotNullEmptyOrUndefined(evaluation.dispensedNonOptical)
  );
  return sessionsForDispensedDevices;
}

// Populate the Aggregated Hospital Data Sheet
function populateAhdHeaders(hospitals) {
  // Reference sheet here: https://docs.google.com/spreadsheets/d/1cIYeMO9YuPSaNFwVEfRlDkJ1_qZdOsC-/edit#gid=535411624
  // Sheet Header (Row 1)
  const ahdMainHeader = [];
  ahdMainHeader.push("Programs");
  addEmptyElements(ahdMainHeader, "", 1);
  ahdMainHeader.push("Hospitals (Break up)");
  addEmptyElements(ahdMainHeader, "", hospitals.length * 2 - 1);
  if (hospitals.length !== 1) {
    ahdMainHeader.push("Beneficiaries of Hospitals");
    addEmptyElements(ahdMainHeader, "", 1);
  }

  // Sheet Sub Headers (Row 2) & (Row 3)
  const ahdSubHeader1 = [];
  const ahdSubHeader2 = [];
  addEmptyElements(ahdSubHeader1, "", 2);
  addEmptyElements(ahdSubHeader2, "", 2);
  for (let i = 0; i < hospitals.length; i++) {
    ahdSubHeader1.push(hospitals[i]);
    addEmptyElements(ahdSubHeader1, "", 1);
    ahdSubHeader2.push("Sessions");
    ahdSubHeader2.push("Unique Beneficiaries in each category (beneficiaries can appear in more than one category)");
  }
  addEmptyElements(ahdSubHeader1, "", 2);

  if (hospitals.length !== 1) {
    ahdSubHeader2.push("Number of Sessions");
    ahdSubHeader2.push("Number of Beneficiaries");
  }

  return { ahdMainHeader, ahdSubHeader1, ahdSubHeader2 };
}

// This function is used to filter a given training by date range
function filterByDate(training, start, end) {
  return moment
    .utc(training.date)
    .isBetween(moment.utc(start).startOf("day"), moment.utc(end).endOf("day"), null, "[]");
}

const getDateWithTimezoneOffset = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - (offset >= 0 ? -offset : offset));
};

// Get the latest dispensed device from descending sorted CLVE data
function getLatestDispensedDevice(sortedClveData, deviceType) {
  for (let clveRow of sortedClveData) {
    if (isNotNullEmptyOrUndefined(clveRow[deviceType])) return clveRow[deviceType];
  }
  return "";
}

// Returns common columns of all Excel sheets
function getCommonData(beneficiary) {
  const commonData = {
    "Date of Evaluation": getDateWithTimezoneOffset(new Date(beneficiary["dateOfBirth"])),
    MRN: beneficiary["mrn"],
    "Name of the Patient": beneficiary["beneficiaryName"],
    Age: calculateAge(beneficiary["dateOfBirth"]),
    Gender: beneficiary["gender"],
    Education: beneficiary["education"],
    Occupation: beneficiary["occupation"],
    Diagnosis: beneficiary["diagnosis"],
    "Diagnosis Notes": beneficiary["diagnosisNotes"],
    District: beneficiary["districts"],
    State: beneficiary["state"],
  };

  return commonData;
}

// Get Beneficiary Sheet data
function getBeneficiaryJson(commonData, beneficiary) {
  let beneficiaryJson = { ...commonData };
  delete beneficiaryJson["Date of Evaluation"];
  beneficiaryJson["Phone Number"] = beneficiary["phoneNumber"];
  beneficiaryJson["Hospital Name"] = beneficiary["hospital"]["name"];
  beneficiaryJson["Vision"] = beneficiary["vision"];
  beneficiaryJson["MDVI"] = beneficiary["mDVI"];

  // Sort beneficiary CLVE data in descending order of session numbers so that latest devices can be extracted
  const sortedBeneficiaryClve = beneficiary["Comprehensive_Low_Vision_Evaluation"].sort(
    (a, b) => b.sessionNumber - a.sessionNumber
  );

  beneficiaryJson["Dispensed Spectacle"] = getLatestDispensedDevice(sortedBeneficiaryClve, "dispensedSpectacle");
  beneficiaryJson["Dispensed Optical"] = getLatestDispensedDevice(sortedBeneficiaryClve, "dispensedOptical");
  beneficiaryJson["Dispensed Non-Optical"] = getLatestDispensedDevice(sortedBeneficiaryClve, "dispensedNonOptical");
  beneficiaryJson["Dispensed Electronic"] = getLatestDispensedDevice(sortedBeneficiaryClve, "dispensedElectronic");
  beneficiaryJson["Total Number of Trainings"] = sortedBeneficiaryClve.length;

  beneficiaryJson["Extra Information"] = beneficiary["rawExtraFields"];

  return beneficiaryJson;
}

// Get CLVE Sheet data
function getClveJson(commonData, clveData) {
  const clveJson = {
    "Date of Evaluation": getDateWithTimezoneOffset(new Date(clveData["date"])),
    MRN: commonData["MRN"],
    "Name of the Patient": commonData["Name of the Patient"],
    Age: commonData["Age"],
    Gender: commonData["Gender"],
    Education: commonData["Education"],
    Occupation: commonData["Occupation"],
    Diagnosis: clveData["diagnosis"] || commonData["Diagnosis"],
    "Diagnosis Notes": clveData["diagnosisNotes"],
    Districts: commonData["District"], // Note: still using District from commonData
    State: commonData["State"],
    "Acuity Notation": clveData["distanceVisualAcuityRE"].split(" ")[1], // insert check for if [1] exists
    "Acuity RE": clveData["distanceVisualAcuityRE"].split(" ")[0],
    "Acuity LE": clveData["distanceVisualAcuityLE"].split(" ")[0],
    "Acuity BE": clveData["distanceBinocularVisionBE"].split(" ")[0],
    "Near Visual Acuity Notation": clveData["nearVisualAcuityRE"].split(" ")[1], // insert check for if [1] exists
    "Near Visual Acuity RE": clveData["nearVisualAcuityRE"].split(" ")[0],
    "Near Visual Acuity LE": clveData["nearVisualAcuityLE"].split(" ")[0],
    "Near Visual Acuity BE": clveData["nearBinocularVisionBE"].split(" ")[0],
    "Recommended Optical Aid": clveData["recommendationOptical"],
    "Recommended Non-Optical Aid": clveData["recommendationNonOptical"],
    "Recommended Electronic Aid": clveData["recommendationElectronic"],
    "Spectacles (Refractive Error Only)": clveData["recommendationSpectacle"],
    "Dispensed Optical Aid": clveData["dispensedOptical"],
    "Dispensed Non-Optical Aid": clveData["dispensedNonOptical"],
    "Dispensed Electronic Aid": clveData["dispensedElectronic"],
    "Dispensed Spectacles (Refractive Error Only)": clveData["dispensedSpectacle"],
    "Colour Vision RE": clveData["colourVisionRE"],
    "Colour Vision LE": clveData["colourVisionLE"],
    "Contrast Sensitivity RE": clveData["contrastSensitivityRE"],
    "Contrast Sensitivity LE": clveData["contrastSensitivityLE"],
    "Visual Fields RE": clveData["visualFieldsRE"],
    "Visual Fields LE": clveData["visualFieldsLE"],
    "Cost of all the aids dispensed":
      clveData["costOptical"] + clveData["costNonOptical"] + clveData["costElectronic"] + clveData["costSpectacle"],
    "Cost to the Beneficiary":
      clveData["costToBeneficiaryOptical"] +
      clveData["costToBeneficiaryNonOptical"] +
      clveData["costToBeneficiaryElectronic"] +
      clveData["costToBeneficiarySpectacle"],
    Comments: clveData["extraInformation"],
  };

  return clveJson;
}

// Get Vison Enhancement Sheet data
function getVeJson(commonData, veData) {
  let veJson = { ...commonData };
  veJson["Date of Evaluation"] = getDateWithTimezoneOffset(new Date(veData["date"]));
  veJson["Diagnosis"] = veData["Diagnosis"];
  veJson["Session Number"] = veData["sessionNumber"];
  veJson["MDVI"] = veData["MDVI"];
  veJson["Extra Information"] = veData["extraInformation"];

  return veJson;
}

// Get Low Vision Screening Sheet data
function getLveJson(commonData, lveData) {
  let lveJson = { ...commonData };
  lveJson["Date of Evaluation"] = getDateWithTimezoneOffset(new Date(lveData["date"]));
  lveJson["Diagnosis"] = lveData["diagnosis"];
  lveJson["Session Number"] = lveData["sessionNumber"];
  lveJson["MDVI"] = lveData["mdvi"];
  lveJson["Acuity Notation"] = lveData["distanceVisualAcuityRE"].split(" ")[1]; // insert check for if [1] exists
  lveJson["RE Acuity"] = lveData["distanceVisualAcuityRE"].split(" ")[0];
  lveJson["LE Acuity"] = lveData["distanceVisualAcuityLE"].split(" ")[0];
  lveJson["BE Acuity"] = lveData["distanceBinocularVisionBE"].split(" ")[0];
  lveJson["Near Visual Acuity Notation"] = lveData["nearVisualAcuityRE"].split(" ")[1]; // insert check for if [1] exists
  lveJson["RE Near Visual Acuity"] = lveData["nearVisualAcuityRE"].split(" ")[0];
  lveJson["LE Near Visual Acuity"] = lveData["nearVisualAcuityLE"].split(" ")[0];
  lveJson["BE Near Visual Acuity"] = lveData["nearBinocularVisionBE"].split(" ")[0];
  lveJson["Recommended Optical Aid"] = lveData["recommendationOptical"];
  lveJson["Recommended Non-Optical Aid"] = lveData["recommendationNonOptical"];
  lveJson["Recommended Electronic Aid"] = lveData["recommendationElectronic"];
  lveJson["Spectacles (Refractive Error Only)"] = lveData["recommendationSpectacle"];
  lveJson["Extra Information"] = lveData["extraInformation"];

  return lveJson;
}

// Get Training Sheet data
function getTrainingJson(commonData, tData) {
  let tJson = { ...commonData };
  tJson["Date of Evaluation"] = getDateWithTimezoneOffset(new Date(tData["date"]));
  tJson["Session Number"] = tData["sessionNumber"];
  tJson["Type of Training"] = tData["type"]; // has been referred in customizedReports. Please make necessary changes if this column name is changed.
  tJson["Sub Type"] = tData["subType"];
  tJson["Extra Information"] = tData["extraInformation"];

  return tJson;
}

// Get Counselling Education Sheet data
function getCeJson(commonData, ceData) {
  let ceJson = { ...commonData };
  ceJson["Date of Evaluation"] = getDateWithTimezoneOffset(new Date(ceData["date"]));
  ceJson["Session Number"] = ceData["sessionNumber"];
  ceJson["MDVI"] = ceData["MDVI"];
  ceJson["Vision Type"] = ceData["vision"];
  ceJson["Type"] = ceData["type"];
  ceJson["Type of Counselling"] = ceData["typeCounselling"];
  ceJson["Extra Information"] = ceData["extraInformation"];

  return ceJson;
}

// Populates data for Aggregated Hospital Data Sheet
export function getAggregatedHospitalData(
  filteredBeneficiaryData,
  filteredSummary,
  includeAllBeneficiaries
  // selectedGenders,
  // selectedMdvi,
  // minAge,
  // maxAge,
  // selectedTrainingTypes,
  // selectedTrainingSubTypes
) {
  // filteredBeneficiaryData = filteredBeneficiaryData.filter(
  //   (item) =>
  //     selectedGenders.includes(item.gender) &&
  //     selectedMdvi.includes(item.mDVI) &&
  //     minAge <= calculateAge(item.dateOfBirth) &&
  //     calculateAge(item.dateOfBirth) <= maxAge
  // );

  let aggregatedHospitalData = [];

  // Blank row
  let blankRow = { Programs1: "", Programs2: "" };

  // Low Vision Screening
  let lveRow = {
    Programs1: "Screening / Out reach activities",
    Programs2: "Low vision screening/camps",
  };
  let lveSessionsTotal = 0;
  let lveBeneficiariesTotal = 0;

  // MDVI
  let mdviRow = { Programs1: "", Programs2: "Identification of MDVI" };
  let mdviTotal = 0;

  // Vision Enhancement
  let veRow = {
    Programs1: "Functional vision / Early intervention / Vision enhancement",
    Programs2: "",
  };
  let veSessionsTotal = 0;
  let veBeneficiariesTotal = 0;

  // Comprehensive Low Vision Evaluation
  let clveRow = {
    Programs1: "Comprehensive Low Vision Evaluation",
    Programs2: "",
  };
  let clveSessionsTotal = 0;
  let clveBeneficiariesTotal = 0;

  // Dispensed devices
  let devicesRow = {
    Programs1: "Assistive devices / aids / smartphone/ RLF tactile books",
    Programs2: "",
  };
  let devicesSessionsTotal = 0;
  let devicesBeneficiariesTotal = 0;

  // Counselling & referrals
  let ceRow = { Programs1: "Counseling & referrals", Programs2: "" };
  let ceSessionsTotal = 0;
  let ceBeneficiariesTotal = 0;

  // training
  let trainingRow = { Programs1: "Training", Programs2: "" };
  let trainingSessionsTotal = 0;
  let trainingBeneficiariesTotal = 0;

  // List of unique training types from training data
  const trainingTypes = Array.from(
    new Set(
      filteredBeneficiaryData
        .map((beneficiary) => {
          return beneficiary.training ? beneficiary.training.map((training) => training.type) : []; // Return an empty array if training is undefined
        })
        .flat(Infinity)
    )
  );

  const tRowWithMainHeader = { Programs1: "Training activities at hospitals" };
  const tRowWithoutMainHeader = { Programs1: "" };

  // Setting up rows corresponding to each training type
  const trainingTypesList = trainingTypes.map((type, index) => {
    if (index === 0) {
      return {
        tRow: { ...tRowWithMainHeader, Programs2: type },
        tSessionsTotal: 0,
        tBeneficiariesTotal: 0,
      };
    } else {
      return {
        tRow: { ...tRowWithoutMainHeader, Programs2: type },
        tSessionsTotal: 0,
        tBeneficiariesTotal: 0,
      };
    }
  });

  let overallTrainingRow = { Programs1: "Total # of Sessions", Programs2: "" };
  let otSessionsTotal = 0;

  // Screenings only
  let visionEnhancementBeneficiaries;
  let screeningsOnlyRow = {
    Programs1: "Low vision screening at centre/screening camps only",
    Programs2: "",
  };
  let screeningsOnlyBeneficiariesTotal = 0;
  let screeningsAndCLVERow = {
    Programs1: "Low vision screening at centre/screening camps + CLVE",
    Programs2: "",
  };
  let screeningsAndCLVETotal = 0;
  let visionCLVERow = {
    Programs1: "Functional Vision/Early Intervention/ Vision enhancement + CLVE only",
    Programs2: "",
  };
  let visionCLVETotal = 0;
  let screeningsCLVEVisionRow = {
    Programs1:
      "Low vision screening at centre/screening camps + CLVE + Functional Vision/Early Intervention/ Vision enhancement",
    Programs2: "",
  };
  let screeningsCLVEVisionTotal = 0;
  let screeningsCLVEVisionDevicesRow = {
    Programs1: "Evaluation(s) + Dispensed Devices only",
    Programs2: "",
  };
  let screeningsCLVEVisionDevicesTotal = 0;
  let screeningsCLVEVisionCounselingRow = {
    Programs1: "Evaluation(s) + Counseling only",
    Programs2: "",
  };
  let screeningsCLVEVisionCounselingTotal = 0;
  let screeningsCLVEVisionTrainingRow = {
    Programs1: "Evaluation(s) + Training only",
    Programs2: "",
  };
  let screeningsCLVEVisionTrainingTotal = 0;
  let screeningsCLVEVisionDevicesCounselingRow = {
    Programs1: "Evaluation(s) + Dispensed Devices + Counseling only",
    Programs2: "",
  };
  let screeningsCLVEVisionDevicesCounselingTotal = 0;
  let screeningsCLVEVisionDevicesTrainingRow = {
    Programs1: "Evaluation(s) + Dispensed Devices + Training only",
    Programs2: "",
  };
  let screeningsCLVEVisionDevicesTrainingTotal = 0;
  let screeningsCLVEVisionCounselingTrainingRow = {
    Programs1: "Evaluation(s) + Counseling + Training only",
    Programs2: "",
  };
  let screeningsCLVEVisionCounselingTrainingTotal = 0;
  let screeningsCLVEVisionDevicesCounselingTrainingRow = {
    Programs1: "Evaluation(s) + Dispensed Devices + Counseling + Training only",
    Programs2: "",
  };
  let screeningsCLVEVisionDevicesCounselingTrainingTotal = 0;
  let visionEnhancementOnlyRow = {
    Programs1: "Functional Vision/Early Intervention/ Vision enhancement only",
    Programs2: "",
  };
  let visionEnhancementOnlyBeneficiariesTotal = 0;

  // Screenings + Functional Vision/Early Intervention
  let screeningsVisionEnhancementRow = {
    Programs1:
      "Low vision screening at centre/screening camps + Functional Vision/Early Intervention/ Vision enhancement only",
    Programs2: "",
  };
  let screeningsVisionEnhancementBeneficiariesTotal = 0;

  // Training Only
  let trainingOnlyRow = {
    Programs1: "Training Only",
    Programs2: "",
  };
  let trainingOnlyTotal = 0;

  // Counseling Only
  let counselingOnlyRow = {
    Programs1: "Counseling Only",
    Programs2: "",
  };
  let counselingOnlyTotal = 0;

  // Dispensed Devices Only
  let devicesOnlyRow = {
    Programs1: "Dispensed Devices Only",
    Programs2: "",
  };
  let devicesOnlyTotal = 0;

  // Training and Counseling Only
  let trainingCounselingOnlyRow = {
    Programs1: "Training and Counseling Only",
    Programs2: "",
  };
  let trainingCounselingOnlyTotal = 0;

  // Training and Dispensed Devices Only
  let trainingDevicesOnlyRow = {
    Programs1: "Training and Dispensed Devices Only",
    Programs2: "",
  };
  let trainingDevicesOnlyTotal = 0;

  // Couseling and Dispensed Devices Only
  let counselingDevicesOnlyRow = {
    Programs1: "Couseling and Dispensed Devices Only",
    Programs2: "",
  };
  let counselingDevicesOnlyTotal = 0;

  // Training, Dispensed Devices, and Counseling Only
  let trainingDevicesCounselingOnlyRow = {
    Programs1: "Training, Dispensed Devices, and Counseling Only",
    Programs2: "",
  };
  let trainingDevicesCounselingOnlyTotal = 0;

  // Detailed splitup of all unique beneficiaries in the db
  let clveBeneficiaries, devicesBeneficiaries, counsellingBeneficiaries, trainingBeneficiaries;
  // CLVE Only
  let clveOnlyRow = {
    Programs1: "CLVE Only",
    Programs2: "",
  };
  let clveOnlyBeneficiariesTotal = 0;

  // Total beneficiaries
  let totalBeneficiariesRow = {
    Programs1: "",
    Programs2: "Total Beneficiaries",
  };
  let totalBeneficiariesTotal = 0;

  let uniqueBeneficiaries = 0;

  // If all beneficiaries are not to be included in the report,
  // remove those beneficiaries from filteredSummary which do not meet selected criteria
  if (!includeAllBeneficiaries) {
    const filteredBeneficiaryIds = filteredBeneficiaryData.map((beneficiary) => beneficiary.mrn);
    filteredSummary = filteredSummary.map((hospital) => {
      return {
        ...hospital,
        beneficiary: hospital.beneficiary?.filter((beneficiary) => filteredBeneficiaryIds.includes(beneficiary.mrn)),
        comprehensiveLowVisionEvaluation: hospital.comprehensiveLowVisionEvaluation.filter((evaluation) =>
          filteredBeneficiaryIds.includes(evaluation.beneficiaryId)
        ),
        lowVisionEvaluation: hospital.lowVisionEvaluation.filter((evaluation) =>
          filteredBeneficiaryIds.includes(evaluation.beneficiaryId)
        ),
        visionEnhancement: hospital.visionEnhancement.filter((evaluation) =>
          filteredBeneficiaryIds.includes(evaluation.beneficiaryId)
        ),
        counsellingEducation: hospital.counsellingEducation.filter((evaluation) =>
          filteredBeneficiaryIds.includes(evaluation.beneficiaryId)
        ),
        training: hospital.training.filter((evaluation) => filteredBeneficiaryIds.includes(evaluation.beneficiaryId)),
      };
    });
  }

  // Add checks for empty arrays
  for (let hospital of filteredSummary) {
    // Low Vision Screening data
    lveRow[hospital.name + " Sessions"] = hospital.lowVisionEvaluation.length;
    lveRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(hospital.lowVisionEvaluation.map((evaluation) => evaluation.beneficiaryId))
    ).length;
    lveSessionsTotal += lveRow[hospital.name + " Sessions"];
    lveBeneficiariesTotal += lveRow[hospital.name + " Beneficiaries"];

    // MDVI data
    mdviRow[hospital.name + " Sessions"] = "";
    mdviRow[hospital.name + " Beneficiaries"] = hospital.beneficiary?.filter(
      (beneficiary) => beneficiary.mDVI === "Yes" || beneficiary.mDVI === "At Risk"
    ).length;
    mdviTotal += mdviRow[hospital.name + " Beneficiaries"];

    // Vision Enhancement data
    veRow[hospital.name + " Sessions"] = hospital.visionEnhancement.length;
    veRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(hospital.visionEnhancement.map((evaluation) => evaluation.beneficiaryId))
    ).length;
    veSessionsTotal += veRow[hospital.name + " Sessions"];
    veBeneficiariesTotal += veRow[hospital.name + " Beneficiaries"];

    // Comprehensive Low Vision Evaluation data
    clveRow[hospital.name + " Sessions"] = hospital.comprehensiveLowVisionEvaluation.length;
    clveRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(hospital.comprehensiveLowVisionEvaluation.map((evaluation) => evaluation.beneficiaryId))
    ).length;
    clveSessionsTotal += clveRow[hospital.name + " Sessions"];
    clveBeneficiariesTotal += clveRow[hospital.name + " Beneficiaries"];

    // Dispensed devices data
    devicesRow[hospital.name + " Sessions"] = getSessionsForDispenedDevices(
      hospital.comprehensiveLowVisionEvaluation
    ).length;
    devicesRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(
        getSessionsForDispenedDevices(hospital.comprehensiveLowVisionEvaluation).map(
          (evaluation) => evaluation.beneficiaryId
        )
      )
    ).length;
    devicesSessionsTotal += devicesRow[hospital.name + " Sessions"];
    devicesBeneficiariesTotal += devicesRow[hospital.name + " Beneficiaries"];

    // Counselling & referrals data
    ceRow[hospital.name + " Sessions"] = hospital.counsellingEducation.length;
    ceRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(hospital.counsellingEducation.map((evaluation) => evaluation.beneficiaryId))
    ).length;
    ceSessionsTotal += ceRow[hospital.name + " Sessions"];
    ceBeneficiariesTotal += ceRow[hospital.name + " Beneficiaries"];

    // Training data
    trainingRow[hospital.name + " Sessions"] = hospital.training.length;
    trainingRow[hospital.name + " Beneficiaries"] = Array.from(
      new Set(hospital.training.map((evaluation) => evaluation.beneficiaryId))
    ).length;
    trainingSessionsTotal += trainingRow[hospital.name + " Sessions"];
    trainingBeneficiariesTotal += trainingRow[hospital.name + " Beneficiaries"];

    let trainingIdx = 0;
    // Populate row corresponding to each training type identified earlier
    for (let trainingType of trainingTypes) {
      trainingTypesList[trainingIdx]["tRow"][hospital.name + " Sessions"] = hospital.training.filter(
        (training) => training.type === trainingType
      ).length;
      trainingTypesList[trainingIdx]["tRow"][hospital.name + " Beneficiaries"] = Array.from(
        new Set(
          hospital.training
            .filter((training) => training.type === trainingType)
            .map((training) => training.beneficiaryId)
        )
      ).length;
      trainingTypesList[trainingIdx]["tSessionsTotal"] +=
        trainingTypesList[trainingIdx]["tRow"][hospital.name + " Sessions"];
      trainingTypesList[trainingIdx]["tBeneficiariesTotal"] +=
        trainingTypesList[trainingIdx]["tRow"][hospital.name + " Beneficiaries"];

      trainingIdx += 1;
    }

    // Total # of Sessions
    const hospitalTotalSessions =
      hospital.training.length +
      hospital.counsellingEducation.length +
      hospital.visionEnhancement.length +
      hospital.lowVisionEvaluation.length +
      hospital.comprehensiveLowVisionEvaluation.length;
    overallTrainingRow[hospital.name + " Sessions"] = hospitalTotalSessions;
    otSessionsTotal += overallTrainingRow[hospital.name + " Sessions"];

    // Unique beneficiaries who had Screenings (LVE)
    const screeningsBeneficiaries = new Set(hospital.lowVisionEvaluation.map((evaluation) => evaluation.beneficiaryId));

    // Unique beneficiaries who had Vision Enhancements
    visionEnhancementBeneficiaries = new Set(hospital.visionEnhancement.map((evaluation) => evaluation.beneficiaryId));

    // Unique beneficiaries with CLVE information
    clveBeneficiaries = new Set(
      hospital.comprehensiveLowVisionEvaluation.map((evaluation) => evaluation.beneficiaryId)
    );
    // Unique beneficiaries with dispensed devices
    devicesBeneficiaries = new Set(
      getSessionsForDispenedDevices(hospital.comprehensiveLowVisionEvaluation).map(
        (evaluation) => evaluation.beneficiaryId
      )
    );
    // Unique beneficiaries who received counselling
    counsellingBeneficiaries = new Set(hospital.counsellingEducation.map((evaluation) => evaluation.beneficiaryId));
    // Unique beneficiaries who received training
    trainingBeneficiaries = new Set(hospital.training.map((evaluation) => evaluation.beneficiaryId));

    uniqueBeneficiaries =
      screeningsBeneficiaries.size +
      visionEnhancementBeneficiaries.size +
      clveBeneficiaries.size +
      counsellingBeneficiaries.size +
      trainingBeneficiaries.size;

    // Screenings Only
    screeningsOnlyRow[hospital.name + " Sessions"] = "";
    screeningsOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        screeningsBeneficiaries,
        union(
          clveBeneficiaries,
          visionEnhancementBeneficiaries,
          trainingBeneficiaries,
          counsellingBeneficiaries,
          devicesBeneficiaries
        )
      )
    ).length;
    screeningsOnlyBeneficiariesTotal += screeningsOnlyRow[hospital.name + " Beneficiaries"];

    // Low vision screening at centre/screening camps + CLVE
    screeningsAndCLVERow[hospital.name + " Sessions"] = "";
    screeningsAndCLVERow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(screeningsBeneficiaries, clveBeneficiaries),
        union(trainingBeneficiaries, visionEnhancementBeneficiaries, counsellingBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    screeningsAndCLVETotal += screeningsAndCLVERow[hospital.name + " Beneficiaries"];

    // Functional Vision/Early Intervention/ Vision enhancement + CLVE only
    visionCLVERow[hospital.name + " Sessions"] = "";
    visionCLVERow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(clveBeneficiaries, visionEnhancementBeneficiaries),
        union(screeningsBeneficiaries, trainingBeneficiaries, counsellingBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    visionCLVETotal += visionCLVERow[hospital.name + " Beneficiaries"];

    // Low vision screening at centre/screening camps + CLVE + Functional Vision/Early Intervention/ Vision enhancement
    screeningsCLVEVisionRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(intersect(screeningsBeneficiaries, clveBeneficiaries), visionEnhancementBeneficiaries),
        union(trainingBeneficiaries, counsellingBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    screeningsCLVEVisionTotal += screeningsCLVEVisionRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Dispenced devices
    screeningsCLVEVisionDevicesRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionDevicesRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          devicesBeneficiaries,
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        union(trainingBeneficiaries, counsellingBeneficiaries)
      )
    ).length;
    screeningsCLVEVisionDevicesTotal += screeningsCLVEVisionDevicesRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Counseling
    screeningsCLVEVisionCounselingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionCounselingRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          counsellingBeneficiaries,
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        union(trainingBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    screeningsCLVEVisionCounselingTotal += screeningsCLVEVisionCounselingRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Training
    screeningsCLVEVisionTrainingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionTrainingRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          trainingBeneficiaries,
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        union(counsellingBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    screeningsCLVEVisionTrainingTotal += screeningsCLVEVisionTrainingRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Dispenced devices + Counseling
    screeningsCLVEVisionDevicesCounselingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionDevicesCounselingRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          intersect(devicesBeneficiaries, counsellingBeneficiaries),
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        trainingBeneficiaries
      )
    ).length;
    screeningsCLVEVisionDevicesCounselingTotal +=
      screeningsCLVEVisionDevicesCounselingRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Dispenced devices + Training
    screeningsCLVEVisionDevicesTrainingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionDevicesTrainingRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          intersect(devicesBeneficiaries, trainingBeneficiaries),
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        counsellingBeneficiaries
      )
    ).length;
    screeningsCLVEVisionDevicesTrainingTotal +=
      screeningsCLVEVisionDevicesTrainingRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Counseling + Training
    screeningsCLVEVisionCounselingTrainingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionCounselingTrainingRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(
          intersect(counsellingBeneficiaries, trainingBeneficiaries),
          union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
        ),
        devicesBeneficiaries
      )
    ).length;
    screeningsCLVEVisionCounselingTrainingTotal +=
      screeningsCLVEVisionCounselingTrainingRow[hospital.name + " Beneficiaries"];

    // Evaluation(s) + Dispenced devices + Counseling + Training
    screeningsCLVEVisionDevicesCounselingTrainingRow[hospital.name + " Sessions"] = "";
    screeningsCLVEVisionDevicesCounselingTrainingRow[hospital.name + " Beneficiaries"] = Array.from(
      intersect(
        intersect(intersect(devicesBeneficiaries, counsellingBeneficiaries), trainingBeneficiaries),
        union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
      )
    ).length;
    screeningsCLVEVisionDevicesCounselingTrainingTotal +=
      screeningsCLVEVisionDevicesCounselingTrainingRow[hospital.name + " Beneficiaries"];

    // Functional Vision/Early Intervention only
    visionEnhancementOnlyRow[hospital.name + " Sessions"] = "";
    visionEnhancementOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        visionEnhancementBeneficiaries,
        union(
          screeningsBeneficiaries,
          clveBeneficiaries,
          trainingBeneficiaries,
          counsellingBeneficiaries,
          devicesBeneficiaries
        )
      )
    ).length;
    visionEnhancementOnlyBeneficiariesTotal += visionEnhancementOnlyRow[hospital.name + " Beneficiaries"];

    // Screenings + Functional Vision/Early Intervention
    screeningsVisionEnhancementRow[hospital.name + " Sessions"] = "";
    screeningsVisionEnhancementRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(visionEnhancementBeneficiaries, screeningsBeneficiaries),
        union(counsellingBeneficiaries, devicesBeneficiaries, clveBeneficiaries, trainingBeneficiaries)
      )
    ).length;
    screeningsVisionEnhancementBeneficiariesTotal += screeningsVisionEnhancementRow[hospital.name + " Beneficiaries"];

    // CLVE only
    clveOnlyRow[hospital.name + " Sessions"] = "";
    clveOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        clveBeneficiaries,
        union(
          devicesBeneficiaries,
          counsellingBeneficiaries,
          trainingBeneficiaries,
          visionEnhancementBeneficiaries,
          screeningsBeneficiaries
        )
      )
    ).length;
    clveOnlyBeneficiariesTotal += clveOnlyRow[hospital.name + " Beneficiaries"];

    // Training Only
    trainingOnlyRow[hospital.name + " Sessions"] = "";
    trainingOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        trainingBeneficiaries,
        union(
          screeningsBeneficiaries,
          clveBeneficiaries,
          visionEnhancementBeneficiaries,
          counsellingBeneficiaries,
          devicesBeneficiaries
        )
      )
    ).length;
    trainingOnlyTotal += trainingOnlyRow[hospital.name + " Beneficiaries"];

    // Counseling Only
    counselingOnlyRow[hospital.name + " Sessions"] = "";
    counselingOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        counsellingBeneficiaries,
        union(
          screeningsBeneficiaries,
          clveBeneficiaries,
          visionEnhancementBeneficiaries,
          trainingBeneficiaries,
          devicesBeneficiaries
        )
      )
    ).length;
    counselingOnlyTotal += counselingOnlyRow[hospital.name + " Beneficiaries"];

    // Dispensed Devices Only
    devicesOnlyRow[hospital.name + " Sessions"] = "";
    devicesOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        devicesBeneficiaries,
        union(
          screeningsBeneficiaries,
          clveBeneficiaries,
          visionEnhancementBeneficiaries,
          counsellingBeneficiaries,
          trainingBeneficiaries
        )
      )
    ).length;
    devicesOnlyTotal += devicesOnlyRow[hospital.name + " Beneficiaries"];

    // Training and Counseling Only
    trainingCounselingOnlyRow[hospital.name + " Sessions"] = "";
    trainingCounselingOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(trainingBeneficiaries, counsellingBeneficiaries),
        union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries, devicesBeneficiaries)
      )
    ).length;
    trainingCounselingOnlyTotal += trainingCounselingOnlyRow[hospital.name + " Beneficiaries"];

    // Training and Dispensed Devices Only
    trainingDevicesOnlyRow[hospital.name + " Sessions"] = "";
    trainingDevicesOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(trainingBeneficiaries, devicesBeneficiaries),
        union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries, counsellingBeneficiaries)
      )
    ).length;
    trainingDevicesOnlyTotal += trainingDevicesOnlyRow[hospital.name + " Beneficiaries"];

    // Couseling and Dispensed Devices Only
    counselingDevicesOnlyRow[hospital.name + " Sessions"] = "";
    counselingDevicesOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(counsellingBeneficiaries, devicesBeneficiaries),
        union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries, trainingBeneficiaries)
      )
    ).length;
    counselingDevicesOnlyTotal += counselingDevicesOnlyRow[hospital.name + " Beneficiaries"];

    // Training, Dispensed Devices, and Counseling Only
    trainingDevicesCounselingOnlyRow[hospital.name + " Sessions"] = "";
    trainingDevicesCounselingOnlyRow[hospital.name + " Beneficiaries"] = Array.from(
      difference(
        intersect(intersect(trainingBeneficiaries, counsellingBeneficiaries), devicesBeneficiaries),
        union(screeningsBeneficiaries, clveBeneficiaries, visionEnhancementBeneficiaries)
      )
    ).length;
    trainingDevicesCounselingOnlyTotal += trainingDevicesCounselingOnlyRow[hospital.name + " Beneficiaries"];

    // Total Beneficiaries
    totalBeneficiariesRow[hospital.name + " Sessions"] = "";
    totalBeneficiariesRow[hospital.name + " Beneficiaries"] =
      +screeningsOnlyRow[hospital.name + " Beneficiaries"] +
      screeningsAndCLVERow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionRow[hospital.name + " Beneficiaries"] +
      visionCLVERow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionDevicesRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionCounselingRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionTrainingRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionDevicesCounselingRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionDevicesTrainingRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionCounselingTrainingRow[hospital.name + " Beneficiaries"] +
      screeningsCLVEVisionDevicesCounselingTrainingRow[hospital.name + " Beneficiaries"] +
      visionEnhancementOnlyRow[hospital.name + " Beneficiaries"] +
      screeningsVisionEnhancementRow[hospital.name + " Beneficiaries"] +
      clveOnlyRow[hospital.name + " Beneficiaries"] +
      trainingOnlyRow[hospital.name + " Beneficiaries"] +
      counselingOnlyRow[hospital.name + " Beneficiaries"] +
      devicesOnlyRow[hospital.name + " Beneficiaries"] +
      trainingCounselingOnlyRow[hospital.name + " Beneficiaries"] +
      trainingDevicesOnlyRow[hospital.name + " Beneficiaries"] +
      counselingDevicesOnlyRow[hospital.name + " Beneficiaries"] +
      trainingDevicesCounselingOnlyRow[hospital.name + " Beneficiaries"];
    totalBeneficiariesTotal += totalBeneficiariesRow[hospital.name + " Beneficiaries"];
  }

  // Push totals of each row
  if (filteredSummary.length !== 1) {
    lveRow["Number of Sessions"] = lveSessionsTotal;
    lveRow["Number of Beneficiaries"] = lveBeneficiariesTotal;

    mdviRow["Number of Sessions"] = "";
    mdviRow["Number of Beneficiaries"] = mdviTotal;

    veRow["Number of Sessions"] = veSessionsTotal;
    veRow["Number of Beneficiaries"] = veBeneficiariesTotal;

    clveRow["Number of Sessions"] = clveSessionsTotal;
    clveRow["Number of Beneficiaries"] = clveBeneficiariesTotal;

    devicesRow["Number of Sessions"] = devicesSessionsTotal;
    devicesRow["Number of Beneficiaries"] = devicesBeneficiariesTotal;

    ceRow["Number of Sessions"] = ceSessionsTotal;
    ceRow["Number of Beneficiaries"] = ceBeneficiariesTotal;

    trainingRow["Number of Sessions"] = trainingSessionsTotal;
    trainingRow["Number of Beneficiaries"] = trainingBeneficiariesTotal;

    for (let trainingTypeRow of trainingTypesList) {
      trainingTypeRow["tRow"]["Number of Sessions"] = trainingTypeRow["tSessionsTotal"];
      trainingTypeRow["tRow"]["Number of Beneficiaries"] = trainingTypeRow["tBeneficiariesTotal"];
    }

    overallTrainingRow["Number of Sessions"] = otSessionsTotal;

    clveOnlyRow["Number of Sessions"] = "";
    clveOnlyRow["Number of Beneficiaries"] = clveOnlyBeneficiariesTotal;

    trainingOnlyRow["Number of Sessions"] = "";
    trainingOnlyRow["Number of Beneficiaries"] = trainingOnlyTotal;

    counselingOnlyRow["Number of Sessions"] = "";
    counselingOnlyRow["Number of Beneficiaries"] = counselingOnlyTotal;

    devicesOnlyRow["Number of Sessions"] = "";
    devicesOnlyRow["Number of Beneficiaries"] = devicesOnlyTotal;

    trainingCounselingOnlyRow["Number of Sessions"] = "";
    trainingCounselingOnlyRow["Number of Beneficiaries"] = trainingCounselingOnlyTotal;

    trainingDevicesOnlyRow["Number of Sessions"] = "";
    trainingDevicesOnlyRow["Number of Beneficiaries"] = trainingDevicesOnlyTotal;

    counselingDevicesOnlyRow["Number of Sessions"] = "";
    counselingDevicesOnlyRow["Number of Beneficiaries"] = counselingDevicesOnlyTotal;

    trainingDevicesCounselingOnlyRow["Number of Sessions"] = "";
    trainingDevicesCounselingOnlyRow["Number of Beneficiaries"] = trainingDevicesCounselingOnlyTotal;

    screeningsOnlyRow["Number of Sessions"] = "";
    screeningsOnlyRow["Number of Beneficiaries"] = screeningsOnlyBeneficiariesTotal;

    screeningsAndCLVERow["Number of Sessions"] = "";
    screeningsAndCLVERow["Number of Beneficiaries"] = screeningsAndCLVETotal;

    visionCLVERow["Number of Sessions"] = "";
    visionCLVERow["Number of Beneficiaries"] = visionCLVETotal;

    screeningsCLVEVisionRow["Number of Sessions"] = "";
    screeningsCLVEVisionRow["Number of Beneficiaries"] = screeningsCLVEVisionTotal;

    screeningsCLVEVisionDevicesRow["Number of Sessions"] = "";
    screeningsCLVEVisionDevicesRow["Number of Beneficiaries"] = screeningsCLVEVisionDevicesTotal;

    screeningsCLVEVisionCounselingRow["Number of Sessions"] = "";
    screeningsCLVEVisionCounselingRow["Number of Beneficiaries"] = screeningsCLVEVisionCounselingTotal;

    screeningsCLVEVisionTrainingRow["Number of Sessions"] = "";
    screeningsCLVEVisionTrainingRow["Number of Beneficiaries"] = screeningsCLVEVisionTrainingTotal;

    screeningsCLVEVisionDevicesCounselingRow["Number of Sessions"] = "";
    screeningsCLVEVisionDevicesCounselingRow["Number of Beneficiaries"] = screeningsCLVEVisionDevicesCounselingTotal;

    screeningsCLVEVisionDevicesTrainingRow["Number of Sessions"] = "";
    screeningsCLVEVisionDevicesTrainingRow["Number of Beneficiaries"] = screeningsCLVEVisionDevicesTrainingTotal;

    screeningsCLVEVisionCounselingTrainingRow["Number of Sessions"] = "";
    screeningsCLVEVisionCounselingTrainingRow["Number of Beneficiaries"] = screeningsCLVEVisionCounselingTrainingTotal;

    screeningsCLVEVisionDevicesCounselingTrainingRow["Number of Sessions"] = "";
    screeningsCLVEVisionDevicesCounselingTrainingRow["Number of Beneficiaries"] =
      screeningsCLVEVisionDevicesCounselingTrainingTotal;

    visionEnhancementOnlyRow["Number of Sessions"] = "";
    visionEnhancementOnlyRow["Number of Beneficiaries"] = visionEnhancementOnlyBeneficiariesTotal;

    screeningsVisionEnhancementRow["Number of Sessions"] = "";
    screeningsVisionEnhancementRow["Number of Beneficiaries"] = screeningsVisionEnhancementBeneficiariesTotal;

    totalBeneficiariesRow["Number of Sessions"] = "";
    totalBeneficiariesRow["Number of Beneficiaries"] = totalBeneficiariesTotal;
  }

  const evaluationsTotal =
    screeningsOnlyBeneficiariesTotal +
    visionEnhancementOnlyBeneficiariesTotal +
    clveOnlyBeneficiariesTotal +
    screeningsAndCLVETotal +
    visionCLVETotal +
    screeningsVisionEnhancementBeneficiariesTotal +
    screeningsCLVEVisionTotal;
  const servicesTotal =
    trainingOnlyTotal +
    counselingOnlyTotal +
    devicesOnlyTotal +
    trainingCounselingOnlyTotal +
    trainingDevicesOnlyTotal +
    counselingDevicesOnlyTotal +
    trainingDevicesCounselingOnlyTotal;
  const evalAndServicesTotal =
    screeningsCLVEVisionDevicesTotal +
    screeningsCLVEVisionCounselingTotal +
    screeningsCLVEVisionTrainingTotal +
    screeningsCLVEVisionDevicesCounselingTotal +
    screeningsCLVEVisionDevicesTrainingTotal +
    screeningsCLVEVisionCounselingTrainingTotal +
    screeningsCLVEVisionDevicesCounselingTrainingTotal;
  // Add rows to the aggregated hospital data
  aggregatedHospitalData.push(lveRow);
  aggregatedHospitalData.push(veRow);
  aggregatedHospitalData.push(clveRow);
  aggregatedHospitalData.push(ceRow);
  aggregatedHospitalData.push(trainingRow);
  aggregatedHospitalData.push(...trainingTypesList.map((item) => item.tRow));
  aggregatedHospitalData.push(overallTrainingRow);
  aggregatedHospitalData.push(devicesRow);
  aggregatedHospitalData.push(blankRow);
  aggregatedHospitalData.push({ Programs1: "Accurate Beneficiary Count (no double counting)", Programs2: "" });
  if (filteredSummary.length !== 1 || evaluationsTotal !== 0) {
    aggregatedHospitalData.push(blankRow);
    aggregatedHospitalData.push({ Programs1: "Evaluations Only: ", Programs2: "" });
    aggregatedHospitalData.push(blankRow);
  }
  if (filteredSummary.length !== 1 || screeningsOnlyBeneficiariesTotal !== 0)
    aggregatedHospitalData.push(screeningsOnlyRow);
  if (filteredSummary.length !== 1 || visionEnhancementOnlyBeneficiariesTotal !== 0)
    aggregatedHospitalData.push(visionEnhancementOnlyRow);
  if (filteredSummary.length !== 1 || clveOnlyBeneficiariesTotal !== 0) aggregatedHospitalData.push(clveOnlyRow);
  if (filteredSummary.length !== 1 || screeningsAndCLVETotal !== 0) aggregatedHospitalData.push(screeningsAndCLVERow);
  if (filteredSummary.length !== 1 || visionCLVETotal !== 0) aggregatedHospitalData.push(visionCLVERow);
  if (filteredSummary.length !== 1 || screeningsVisionEnhancementBeneficiariesTotal !== 0)
    aggregatedHospitalData.push(screeningsVisionEnhancementRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionRow);
  if (filteredSummary.length !== 1 || servicesTotal !== 0) {
    aggregatedHospitalData.push(blankRow);
    aggregatedHospitalData.push({ Programs1: "Services Only: ", Programs2: "" });
    aggregatedHospitalData.push(blankRow);
  }
  if (filteredSummary.length !== 1 || trainingOnlyTotal !== 0) aggregatedHospitalData.push(trainingOnlyRow);
  if (filteredSummary.length !== 1 || counselingOnlyTotal !== 0) aggregatedHospitalData.push(counselingOnlyRow);
  if (filteredSummary.length !== 1 || devicesOnlyTotal !== 0) aggregatedHospitalData.push(devicesOnlyRow);
  if (filteredSummary.length !== 1 || trainingCounselingOnlyTotal !== 0)
    aggregatedHospitalData.push(trainingCounselingOnlyRow);
  if (filteredSummary.length !== 1 || trainingDevicesOnlyTotal !== 0)
    aggregatedHospitalData.push(trainingDevicesOnlyRow);
  if (filteredSummary.length !== 1 || counselingDevicesOnlyTotal !== 0)
    aggregatedHospitalData.push(counselingDevicesOnlyRow);
  if (filteredSummary.length !== 1 || trainingDevicesCounselingOnlyTotal !== 0)
    aggregatedHospitalData.push(trainingDevicesCounselingOnlyRow);
  if (filteredSummary.length !== 1 || evalAndServicesTotal !== 0) {
    aggregatedHospitalData.push(blankRow);
    aggregatedHospitalData.push({ Programs1: "Evaluation(s) + Services: ", Programs2: "" });
    aggregatedHospitalData.push(blankRow);
  }
  if (filteredSummary.length !== 1 || screeningsCLVEVisionDevicesTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionDevicesRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionCounselingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionCounselingRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionTrainingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionTrainingRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionDevicesCounselingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionDevicesCounselingRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionDevicesTrainingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionDevicesTrainingRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionCounselingTrainingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionCounselingTrainingRow);
  if (filteredSummary.length !== 1 || screeningsCLVEVisionDevicesCounselingTrainingTotal !== 0)
    aggregatedHospitalData.push(screeningsCLVEVisionDevicesCounselingTrainingRow);
  aggregatedHospitalData.push(blankRow);
  aggregatedHospitalData.push(totalBeneficiariesRow);
  aggregatedHospitalData.push(blankRow);
  aggregatedHospitalData.push(mdviRow);

  return { aggregatedHospitalData, otSessionsTotal, totalBeneficiariesTotal, uniqueBeneficiaries };
}

// Sorting function
function sortDataByKeyAndDate(obj, key) {
  obj.sort((a, b) => {
    // Handle blank values for key
    if (!a[key]) return 1; // a[key] is blank, b[key] should come first
    if (!b[key]) return -1; // b[key] is blank, a[key] should come first

    // Sort by key
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;

    // If key is the same, sort by "Date"
    const dateA = new Date(a["Date of Evaluation"]);
    const dateB = new Date(b["Date of Evaluation"]);
    return dateA - dateB;
  });
}

function sortDataByDate(obj) {
  obj.sort((a, b) => {
    const dateA = new Date(a["Date of Evaluation"]);
    const dateB = new Date(b["Date of Evaluation"]);
    return dateA - dateB;
  });
}

// format the date elements in the given object
function formatDateElements(obj) {
  obj.map((item) => {
    item["Date of Evaluation"] = getFormattedDate(item["Date of Evaluation"]);
  });
}

// This function is used to filter the entire summary data by date range
export function filterTrainingSummaryByDateRange(startDate, endDate, summary, summaryType) {
  if (!Array.isArray(summary)) {
    console.error(`Expected an array for ${summaryType} data, but received`, summary);
    return []; // Return an empty array if summary is not an array
  }

  const filteredSummary = summary.map((element) => {
    const visionEnhancement = (element.visionEnhancement || []).filter((training) => {
      return filterByDate(training, startDate, endDate);
    });

    const training = (element.training || []).filter((training) => {
      return filterByDate(training, startDate, endDate);
    });

    const counsellingEducation = (element.counsellingEducation || []).filter((training) => {
      return filterByDate(training, startDate, endDate);
    });

    const comprehensiveLowVisionEvaluation = (element.comprehensiveLowVisionEvaluation || []).filter((training) => {
      return filterByDate(training, startDate, endDate);
    });

    const lowVisionEvaluation = (element.lowVisionEvaluation || []).filter((training) => {
      return filterByDate(training, startDate, endDate);
    });

    let filteredElement = {
      ...element,
      training,
      visionEnhancement,
      counsellingEducation,
      comprehensiveLowVisionEvaluation,
      lowVisionEvaluation,
    };

    if (summaryType === "hospital") {
      const beneficiary = element.beneficiary;

      return {
        ...filteredElement,
        beneficiary,
      };
    } else if (summaryType === "beneficiary") {
      return filteredElement;
    }
  });

  return filteredSummary;
}

// Sets the header for CLVE sheet, including merged cells and sub-headers
export function setClveHeader(wclve) {
  XLSX.utils.sheet_add_aoa(wclve, [clveMainHeader, clveSubHeader]);
  wclve["!merges"] = [
    mergeHeaderCells({ col: 0, rowSpan: 1 }), // Date
    mergeHeaderCells({ col: 1, rowSpan: 1 }), // MRN
    mergeHeaderCells({ col: 2, rowSpan: 1 }), // Name of the Patient
    mergeHeaderCells({ col: 3, rowSpan: 1 }), // Age
    mergeHeaderCells({ col: 4, rowSpan: 1 }), // Gender
    mergeHeaderCells({ col: 5, rowSpan: 1 }), // Education
    mergeHeaderCells({ col: 6, rowSpan: 1 }), // Occupation
    mergeHeaderCells({ col: 7, rowSpan: 1 }), // Diagnosis
    mergeHeaderCells({ col: 8, rowSpan: 1 }), // Diagnosis Notes
    mergeHeaderCells({ col: 9, rowSpan: 1 }), // District
    mergeHeaderCells({ col: 10, rowSpan: 1 }), // State
    mergeHeaderCells({ col: 11, colSpan: 3 }), // { s: { r: 0, c: 11 }, e: { r: 0, c: 14 } }, Title: Acuity
    mergeHeaderCells({ col: 15, colSpan: 3 }), // { s: { r: 0, c: 15 }, e: { r: 0, c: 18 } }, Title: Near Visual Acuity
    mergeHeaderCells({ col: 19, rowSpan: 1 }), // Recommended Optical Aid
    mergeHeaderCells({ col: 20, rowSpan: 1 }), // Recommended Non-Optical Aid
    mergeHeaderCells({ col: 21, rowSpan: 1 }), // Recommended Electronic Aid
    mergeHeaderCells({ col: 22, rowSpan: 1 }), // Spectacles (Refractive Error Only)
    mergeHeaderCells({ col: 23, rowSpan: 1 }), // Dispensed Optical Aid
    mergeHeaderCells({ col: 24, rowSpan: 1 }), // Dispensed Non-Optical Aid
    mergeHeaderCells({ col: 25, rowSpan: 1 }), // Dispensed Electronic Aid
    mergeHeaderCells({ col: 26, rowSpan: 1 }), // Dispensed Spectacles (Refractive Error Only)
    mergeHeaderCells({ col: 27, colSpan: 1 }), // { s: { r: 0, c: 27 }, e: { r: 0, c: 28 } }, Title: Color Vision
    mergeHeaderCells({ col: 29, colSpan: 1 }), // { s: { r: 0, c: 29 }, e: { r: 0, c: 30 } }, Title: Contrast Sensitivity
    mergeHeaderCells({ col: 31, colSpan: 1 }), // { s: { r: 0, c: 31 }, e: { r: 0, c: 32 } }, Title: Visual Fields
    mergeHeaderCells({ col: 33, rowSpan: 1 }), // Cost of all the aids dispensed
    mergeHeaderCells({ col: 34, rowSpan: 1 }), // Cost to the Beneficiary
    mergeHeaderCells({ col: 35, rowSpan: 1 }), // Comments
  ];

  return wclve;
}

// Sets the header for Low Vision Screening sheet, including merged cells and sub-headers
export function setLveHeader(wlved) {
  XLSX.utils.sheet_add_aoa(wlved, [lveMainHeader, lveSubHeader]);
  wlved["!merges"] = [
    mergeHeaderCells({ col: 0, rowSpan: 1 }), // {s: {r: 0, c: 0}, e: {r: 1, c: 0}}, Title: Index
    mergeHeaderCells({ col: 1, rowSpan: 1 }), // Date
    mergeHeaderCells({ col: 2, rowSpan: 1 }), // MRN
    mergeHeaderCells({ col: 3, rowSpan: 1 }), // Name of the Patient
    mergeHeaderCells({ col: 4, rowSpan: 1 }), // Age
    mergeHeaderCells({ col: 5, rowSpan: 1 }), // Gender
    mergeHeaderCells({ col: 6, rowSpan: 1 }), // Education
    mergeHeaderCells({ col: 7, rowSpan: 1 }), // Occupation
    mergeHeaderCells({ col: 8, rowSpan: 1 }), // Diagnosis
    mergeHeaderCells({ col: 9, rowSpan: 1 }), // District
    mergeHeaderCells({ col: 10, rowSpan: 1 }), // State
    mergeHeaderCells({ col: 11, rowSpan: 1 }), // Session Number
    mergeHeaderCells({ col: 12, rowSpan: 1 }), // MDVI
    mergeHeaderCells({ col: 13, colSpan: 3 }), // { s: { r: 0, c: 13 }, e: { r: 0, c: 16 } }, Title: Acuity
    mergeHeaderCells({ col: 17, colSpan: 3 }), // { s: { r: 0, c: 17 }, e: { r: 0, c: 20 } }, Title: Near Visual Acuity
    mergeHeaderCells({ col: 21, rowSpan: 1 }), // Recommended Optical Aid
    mergeHeaderCells({ col: 22, rowSpan: 1 }), // Recommended Non-Optical Aid
    mergeHeaderCells({ col: 23, rowSpan: 1 }), // Recommended Electronic Aid
    mergeHeaderCells({ col: 24, rowSpan: 1 }), // Spectacles (Refractive Error Only)
    mergeHeaderCells({ col: 25, rowSpan: 1 }), // Extra Information
  ];
}

// Sets the header for Aggregated Hospital Data sheet, including merged cells and sub-headers
export function setAhdHeader(wahd, hospitals) {
  let { ahdMainHeader, ahdSubHeader1, ahdSubHeader2 } = populateAhdHeaders(hospitals);
  XLSX.utils.sheet_add_aoa(wahd, [ahdMainHeader, ahdSubHeader1, ahdSubHeader2]);
  wahd["!merges"] = [
    mergeHeaderCells({ row: 0, col: 0, rowSpan: 2, colSpan: 1 }), // { s: { r: 0, c: 0 }, e: { r: 2, c: 1 } }, Title: Programs
    mergeHeaderCells({ col: 2, colSpan: hospitals.length * 2 - 1 }), // { s: { r: 0, c: 2 }, e: { r: 0, c: 2 + (hospitals.length * 2 - 1) } }, Title: Hospitals (Break up)
    mergeHeaderCells({
      row: 0,
      col: 2 + hospitals.length * 2,
      rowSpan: 1,
      colSpan: 1,
    }), // { s: { r: 0, c: 2 + hospitals.length * 2 }, e: { r: 1, c: 2 + hospitals.length * 2 + 1 } }, Title: Beneficiaries of Hospitals
  ];

  let currentColumn = 2;
  for (let i = 0; i < hospitals.length; i++) {
    wahd["!merges"].push(mergeHeaderCells({ row: 1, col: currentColumn, colSpan: 1 }));
    currentColumn += 2;
  }
}

// Get data for all sheets in the Report Excel
export function getReportData(filteredBeneficiaryData, filteredSummary, includeAllBeneficiaries) {
  const beneficiaryData = [];
  const visionEnhancementData = [];
  const lowVisionEvaluationData = [];
  const comprehensiveLowVisionEvaluationData = [];
  const electronicDevicesData = [];
  const trainingData = [];
  const counsellingEducationData = [];
  const { aggregatedHospitalData } = getAggregatedHospitalData(
    filteredBeneficiaryData,
    filteredSummary,
    includeAllBeneficiaries
  );

  let edMap = new Map();

  // Filtered Report Download
  for (let beneficiary of filteredBeneficiaryData) {
    // Commmon preceding columns for all sheets
    let commonData = getCommonData(beneficiary);

    // Beneficiary Data Sheet:
    let beneficiaryJson = getBeneficiaryJson(commonData, beneficiary);
    beneficiaryData.push(beneficiaryJson);

    // CLVE sheet and electronic devices sheet:
    let beneficiaryCLVE = beneficiary["Comprehensive_Low_Vision_Evaluation"];
    for (let clveData of beneficiaryCLVE) {
      // CLVE row addition
      let clveJson = getClveJson(commonData, clveData);
      comprehensiveLowVisionEvaluationData.push(clveJson);

      // Electronic device addition to map
      if (isNotNullEmptyOrUndefined(clveData["dispensedElectronic"])) {
        let dispensedElectronic = clveData["dispensedElectronic"].split("; ");
        for (let device of dispensedElectronic) {
          if (isNotNullEmptyOrUndefined(device)) {
            device = device.toUpperCase();
            if (edMap.has(device)) {
              let currentCount = edMap.get(device);
              edMap.set(device, currentCount + 1);
            } else {
              edMap.set(device, 1);
            }
          }
        }
      }
    }

    // Vision Enhancement Sheet
    let beneficiaryVE = beneficiary["Vision_Enhancement"];
    for (let veData of beneficiaryVE) {
      let veJson = getVeJson(commonData, veData);
      visionEnhancementData.push(veJson);
    }

    // Low Vision Enhancement Sheet
    let beneficiaryLVE = beneficiary["Low_Vision_Evaluation"];
    for (let lveData of beneficiaryLVE) {
      let lveJson = getLveJson(commonData, lveData);
      lowVisionEvaluationData.push(lveJson);
    }

    // Training Sheet
    let beneficiaryT = beneficiary["Training"];
    for (let tData of beneficiaryT) {
      let tJson = getTrainingJson(commonData, tData);
      trainingData.push(tJson);
    }

    // Counseling Education Sheet
    let beneficiaryCE = beneficiary["Counselling_Education"];
    for (let ceData of beneficiaryCE) {
      let ceJson = getCeJson(commonData, ceData);
      counsellingEducationData.push(ceJson);
    }
  }

  // Sort the different sheets
  sortDataByDate(visionEnhancementData);
  sortDataByDate(lowVisionEvaluationData);
  sortDataByDate(comprehensiveLowVisionEvaluationData);
  sortDataByKeyAndDate(counsellingEducationData, "Type");
  sortDataByKeyAndDate(trainingData, "Type of Training");

  // Change the date formats for all the sheets
  formatDateElements(visionEnhancementData);
  formatDateElements(lowVisionEvaluationData);
  formatDateElements(comprehensiveLowVisionEvaluationData);
  formatDateElements(counsellingEducationData);
  formatDateElements(trainingData);

  for (let [device, count] of edMap) {
    let edJson = { "Device Name": device, Count: count };
    electronicDevicesData.push(edJson);
  }

  return {
    beneficiaryData,
    visionEnhancementData,
    lowVisionEvaluationData,
    comprehensiveLowVisionEvaluationData,
    electronicDevicesData,
    trainingData,
    counsellingEducationData,
    aggregatedHospitalData,
  };
}
