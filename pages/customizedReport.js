// export default ReportCustomizer;
import moment from 'moment';
import { useState } from 'react';
import XLSX from 'xlsx-js-style';
import { calculateAge } from "@/global/calculate-age";
import {
  setAhdHeader,
  setClveHeader,
  setLveHeader,
  getReportData,
  filterTrainingSummaryByDateRange,
} from '@/constants/reportFunctions';

function ReportCustomizer(props) {
  const {
    summary =[],
    trainingTypes= [],
    startDate: initialStartDate,
    endDate: initialEndDate,
    selectedHospitals: initialSelectedHospitals = [],
  } = props;

  const [startDate, setStartDate] = useState(
    initialStartDate || moment().subtract(1, 'year').toDate()
  );
  const [endDate, setEndDate] = useState(
    initialEndDate || moment().toDate()
  );
  const [selectedHospitals, setSelectedHospitals] = useState(
    initialSelectedHospitals || []
  );
  const [selectedGenders, setSelectedGenders] = useState([
    'M',
    'F',
    'Other',
  ]);
  const [selectedMdvi, setSelectedMdvi] = useState([
    'Yes',
    'No',
    'At Risk',
  ]);
  const [selectedSheets, setSelectedSheets] = useState([
    'Beneficiary',
    'Vision Enhancement',
    'Low Vision Screening',
    'Comprehensive Low Vision Evaluation',
    'Electronic Devices Break Up',
    'Training',
    'Counselling Education',
    'Aggregated Hospital Data',
  ]);
  const [selectedTrainingTypes, setSelectedTrainingTypes] = useState(
    trainingTypes || []
  );
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(100);

  // Event Handlers
  const updateGender = (e) => {
    const gender = e.target.id;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedGenders((prev) => [...prev, gender]);
    } else {
      setSelectedGenders((prev) => prev.filter((g) => g !== gender));
    }
  };

  const updateMdvi = (e) => {
    const mdvi = e.target.id;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedMdvi((prev) => [...prev, mdvi]);
    } else {
      setSelectedMdvi((prev) => prev.filter((m) => m !== mdvi));
    }
  };

  const updateSheets = (e) => {
    const sheet = e.target.id;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedSheets((prev) => [...prev, sheet]);
    } else {
      setSelectedSheets((prev) => prev.filter((s) => s !== sheet));
    }
  };

  const updateTrainingTypes = (e) => {
    const trainingType = e.target.id;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedTrainingTypes((prev) => [...prev, trainingType]);
    } else {
      setSelectedTrainingTypes((prev) =>
        prev.filter((t) => t !== trainingType)
      );
    }
  };

  const downloadFilteredReport = async () => {
    try {
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setUTCHours(0, 0, 0, 0);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);

      const selectedHospitalIds = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.id);

      const beneficiaryListAPI = selectedHospitalIds.map((id) =>
        fetch(
          `/api/beneficiaryList?id=${id}&startDate=${adjustedStartDate.toUTCString()}&endDate=${adjustedEndDate.toUTCString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
      let promises = await Promise.all(beneficiaryListAPI);
      const finalResult = await Promise.all(
        promises.map((res) => (res.json ? res.json().catch((err) => err) : res))
      );
      const beneficiaryList = finalResult.flat();

      const dateFilteredBeneficiaryData = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        beneficiaryList,
        'beneficiary'
      );

      const numTotalBeneficiaries = dateFilteredBeneficiaryData.length;

      const filteredBeneficiaryData = dateFilteredBeneficiaryData.filter(
        (item) =>
          selectedHospitalIds.includes(item.hospital.id) &&
          selectedGenders.includes(item.gender) &&
          selectedMdvi.includes(item.mDVI) &&
          minAge <= calculateAge(item.dateOfBirth) &&
          calculateAge(item.dateOfBirth) <= maxAge
      );

      const numFilteredBeneficiaries = filteredBeneficiaryData.length;

      // Filter summary data based on start and end date of the training
      const dateFilteredSummary = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        summary,
        'hospital'
      );

      // Filter summary data based on selected hospitals
      const filteredSummary = dateFilteredSummary.filter((item) =>
        selectedHospitalIds.includes(item.id)
      );

      const {
        visionEnhancementData,
        lowVisionEvaluationData,
        comprehensiveLowVisionEvaluationData,
        electronicDevicesData,
        trainingData,
        counsellingEducationData,
        aggregatedHospitalData,
      } = getReportData(
        filteredBeneficiaryData,
        filteredSummary,
        numTotalBeneficiaries === numFilteredBeneficiaries
      );

      const wb = XLSX.utils.book_new();

      if (selectedSheets.includes("Beneficiary")) {
        const wben = XLSX.utils.json_to_sheet(filteredBeneficiaryData);
        XLSX.utils.book_append_sheet(wb, wben, "Beneficiary Sheet");
      }

      if (selectedSheets.includes("Vision Enhancement")) {
        const wved = XLSX.utils.json_to_sheet(visionEnhancementData);
        XLSX.utils.book_append_sheet(wb, wved, "Vision Enhancement Sheet");
      }

      if (selectedSheets.includes("Low Vision Screening")) {
        const wlved = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wlved, "Low Vision Screening");
        setLveHeader(wlved);
        XLSX.utils.sheet_add_json(wlved, lowVisionEvaluationData, {
          skipHeader: true,
          origin: -1,
        });
      }

      if (selectedSheets.includes("Comprehensive Low Vision Evaluation")) {
        const wclve = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wclve, "CLVE Sheet");
        setClveHeader(wclve);
        XLSX.utils.sheet_add_json(wclve, comprehensiveLowVisionEvaluationData, {
          skipHeader: true,
          origin: -1,
        });
      }

      if (selectedSheets.includes("Electronic Devices Break Up")) {
        const wed = XLSX.utils.json_to_sheet(electronicDevicesData);
        XLSX.utils.book_append_sheet(wb, wed, "Electronic Devices Break Up");
      }

      if (selectedSheets.includes("Training")) {
        let finalTrainingData = trainingData;
        // Check if less number of training types are selected compared to the total number of training types
        if (trainingTypes.length > selectedTrainingTypes.length) {
          // "Type of Training" is a column title in the Training sheet
          finalTrainingData = trainingData.filter((training) =>
            selectedTrainingTypes.includes(training["Type of Training"])
          );
        }
        const wtd = XLSX.utils.json_to_sheet(finalTrainingData);
        XLSX.utils.book_append_sheet(wb, wtd, "Training Sheet");
      }

      if (selectedSheets.includes("Counselling Education")) {
        const wced = XLSX.utils.json_to_sheet(counsellingEducationData);
        XLSX.utils.book_append_sheet(wb, wced, "Counselling Education Sheet");
      }

      if (selectedSheets.includes("Aggregated Hospital Data")) {
        const wahd = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wahd, "Aggregated Hospital Sheet");
        setAhdHeader(
          wahd,
          filteredSummary.map((hospital) => hospital.name)
        );
        XLSX.utils.sheet_add_json(wahd, aggregatedHospitalData, {
          skipHeader: true,
          origin: -1,
        });
      }

      XLSX.writeFile(wb, "customized_report.xlsx");
    } catch (error) {
      console.error('Error fetching beneficiary list:', error);
    }
  };

  return (
    <div className="content">
      <div className="container p-4 mb-3">
        <div className="accordion">
          {/* Date Range */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingDateRange">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseDateRange"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseDateRange"
              >
                <strong>Date Range</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseDateRange"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingDateRange"
            >
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-4 text-align-left">
                    <label>Start Date: </label>
                    <input
                      type="date"
                      value={moment(startDate).format('YYYY-MM-DD')}
                      onChange={(e) => setStartDate(moment(e.target.value).toDate())}
                      className="margin-left"
                    />
                  </div>
                  <div className="col-md-4 text-align-left">
                    <label>End Date: </label>
                    <input
                      type="date"
                      value={moment(endDate).format('YYYY-MM-DD')}
                      onChange={(e) => setEndDate(moment(e.target.value).toDate())}
                      className="margin-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hospitals */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingHospitals">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseHospitals"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseHospitals"
              >
                <strong>Hospitals</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseHospitals"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingHospitals"
            >
              <div className="accordion-body">
                <div className="row">
                  {summary.map((hospital) => (
                    <div className="col-md-6 text-align-left" key={hospital.id}>
                      <input
                        type="checkbox"
                        id={hospital.id}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          if (isChecked) {
                            setSelectedHospitals((prev) => [...prev, hospital.name]);
                          } else {
                            setSelectedHospitals((prev) =>
                              prev.filter((h) => h !== hospital.name)
                            );
                          }
                        }}
                        checked={selectedHospitals.includes(hospital.name)}
                      />
                      <label className="margin-left">{hospital.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingThree">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseThree"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseThree"
              >
                <strong>Gender</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseThree"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingThree"
            >
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="M"
                      onChange={(e) => updateGender(e)}
                      checked={selectedGenders.includes("M")}
                    />
                    <label className="margin-left">Male</label>
                  </div>

                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="F"
                      onChange={(e) => updateGender(e)}
                      checked={selectedGenders.includes("F")}
                    />
                    <label className="margin-left">Female</label>
                  </div>

                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="Other"
                      onChange={(e) => updateGender(e)}
                      checked={selectedGenders.includes("Other")}
                    />
                    <label className="margin-left">Other</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Age */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingFour">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseFour"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseFour"
              >
                <strong>Age</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseFour"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingFour"
            >
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-4 text-align-left">
                    <label>Minimum Age: </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="margin-left"
                    />
                  </div>

                  <div className="col-md-4 text-align-left">
                    <label>Maximum Age: </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="margin-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MDVI */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingFive">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseFive"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseFive"
              >
                <strong>MDVI</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseFive"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingFive"
            >
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="Yes"
                      onChange={(e) => updateMdvi(e)}
                      checked={selectedMdvi.includes("Yes")}
                    />
                    <label className="margin-left">Yes</label>
                  </div>

                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="No"
                      onChange={(e) => updateMdvi(e)}
                      checked={selectedMdvi.includes("No")}
                    />
                    <label className="margin-left">No</label>
                  </div>

                  <div className="col-md-2 text-align-left">
                    <input
                      type="checkbox"
                      id="At Risk"
                      onChange={(e) => updateMdvi(e)}
                      checked={selectedMdvi.includes("At Risk")}
                    />
                    <label className="margin-left">At Risk</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sheets to Include */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="panelsStayOpen-headingSix">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#panelsStayOpen-collapseSix"
                aria-expanded="false"
                aria-controls="panelsStayOpen-collapseSix"
              >
                <strong>Sheets To Include</strong>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseSix"
              className="accordion-collapse collapse"
              aria-labelledby="panelsStayOpen-headingSix"
            >
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Beneficiary"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes("Beneficiary")}
                    />
                    <label className="margin-left">Beneficiary</label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Vision Enhancement"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes("Vision Enhancement")}
                    />
                    <label className="margin-left">Vision Enhancement</label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Low Vision Screening"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes("Low Vision Screening")}
                    />
                    <label className="margin-left">Low Vision Screening</label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Comprehensive Low Vision Evaluation"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes(
                        "Comprehensive Low Vision Evaluation"
                      )}
                    />
                    <label className="margin-left">
                      Comprehensive Low Vision Evaluation
                    </label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Electronic Devices Break Up"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes(
                        "Electronic Devices Break Up"
                      )}
                    />
                    <label className="margin-left">
                      Electronic Devices Break Up
                    </label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Training"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes("Training")}
                    />
                    <label className="margin-left">Training</label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Counselling Education"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes("Counselling Education")}
                    />
                    <label className="margin-left">Counselling Education</label>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 text-align-left">
                    <input
                      type="checkbox"
                      id="Aggregated Hospital Data"
                      onChange={(e) => updateSheets(e)}
                      checked={selectedSheets.includes(
                        "Aggregated Hospital Data"
                      )}
                    />
                    <label className="margin-left">
                      Aggregated Hospital Data
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedSheets.includes("Training") && (
            <div className="accordion-item">
              <h2 className="accordion-header" id="panelsStayOpen-headingSeven">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#panelsStayOpen-collapseSeven"
                  aria-expanded="false"
                  aria-controls="panelsStayOpen-collapseSeven"
                >
                  <strong>Training Types</strong>
                </button>
              </h2>
              <div
                id="panelsStayOpen-collapseSeven"
                className="accordion-collapse collapse"
                aria-labelledby="panelsStayOpen-headingSeven"
              >
                <div className="accordion-body">
                  {trainingTypes && trainingTypes.length > 0 ? (
                    trainingTypes.map((type) => (
                      <div className="row" key={type}>
                        <div className="col-md-6 text-align-left">
                          <input
                            type="checkbox"
                            id={type}
                            onChange={(e) => updateTrainingTypes(e)}
                            checked={selectedTrainingTypes.includes(type)}
                          />
                          <label className="margin-left">{type}</label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No training types available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <br />
        <button
          className="btn btn-success border-0 btn-block"
          onClick={() => downloadFilteredReport()}
        >
          Download Customized Report
        </button>
        <br />
        <br />
      </div>
      <br />
    </div>
  );
}

export default ReportCustomizer;
