import { useEffect, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { Select, FormControl } from "@mui/material";
import {
  otherField,
  logMARValues,
  sixmValues,
  twentyftValues,
  logMARNVValues,
  nScaleValues,
  mUnitsValues,
  snellenImperialValues,
  snellenMetricValues,
} from "../../constants/acuityConstants";
import { createMenu } from "@/constants/globalFunctions";
import { comma, CLVEDiagnosis } from "@/constants/generalConstants";
import { spectacleDevices } from "@/constants/devicesConstants";
import { jsonToCSV } from "react-papaparse";
import moment from "moment";
import { required } from "../../comps/required";

const TrainingFormCommunityScreening = ({
  addNewTraining,
  updateMDVIForBeneficiary,
  mdvi,
  loading,
  onSubmit,
}) => {
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 600,
      },
    },
  };

  if (mdvi === null || mdvi === undefined || mdvi === "") {
    mdvi = "No";
  }
  const [mdviValue, setMdviValue] = useState(mdvi);
  const [section, setSection] = useState("presentingVision");
  const [diagnosis, setDiagnosis] = useState([]);
  const requiresDiagnosisNotes = diagnosis.some((d) => 
    ["Anterior Segment Condition", "Posterior Eye Disease", "Hereditary Eye Disease", "Neuro-ophthalmic Condition", "Others", "Other"].includes(d)
  );

  const [devices, setDevices] = useState({
    recommendationSpectacle: [],
    dispensedSpectacle: [],
  });
  const [showOther, setShowOther] = useState({
    recommendationSpectacle: false,
    dispensedSpectacle: false,
  });

  const handleMultiSelectChange = (e, field) => {
    const value = e.target.value;
    setDevices({ ...devices, [field]: value });
    if (value.includes("Other")) {
      setShowOther({ ...showOther, [field]: true });
    } else {
      setShowOther({ ...showOther, [field]: false });
    }
  };

  const recommendationSpectacleOptions = createMenu(spectacleDevices, true, devices["recommendationSpectacle"]);

  let config = { quotes: true, quoteChar: '"' };
  const [formData, setFormData] = useState({
    unitUncorrectedDistance: "LogMAR",
    unitUncorrectedNear: "LogMAR",
    unitBestCorrectedDistance: "LogMAR",
    unitBestCorrectedNear: "LogMAR",
  });

  // Acuity value lists for each category
  const [uncorrectedDistanceValues, setUncorrectedDistanceValues] = useState(logMARValues);
  const [uncorrectedNearValues, setUncorrectedNearValues] = useState(logMARNVValues);
  const [bestCorrectedDistanceValues, setBestCorrectedDistanceValues] = useState(logMARValues);
  const [bestCorrectedNearValues, setBestCorrectedNearValues] = useState(logMARNVValues);

  // Field groups
  const uncorrectedDistanceFields = ["uncorrectedDistanceRE", "uncorrectedDistanceLE", "uncorrectedDistanceBE"];
  const uncorrectedNearFields = ["uncorrectedNearRE", "uncorrectedNearLE", "uncorrectedNearBE"];
  const bestCorrectedDistanceFields = ["bestCorrectedDistanceRE", "bestCorrectedDistanceLE", "bestCorrectedDistanceBE"];
  const bestCorrectedNearFields = ["bestCorrectedNearRE", "bestCorrectedNearLE", "bestCorrectedNearBE"];

  const fieldLabels = {
    uncorrectedDistanceRE: "RE (Right Eye)",
    uncorrectedDistanceLE: "LE (Left Eye)",
    uncorrectedDistanceBE: "BE (Both Eyes)",
    uncorrectedNearRE: "RE (Right Eye)",
    uncorrectedNearLE: "LE (Left Eye)",
    uncorrectedNearBE: "BE (Both Eyes)",
    bestCorrectedDistanceRE: "RE (Right Eye)",
    bestCorrectedDistanceLE: "LE (Left Eye)",
    bestCorrectedDistanceBE: "BE (Both Eyes)",
    bestCorrectedNearRE: "RE (Right Eye)",
    bestCorrectedNearLE: "LE (Left Eye)",
    bestCorrectedNearBE: "BE (Both Eyes)",
  };

  // Initialize field defaults when acuity values change
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    uncorrectedDistanceFields.forEach((field) => {
      setFormData((prev) => ({ ...prev, [field]: uncorrectedDistanceValues[0] }));
    });
  }, [uncorrectedDistanceValues]);

  useEffect(() => {
    uncorrectedNearFields.forEach((field) => {
      setFormData((prev) => ({ ...prev, [field]: uncorrectedNearValues[0] }));
    });
  }, [uncorrectedNearValues]);

  useEffect(() => {
    bestCorrectedDistanceFields.forEach((field) => {
      setFormData((prev) => ({ ...prev, [field]: bestCorrectedDistanceValues[0] }));
    });
  }, [bestCorrectedDistanceValues]);

  useEffect(() => {
    bestCorrectedNearFields.forEach((field) => {
      setFormData((prev) => ({ ...prev, [field]: bestCorrectedNearValues[0] }));
    });
  }, [bestCorrectedNearValues]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const createOptionList = (values) => {
    return values.map((value) => <option key={value}>{value}</option>);
  };

  // Distance metric changers
  const changeUncorrectedDistanceValues = (e) => {
    setFormData((prev) => ({ ...prev, unitUncorrectedDistance: e.target.value }));
    if (e.target.value == "LogMAR") setUncorrectedDistanceValues(logMARValues);
    else if (e.target.value == "6m") setUncorrectedDistanceValues(sixmValues);
    else if (e.target.value == "20ft") setUncorrectedDistanceValues(twentyftValues);
  };

  const changeBestCorrectedDistanceValues = (e) => {
    setFormData((prev) => ({ ...prev, unitBestCorrectedDistance: e.target.value }));
    if (e.target.value == "LogMAR") setBestCorrectedDistanceValues(logMARValues);
    else if (e.target.value == "6m") setBestCorrectedDistanceValues(sixmValues);
    else if (e.target.value == "20ft") setBestCorrectedDistanceValues(twentyftValues);
  };

  // Near metric changers
  const changeUncorrectedNearValues = (e) => {
    setFormData((prev) => ({ ...prev, unitUncorrectedNear: e.target.value }));
    if (e.target.value == "LogMAR") setUncorrectedNearValues(logMARNVValues);
    else if (e.target.value == "N-scale") setUncorrectedNearValues(nScaleValues);
    else if (e.target.value == "M-units") setUncorrectedNearValues(mUnitsValues);
    else if (e.target.value == "Snellen - Imperial") setUncorrectedNearValues(snellenImperialValues);
    else if (e.target.value == "Snellen - Metric") setUncorrectedNearValues(snellenMetricValues);
  };

  const changeBestCorrectedNearValues = (e) => {
    setFormData((prev) => ({ ...prev, unitBestCorrectedNear: e.target.value }));
    if (e.target.value == "LogMAR") setBestCorrectedNearValues(logMARNVValues);
    else if (e.target.value == "N-scale") setBestCorrectedNearValues(nScaleValues);
    else if (e.target.value == "M-units") setBestCorrectedNearValues(mUnitsValues);
    else if (e.target.value == "Snellen - Imperial") setBestCorrectedNearValues(snellenImperialValues);
    else if (e.target.value == "Snellen - Metric") setBestCorrectedNearValues(snellenMetricValues);
  };

  const diagnosisOptions = createMenu(CLVEDiagnosis, true, diagnosis);

  const handleDiagnosisChange = (e) => {
    const { target: { value } } = e;
    setDiagnosis(value);
  };

  const updateFormData = (e, fieldName) => {
    if (e.target.type == "date") {
      const parsed = new Date(e.target.value + "T00:00:00");
      setFormData((prev) => ({ ...prev, [fieldName]: parsed }));
    } else if (e.target.type == "number") {
      setFormData((prev) => ({ ...prev, [fieldName]: parseInt(e.target.value) }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
    }
  };

  const validateForm = () => {
    const form = document.getElementById("community_screening_form");
    let isValid = true;
    for (const input of form.elements) {
      if (input.required) {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = "red";
        } else {
          input.style.borderColor = "";
        }
      }
    }
    return isValid;
  };

  const handleSubmit = () => {
    const isValid = validateForm();
    if (!isValid) {
      alert("Please complete all required fields!");
      return;
    }
    onSubmit(true);

    // Append units to acuity values
    const appendUnit = (value, unit) => {
      if (!value || value === otherField) return value;
      return value + " " + unit;
    };

    if (showOther.recommendationSpectacle) {
      devices.recommendationSpectacle.splice(devices.recommendationSpectacle.indexOf("Other"), 1);
      devices.recommendationSpectacle.push(formData["recommendationSpectacleOther"]);
    }
    
    const newScreening = {
      diagnosis: diagnosis.join(", ").trim(),
      diagnosisNotes: requiresDiagnosisNotes ? (formData["diagnosisNotes"] ?? "") : "",
      mdvi: mdviValue,
      date: formData["date"] ?? null,
      sessionNumber: formData["sessionNumber"] ?? null,
      uncorrectedDistanceRE: appendUnit(formData["uncorrectedDistanceRE"], formData["unitUncorrectedDistance"]),
      uncorrectedDistanceLE: appendUnit(formData["uncorrectedDistanceLE"], formData["unitUncorrectedDistance"]),
      uncorrectedDistanceBE: appendUnit(formData["uncorrectedDistanceBE"], formData["unitUncorrectedDistance"]),
      uncorrectedNearRE: appendUnit(formData["uncorrectedNearRE"], formData["unitUncorrectedNear"]),
      uncorrectedNearLE: appendUnit(formData["uncorrectedNearLE"], formData["unitUncorrectedNear"]),
      uncorrectedNearBE: appendUnit(formData["uncorrectedNearBE"], formData["unitUncorrectedNear"]),
      bestCorrectedDistanceRE: appendUnit(formData["bestCorrectedDistanceRE"], formData["unitBestCorrectedDistance"]),
      bestCorrectedDistanceLE: appendUnit(formData["bestCorrectedDistanceLE"], formData["unitBestCorrectedDistance"]),
      bestCorrectedDistanceBE: appendUnit(formData["bestCorrectedDistanceBE"], formData["unitBestCorrectedDistance"]),
      bestCorrectedNearRE: appendUnit(formData["bestCorrectedNearRE"], formData["unitBestCorrectedNear"]),
      bestCorrectedNearLE: appendUnit(formData["bestCorrectedNearLE"], formData["unitBestCorrectedNear"]),
      bestCorrectedNearBE: appendUnit(formData["bestCorrectedNearBE"], formData["unitBestCorrectedNear"]),
      recommendationSpectacle: devices.recommendationSpectacle.length > 0 ? jsonToCSV([devices.recommendationSpectacle], { ...config, delimiter: comma }) : "",
      dispensedSpectacle: formData["dispensedSpectacle"] ?? "",
      ...(formData["dispensedSpectacle"] === "Yes"
        ? {
            dispensedDateSpectacle: formData["dispensedDateSpectacle"] ? new Date(formData["dispensedDateSpectacle"] + "T00:00:00") : null,
            costSpectacle: formData["costSpectacle"] ?? null,
            costToBeneficiarySpectacle: formData["costToBeneficiarySpectacle"] ?? null,
            trainingGivenSpectacle: formData["trainingGivenSpectacle"] ?? null,
          }
        : {
            dispensedDateSpectacle: null,
            costSpectacle: null,
            costToBeneficiarySpectacle: null,
            trainingGivenSpectacle: null,
          }),
      extraInformation: formData.extraInformation ?? "",
      referral: formData["referral"] ?? "",
    };
    updateMDVIForBeneficiary({ mDVI: mdviValue });
    addNewTraining(newScreening);
  };

  const sectionBtn = (key, label) => (
    <div className="col p-2">
      <button
        className={`w-100 text-align-left ${
          section === key ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
        }`}
        onClick={() => setSection(key)}
      >
        {label}
      </button>
    </div>
  );

  const renderAcuitySection = (fields, values) => (
    <Row>
      {fields.map((field) => (
        <Col key={field}>
          <Form.Group controlId={field}>
            <Form.Label>
              {fieldLabels[field]}
              {required()}
            </Form.Label>
            <Form.Control
              required
              as="select"
              value={formData[field]}
              onChange={(e) => updateFormData(e, field)}
            >
              {createOptionList(values)}
            </Form.Control>
          </Form.Group>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="col-12">
      <div className="row">
        <div className="justify-content-center align-items-center">
          <h3>New Community Screening Form</h3>
        </div>
      </div>
      <hr />
      <div className="row">
        {sectionBtn("presentingVision", "Presenting Vision")}
        {sectionBtn("spectacle", "Spectacle")}
        {sectionBtn("bestCorrectedVision", "Best Corrected Vision")}
      </div>
      <hr />
      <Form className="mt-3" id="community_screening_form">
        {/* Basic Info Section */}
        <div className={section !== "presentingVision" ? "d-none" : "d-block"}>
          <Row>
            <Col>
              <Form.Label>Diagnosis</Form.Label>
              <FormControl fullWidth size="small">
                <Select
                  value={diagnosis}
                  onChange={handleDiagnosisChange}
                  multiple
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={MenuProps}
                >
                  {diagnosisOptions}
                </Select>
              </FormControl>
              {requiresDiagnosisNotes && (
                <Form.Group controlId="diagnosisNotes" className="mt-2">
                  <Form.Label>Diagnosis Notes{required()}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required
                    autoComplete="off"
                    placeholder="Please describe the diagnosis"
                    value={formData["diagnosisNotes"] ?? ""}
                    onChange={(e) => updateFormData(e, "diagnosisNotes")}
                  />
                </Form.Group>
              )}
            </Col>
            <Col>
              <Form.Group controlId="mdvi">
                <Form.Label>CVI / MDVI</Form.Label>
                <Form.Control
                  as="select"
                  value={mdviValue}
                  onChange={(e) => setMdviValue(e.target.value)}
                >
                  <option key="Yes" value="Yes">Yes</option>
                  <option key="No" value="No">No</option>
                  <option key="At Risk" value="At Risk">At Risk</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="date">
                <Form.Label>Date{required()}</Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={formData["date"] ? moment(formData["date"]).format("YYYY-MM-DD") : ""}
                  onChange={(e) => updateFormData(e, "date")}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="sessionNumber">
                <Form.Label>Session Number</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  autoComplete="off"
                  value={formData["sessionNumber"]}
                  onChange={(e) => updateFormData(e, "sessionNumber")}
                />
              </Form.Group>
            </Col>
          </Row>

        </div>

        {/* Uncorrected / Presenting Distance Acuity */}
        <div className={section !== "presentingVision" ? "d-none" : "d-block"}>
          <h5>Uncorrected / Presenting Distance Acuity</h5>
          <Form.Group controlId="unit-uncorrected-distance">
            <Form.Label>Select Distance metric:{required()}</Form.Label>
            <Form.Control
              as="select"
              required
              value={formData["unitUncorrectedDistance"]}
              onChange={changeUncorrectedDistanceValues}
            >
              <option>LogMAR</option>
              <option>6m</option>
              <option>20ft</option>
            </Form.Control>
          </Form.Group>
          {renderAcuitySection(uncorrectedDistanceFields, uncorrectedDistanceValues)}

        </div>

        {/* Uncorrected / Presenting Near Acuity */}
        <div className={section !== "presentingVision" ? "d-none" : "d-block"}>
          <h5>Uncorrected / Presenting Near Acuity</h5>
          <Form.Group controlId="unit-uncorrected-near">
            <Form.Label>Select Near metric:{required()}</Form.Label>
            <Form.Control
              as="select"
              required
              value={formData["unitUncorrectedNear"]}
              onChange={changeUncorrectedNearValues}
            >
              <option>LogMAR</option>
              <option>N-scale</option>
              <option>M-units</option>
              <option>Snellen - Imperial</option>
              <option>Snellen - Metric</option>
            </Form.Control>
          </Form.Group>
          {renderAcuitySection(uncorrectedNearFields, uncorrectedNearValues)}
          <div>
            <br />
            <Button
              className="btn btn-success btn-block border-0"
              type="button"
              onClick={() => setSection("spectacle")}
            >
              Continue
            </Button>
          </div>
        </div>

        {/* Best Corrected Distance Acuity */}
        <div className={section !== "bestCorrectedVision" ? "d-none" : "d-block"}>
          <h5>Best Corrected Distance Acuity</h5>
          <Form.Group controlId="unit-best-corrected-distance">
            <Form.Label>Select Distance metric:{required()}</Form.Label>
            <Form.Control
              as="select"
              required
              value={formData["unitBestCorrectedDistance"]}
              onChange={changeBestCorrectedDistanceValues}
            >
              <option>LogMAR</option>
              <option>6m</option>
              <option>20ft</option>
            </Form.Control>
          </Form.Group>
          {renderAcuitySection(bestCorrectedDistanceFields, bestCorrectedDistanceValues)}

        </div>

        {/* Best Corrected Near Acuity */}
        <div className={section !== "bestCorrectedVision" ? "d-none" : "d-block"}>
          <h5>Best Corrected Near Acuity</h5>
          <Form.Group controlId="unit-best-corrected-near">
            <Form.Label>Select Near metric:{required()}</Form.Label>
            <Form.Control
              as="select"
              required
              value={formData["unitBestCorrectedNear"]}
              onChange={changeBestCorrectedNearValues}
            >
              <option>LogMAR</option>
              <option>N-scale</option>
              <option>M-units</option>
              <option>Snellen - Imperial</option>
              <option>Snellen - Metric</option>
            </Form.Control>
          </Form.Group>
          {renderAcuitySection(bestCorrectedNearFields, bestCorrectedNearValues)}
          <div>
            <br />
            <Button
              className="btn btn-success btn-block border-0"
              type="button"
              disabled={loading}
              onClick={() => handleSubmit()}
            >
              {loading ? "Submitting..." : "Submit Community Screening"}
            </Button>
          </div>
        </div>

        {/* Extra Information */}
        <div className={section !== "spectacle" ? "d-none" : "d-block"}>
          
          <Row>
            <Form.Group controlId="recommendationSpectacle">
              <Form.Label>Recommendation Spectacle</Form.Label>
            </Form.Group>
          </Row>
          <FormControl fullWidth size="small">
            <Select
              value={devices.recommendationSpectacle}
              onChange={(e) => {
                handleMultiSelectChange(e, "recommendationSpectacle");
              }}
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {recommendationSpectacleOptions}
            </Select>
          </FormControl>

          {showOther.recommendationSpectacle && (
            <Form.Group controlId="recommendationSpectacleOther">
              <Form.Label>Other Recommendation Spectacle</Form.Label>
              <Form.Control
                as="input"
                autoComplete="off"
                value={formData["recommendationSpectacleOther"] ?? ""}
                onChange={(e) => updateFormData(e, "recommendationSpectacleOther")}
              />
            </Form.Group>
          )}

          <div className="mt-4">
            <Row className="mt-3">
              <Col>
                <Form.Group controlId="dispensedSpectacle">
                  <Form.Label>Dispensed Spectacle</Form.Label>
                  <Form.Control
                    as="select"
                    value={formData["dispensedSpectacle"] ?? ""}
                    onChange={(e) => updateFormData(e, "dispensedSpectacle")}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              {formData["dispensedSpectacle"] === "Yes" && (
                <Col>
                  <Form.Group controlId="costSpectacle">
                    <Form.Label>Cost Spectacle</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      autoComplete="off"
                      value={formData["costSpectacle"] ?? ""}
                      onChange={(e) => updateFormData(e, "costSpectacle")}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>
            {formData["dispensedSpectacle"] === "Yes" && (
              <>
                <Row className="mt-3">
                  <Col>
                    <Form.Group controlId="dispensedDateSpectacle">
                      <Form.Label>Dispensed Date Spectacle</Form.Label>
                      <Form.Control
                        type="date"
                        value={
                          formData["dispensedDateSpectacle"]
                            ? moment(formData["dispensedDateSpectacle"]).format("YYYY-MM-DD")
                            : ""
                        }
                        onChange={(e) => updateFormData(e, "dispensedDateSpectacle")}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="costToBeneficiarySpectacle">
                      <Form.Label>Cost to Beneficiary Spectacle</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        autoComplete="off"
                        value={formData["costToBeneficiarySpectacle"] ?? ""}
                        onChange={(e) => updateFormData(e, "costToBeneficiarySpectacle")}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <Form.Group controlId="trainingGivenSpectacle">
                      <Form.Label>Training Given Spectacle</Form.Label>
                      <Form.Control
                        as="select"
                        value={formData["trainingGivenSpectacle"] ?? ""}
                        onChange={(e) => updateFormData(e, "trainingGivenSpectacle")}
                      >
                        <option defaultValue></option>
                        <option>Yes</option>
                        <option>No</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col></Col>
                </Row>
              </>
            )}
          </div>

          <h5 className="mt-4">Extra Information</h5>
          <Row>
            <Col>
              <Form.Group controlId="extraInformation">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  autoComplete="off"
                  value={formData["extraInformation"] ?? ""}
                  onChange={(e) => updateFormData(e, "extraInformation")}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Group controlId="referral">
                <Form.Label>Referral if any</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  autoComplete="off"
                  value={formData["referral"] ?? ""}
                  onChange={(e) => updateFormData(e, "referral")}
                />
              </Form.Group>
            </Col>
          </Row>

          <div>
            <br />
            <Button
              className="btn btn-success btn-block border-0"
              type="button"
              onClick={() => setSection("bestCorrectedVision")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default TrainingFormCommunityScreening;
