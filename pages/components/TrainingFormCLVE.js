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
import {
  spectacleDevices,
  opticalDevices,
  nonOpticalDevices,
  nonOpticalDevicesSubheadings,
  nonOpticalDevicesIndices,
  electronicDevices,
  electronicDevicesSubheadings,
  electronicDevicesIndices,
} from "@/constants/devicesConstants";
import { createMenu, createOptionMenu, parseInputDate } from "@/constants/globalFunctions";
import { comma, CLVEDiagnosis } from "@/constants/generalConstants";
import { jsonToCSV } from "react-papaparse";
import moment from "moment";
import { required } from "../../comps/required";

const TrainingFormCLVE = ({
  addNewTraining,
  updateMDVIForBeneficiary,
  mdvi,
  customFieldsDistance,
  customFieldsNear,
  allfields,
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

  let config = {
    quotes: true,
    quoteChar: '"',
  };

  if (mdvi === null || mdvi === undefined || mdvi === "") {
    mdvi = "No";
  }
  const [mdviValue, setMdviValue] = useState(mdvi);
  const [section, setSection] = useState("visionEvaluation");
  const [diagnosis, setDiagnosis] = useState([]);
  const [formData, setFormData] = useState({
    unitDistance: "LogMAR",
    unitNear: "LogMAR",
  });

  const validateForm = () => {
    const form = document.getElementById("clve_form");
    let isValid = true;

    // Loop through all form elements
    for (const input of form.elements) {
      // Check if the input field is required
      if (input.required) {
        // Check if the field has a value
        if (!input.value.trim()) {
          isValid = false;
          // Optionally, display an error message or style the field
          input.style.borderColor = "red";
        } else {
          // Reset the field style if it's valid
          input.style.borderColor = "";
        }
      }
    }

    return isValid;
  };

  const handleSubmit = (formData) => {
    const isValid = validateForm();
    if (!isValid) {
      alert("Please complete all required fields!");
      return;
    }
    onSubmit(true);
    const customDataDistance = customFieldsDistance.reduce((acc, field) => {
      if (formData[field] === otherField) {
        acc[field] = formData[field];
      } else {
        acc[field] = formData[field] + " " + formData["unitDistance"];
      }
      return acc;
    }, {});
    const customDataNear = customFieldsNear.reduce((acc, field) => {
      if (formData[field] === otherField) {
        acc[field] = formData[field];
      } else {
        acc[field] = formData[field] + " " + formData["unitNear"];
      }
      return acc;
    }, {});

    const diagnosisNotes = formData["diagnosisOther"];
    const allDiagnosis = diagnosis.join(", ").trim();

    if (showOther.recommendationSpectacle) {
      devices.recommendationSpectacle.splice(devices.recommendationSpectacle.indexOf("Other"), 1);
      devices.recommendationSpectacle.push(formData["recommendationSpectacleOther"]);
    }

    if (showOther.recommendationOptical) {
      devices.recommendationOptical.splice(devices.recommendationOptical.indexOf("Other"), 1);
      devices.recommendationOptical.push(formData["recommendationOpticalOther"]);
    }

    if (showOther.recommendationNonOptical) {
      devices.recommendationNonOptical.splice(devices.recommendationNonOptical.indexOf("Other"), 1);
      devices.recommendationNonOptical.push(formData["recommendationNonOpticalOther"]);
    }

    if (showOther.recommendationElectronic) {
      devices.recommendationElectronic.splice(devices.recommendationElectronic.indexOf("Other"), 1);
      devices.recommendationElectronic.push(formData["recommendationElectronicOther"]);
    }

    const newTraining = {
      diagnosis: allDiagnosis,
      diagnosisNotes,
      mdvi: mdviValue,
      date: formData["date"] ?? null,
      sessionNumber: formData["sessionNumber"] ?? null,
      distanceVisualAcuityRE: formData["distanceVisualAcuityRE"] ?? null,
      distanceVisualAcuityLE: formData["distanceVisualAcuityLE"] ?? null,
      distanceBinocularVisionBE: formData["distanceBinocularVisionBE"] ?? null,
      nearVisualAcuityRE: formData["nearVisualAcuityRE"] ?? null,
      nearVisualAcuityLE: formData["nearVisualAcuityLE"] ?? null,
      nearBinocularVisionBE: formData["nearBinocularVisionBE"] ?? null,
      recommendationSpectacle:
        devices.recommendationSpectacle.length > 0
          ? jsonToCSV([devices.recommendationSpectacle], {
              ...config,
              delimiter: comma,
            })
          : "",
      dispensedSpectacle:
        devices.dispensedSpectacle === "Other" ? formData["dispensedOpticalOther"] : devices.dispensedSpectacle,
      ...(devices.dispensedSpectacle.length > 0
        ? {
            dispensedDateSpectacle: formData["dispensedDateSpectacle"],
            costSpectacle: formData["costSpectacle"],
            costToBeneficiarySpectacle: formData["costToBeneficiarySpectacle"],
            trainingGivenSpectacle: formData["trainingGivenSpectacle"],
          }
        : {
            dispensedDateSpectacle: null,
            costSpectacle: null,
            costToBeneficiarySpectacle: null,
            trainingGivenSpectacle: null,
          }),
      recommendationOptical:
        devices.recommendationOptical.length > 0
          ? jsonToCSV([devices.recommendationOptical], {
              ...config,
              delimiter: comma,
            })
          : "",
      dispensedOptical:
        devices.dispensedOptical === "Other" ? formData["dispensedOpticalOther"] : devices.dispensedOptical,
      ...(devices.dispensedOptical.length > 0
        ? {
            dispensedDateOptical: formData["dispensedDateOptical"],
            costOptical: formData["costOptical"],
            costToBeneficiaryOptical: formData["costToBeneficiaryOptical"],
            trainingGivenOptical: formData["trainingGivenOptical"],
          }
        : {
            dispensedDateOptical: null,
            costOptical: null,
            costToBeneficiaryOptical: null,
            trainingGivenOptical: null,
          }),
      recommendationNonOptical:
        devices.recommendationNonOptical.length > 0
          ? jsonToCSV([devices.recommendationNonOptical], {
              ...config,
              delimiter: comma,
            })
          : "",
      dispensedNonOptical:
        devices.dispensedNonOptical === "Other" ? formData["dispensedNonOpticalOther"] : devices.dispensedNonOptical,
      ...(devices.dispensedNonOptical.length > 0
        ? {
            dispensedDateNonOptical: formData["dispensedDateNonOptical"],
            costNonOptical: formData["costNonOptical"],
            costToBeneficiaryNonOptical: formData["costToBeneficiaryNonOptical"],
            trainingGivenNonOptical: formData["trainingGivenNonOptical"],
          }
        : {
            dispensedDateNonOptical: null,
            costNonOptical: null,
            costToBeneficiaryNonOptical: null,
            trainingGivenNonOptical: null,
          }),
      recommendationElectronic:
        devices.recommendationElectronic.length > 0
          ? jsonToCSV([devices.recommendationElectronic], {
              ...config,
              delimiter: comma,
            })
          : "",
      dispensedElectronic:
        devices.dispensedElectronic === "Other" ? formData["dispensedElectronicOther"] : devices.dispensedElectronic,
      ...(devices.dispensedElectronic.length > 0
        ? {
            dispensedDateElectronic: formData["dispensedDateElectronic"] ?? null,
            costElectronic: formData["costElectronic"] ?? null,
            costToBeneficiaryElectronic: formData["costToBeneficiaryElectronic"] ?? null,
            trainingGivenElectronic: formData["trainingGivenElectronic"] ?? null,
          }
        : {
            dispensedDateElectronic: null,
            costElectronic: null,
            costToBeneficiaryElectronic: null,
            trainingGivenElectronic: null,
          }),
      colourVisionRE: formData.colourVisionRE,
      colourVisionLE: formData.colourVisionLE,
      contrastSensitivityRE: formData.contrastSensitivityRE,
      contrastSensitivityLE: formData.contrastSensitivityLE,
      visualFieldsRE: formData.visualFieldsRE,
      visualFieldsLE: formData.visualFieldsLE,
      extraInformation: formData.extraInformation ?? "",
      ...customDataDistance,
      ...customDataNear,
    };
    updateMDVIForBeneficiary({ mDVI: mdviValue });
    addNewTraining(newTraining);
  };

  const [devices, setDevices] = useState({
    recommendationSpectacle: [],
    recommendationOptical: [],
    recommendationNonOptical: [],
    recommendationElectronic: [],
    dispensedSpectacle: [],
    dispensedOptical: [],
    dispensedNonOptical: [],
    dispensedElectronic: [],
  });

  const createOptionList = (values) => {
    return values.map((value) => <option key={value}>{value}</option>);
  };

  const changeDvValues = (e) => {
    setFormData((formData) => ({ ...formData, unitDistance: e.target.value }));
    if (e.target.value == "LogMAR") {
      setDvAcuityValues(logMARValues);
    } else if (e.target.value == "6m") {
      setDvAcuityValues(sixmValues);
    } else if (e.target.value == "20ft") {
      setDvAcuityValues(twentyftValues);
    }
  };

  const changeNvValues = (e) => {
    setFormData((formData) => ({ ...formData, unitNear: e.target.value }));
    if (e.target.value == "LogMAR") {
      setNvAcuityValues(logMARNVValues);
    } else if (e.target.value == "N-scale") {
      setNvAcuityValues(nScaleValues);
    } else if (e.target.value == "M-units") {
      setNvAcuityValues(mUnitsValues);
    } else if (e.target.value == "Snellen - Imperial") {
      setNvAcuityValues(snellenImperialValues);
    } else if (e.target.value == "Snellen - Metric") {
      setNvAcuityValues(snellenMetricValues);
    }
  };

  const [dvAcuityValues, setDvAcuityValues] = useState(logMARValues);
  const [nvAcuityValues, setNvAcuityValues] = useState(logMARNVValues);

  useEffect(() => {
    customFieldsDistance.forEach((field) => {
      setFormData((formData) => ({
        ...formData,
        [field]: dvAcuityValues[0],
      }));
    });
  }, [customFieldsDistance, dvAcuityValues]);

  useEffect(() => {
    customFieldsNear.forEach((field) => {
      setFormData((formData) => ({
        ...formData,
        [field]: nvAcuityValues[0],
      }));
    });
  }, [customFieldsNear, nvAcuityValues]);

  const diagnosisOptions = createMenu(CLVEDiagnosis, true, diagnosis);
  const recommendationSpectacleOptions = createMenu(spectacleDevices, true, devices["recommendationSpectacle"]);
  const dispensedSpectacleOptions = createMenu(spectacleDevices, true, devices["dispensedSpectacle"]);
  const recommendationOpticalOptions = createMenu(opticalDevices, true, devices["recommendationOptical"]);
  const dispensedOpticalOptions = createMenu(opticalDevices, true, devices["dispensedOptical"]);
  const recommendationNonOpticalOptions = createOptionMenu(
    nonOpticalDevices,
    nonOpticalDevicesSubheadings,
    nonOpticalDevicesIndices,
    true,
    devices["recommendationNonOptical"]
  );
  const dispensedNonOpticalOptions = createOptionMenu(
    nonOpticalDevices,
    nonOpticalDevicesSubheadings,
    nonOpticalDevicesIndices,
    true,
    devices["dispensedNonOptical"]
  );
  const recommendationElectronicOptions = createOptionMenu(
    electronicDevices,
    electronicDevicesSubheadings,
    electronicDevicesIndices,
    true,
    devices["recommendationElectronic"]
  );
  const dispensedElectronicOptions = createOptionMenu(
    electronicDevices,
    electronicDevicesSubheadings,
    electronicDevicesIndices,
    true,
    devices["dispensedElectronic"]
  );

  const [showOther, setShowOther] = useState({
    recommendationSpectacle: false,
    recommendationOptical: false,
    recommendationNonOptical: false,
    recommendationElectronic: false,
    dispensedSpectacle: false,
    dispensedOptical: false,
    dispensedNonOptical: false,
    dispensedElectronic: false,
  });

  const handleMultiSelectChange = (e, field) => {
    const value = e.target.value;
    setDevices({
      ...devices,
      [field]: value,
    });
    if (value.includes("Other")) {
      setShowOther({ ...showOther, [field]: true });
    } else {
      setShowOther({ ...showOther, [field]: false });
    }
  };

  const handleDiagnosisChange = (e) => {
    const {
      target: { value },
    } = e;
    setDiagnosis(value);
  };

  const updateFormData = (e, fieldName) => {
    if (e.target.type == "date") {
      setFormData((formData) => ({
        ...formData,
        [fieldName]: new Date(parseInputDate(e.target.value)),
      }));
    } else if (e.target.type == "number") {
      setFormData((formData) => ({
        ...formData,
        [fieldName]: parseInt(e.target.value),
      }));
    } else {
      setFormData((formData) => ({ ...formData, [fieldName]: e.target.value }));
    }
  };

  return (
    <div className="col-12">
      <div className="row">
        <div className="justify-content-center align-items-center">
          <h3>New Evaluation Form</h3>
        </div>
      </div>
      <hr />
      <div className="row">
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "visionEvaluation" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("visionEvaluation")}
          >
            Vision Evaluation
          </button>
        </div>
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "spectacle" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("spectacle")}
          >
            Spectacle
          </button>
        </div>
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "optical" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("optical")}
          >
            Optical
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "nonOptical" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("nonOptical")}
          >
            Non-Optical
          </button>
        </div>
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "electronic" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("electronic")}
          >
            Electronic
          </button>
        </div>
        <div className="col p-2">
          <button
            className={`w-100 text-align-left ${
              section === "other" ? "btn btn-success btn-block active-tab" : "btn btn-light btn-block"
            }`}
            onClick={() => setSection("other")}
          >
            Other and Comments
          </button>
        </div>
      </div>
      <hr />
      <Form className="mt-3" id="clve_form">
        <div className={section !== "visionEvaluation" ? "d-none" : "d-block"}>
          <Row>
            <Col>
              <Form.Label>Diagnosis {required()}</Form.Label>
              <FormControl fullWidth size="small">
                <Select
                  value={diagnosis}
                  onChange={(e) => {
                    handleDiagnosisChange(e);
                  }}
                  required
                  multiple
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={MenuProps}
                >
                  {diagnosisOptions}
                </Select>
              </FormControl>
            </Col>
            <Col>
              <Form.Group controlId="mdvi">
                <Form.Label>MDVI</Form.Label>
                <Form.Control
                  as="select"
                  value={mdviValue}
                  onChange={(e) => {
                    setMdviValue(e.target.value);
                  }}
                >
                  <option key="Yes" value="Yes">
                    Yes
                  </option>
                  <option key="No" value="No">
                    No
                  </option>
                  <option key="At Risk" value="At Risk">
                    At Risk
                  </option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="diagnosisOther">
                <Form.Label>Diagnosis Notes{ required() }</Form.Label>
                <Form.Control
                  type="text"
                  required
                  autoComplete="off"
                  value={formData["diagnosisOther"]}
                  onChange={(e) => updateFormData(e, "diagnosisOther")}
                />
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
          <Form.Group controlId="unit-distance">
            <Form.Label>Select Distance metric:{required()}</Form.Label>
            <Form.Control as="select" required value={formData["unitDistance"]} onChange={changeDvValues}>
              {/* <option defaultValue></option> */}
              <option>LogMAR</option>
              <option>6m</option>
              <option>20ft</option>
            </Form.Control>
          </Form.Group>
          <Row>
            {customFieldsDistance &&
              customFieldsDistance.map((field) => (
                <Col key={field}>
                  <Form.Group controlId={field} key={field}>
                    <Form.Label>
                      {field}
                      {required()}
                    </Form.Label>
                    <Form.Control
                      required
                      as="select"
                      value={formData[field]}
                      onChange={(e) => updateFormData(e, field)}
                    >
                      {createOptionList(dvAcuityValues)}
                    </Form.Control>
                  </Form.Group>
                </Col>
              ))}
          </Row>
          <Form.Group controlId="unit-near">
            <Form.Label>Select Near metric:{required()}</Form.Label>
            <Form.Control as="select" required value={formData["unitNear"]} onChange={changeNvValues}>
              <option>LogMAR</option>
              <option>N-scale</option>
              <option>M-units</option>
              <option>Snellen - Imperial</option>
              <option>Snellen - Metric</option>
            </Form.Control>
          </Form.Group>
          <Row>
            {customFieldsNear &&
              customFieldsNear.map((field) => (
                <Col key={field}>
                  <Form.Group controlId={field} key={field}>
                    <Form.Label>
                      {field}
                      {required()}
                    </Form.Label>
                    <Form.Control
                      as="select"
                      required
                      value={formData[field]}
                      onChange={(e) => {
                        updateFormData(e, field);
                      }}
                    >
                      {createOptionList(nvAcuityValues)}
                    </Form.Control>
                  </Form.Group>
                </Col>
              ))}
          </Row>
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
                value={formData["recommendationSpectacleOther"]}
                onChange={(e) => updateFormData(e, "recommendationSpectacleOther")}
              />
            </Form.Group>
          )}

          {allfields && (
            <div>
              <Row>
                <Col>
                  <Row>
                    <Form.Group controlId="dispensedSpectacle">
                      <Form.Label>Dispensed Spectacle</Form.Label>
                    </Form.Group>
                  </Row>
                  <FormControl fullWidth size="small">
                    <Select
                      value={devices.dispensedSpectacle}
                      onChange={(e) => {
                        handleMultiSelectChange(e, "dispensedSpectacle");
                      }}
                      multiple
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {dispensedSpectacleOptions}
                    </Select>
                  </FormControl>
                </Col>
              </Row>
              {devices.dispensedSpectacle.length > 0 && (
                <>
                  <Row>
                    <Col>
                      <Form.Group controlId="costSpectacle">
                        <Form.Label>Cost Spectacle{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costSpectacle" ?? ""]}
                          onChange={(e) => updateFormData(e, "costSpectacle")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="dispensedDateSpectacle">
                        <Form.Label>Dispensed Date Spectacle{required()}</Form.Label>
                        <Form.Control
                          type="date"
                          required
                          value={
                            formData["dispensedDateSpectacle"]
                              ? moment(formData["dispensedDateSpectacle"]).format("YYYY-MM-DD")
                              : ""
                          }
                          onChange={(e) => updateFormData(e, "dispensedDateSpectacle")}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group controlId="costToBeneficiarySpectacle">
                        <Form.Label>Cost to Beneficiary Spectacle{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costToBeneficiarySpectacle"] ?? ""}
                          onChange={(e) => updateFormData(e, "costToBeneficiarySpectacle")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="trainingGivenSpectacle">
                        <Form.Label>Training Given Spectacle{required()}</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={formData["trainingGivenSpectacle"] ?? ""}
                          onChange={(e) => updateFormData(e, "trainingGivenSpectacle")}
                        >
                          <option defaultValue></option>
                          <option>Yes</option>
                          <option>No</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              {showOther.dispensedSpectacle && (
                <Form.Group controlId="dispensedSpectacleOther">
                  <Form.Label>Other Dispensed Spectacle</Form.Label>
                  <Form.Control
                    as="input"
                    autoComplete="off"
                    value={formData["dispensedSpectacleOther"]}
                    onChange={(e) => updateFormData(e, "dispensedSpectacleOther")}
                  />
                </Form.Group>
              )}
            </div>
          )}
          <div>
            <br />
            <Button className="btn btn-success btn-block border-0" type="button" onClick={() => setSection("optical")}>
              Continue
            </Button>
          </div>
        </div>
        <div className={section !== "optical" ? "d-none" : "d-block"}>
          <Row>
            <Form.Group controlId="recommendationOptical">
              <Form.Label>Recommendation Optical</Form.Label>
            </Form.Group>
          </Row>
          <FormControl fullWidth size="small">
            <Select
              value={devices.recommendationOptical}
              onChange={(e) => {
                handleMultiSelectChange(e, "recommendationOptical");
              }}
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {recommendationOpticalOptions}
            </Select>
          </FormControl>

          {showOther.recommendationOptical && (
            <Form.Group controlId="recommendationOpticalOther">
              <Form.Label>Other Recommendation Optical</Form.Label>
              <Form.Control
                as="input"
                autoComplete="off"
                value={formData["recommendationOpticalOther"]}
                onChange={(e) => updateFormData(e, "recommendationOpticalOther")}
              />
            </Form.Group>
          )}

          {allfields && (
            <div>
              <Row>
                <Col>
                  <Row>
                    <Form.Group controlId="dispensedOptical">
                      <Form.Label>Dispensed Optical</Form.Label>
                    </Form.Group>
                  </Row>
                  <FormControl fullWidth size="small">
                    <Select
                      value={devices.dispensedOptical}
                      onChange={(e) => {
                        handleMultiSelectChange(e, "dispensedOptical");
                      }}
                      multiple
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {dispensedOpticalOptions}
                    </Select>
                  </FormControl>
                </Col>
              </Row>
              {devices.dispensedOptical.length > 0 && (
                <>
                  <Row>
                    <Col>
                      <Form.Group controlId="costOptical">
                        <Form.Label>Cost Optical{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "costOptical")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="dispensedDateOptical">
                        <Form.Label>Dispensed Date Optical{required()}</Form.Label>
                        <Form.Control
                          type="date"
                          required
                          value={
                            formData["dispensedDateOptical"]
                              ? moment(formData["dispensedDateOptical"]).format("YYYY-MM-DD")
                              : ""
                          }
                          onChange={(e) => updateFormData(e, "dispensedDateOptical")}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group controlId="costToBeneficiaryOptical">
                        <Form.Label>Cost to Beneficiary Optical{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costToBeneficiaryOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "costToBeneficiaryOptical")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="trainingGivenOptical">
                        <Form.Label>Training Given Optical{required()}</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={formData["trainingGivenOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "trainingGivenOptical")}
                        >
                          <option defaultValue></option>
                          <option>Yes</option>
                          <option>No</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              {showOther.dispensedOptical && (
                <Form.Group controlId="dispensedOpticalOther">
                  <Form.Label>Other Dispensed Optical</Form.Label>
                  <Form.Control
                    as="input"
                    autoComplete="off"
                    value={formData["dispensedOpticalOther"]}
                    onChange={(e) => updateFormData(e, "dispensedOpticalOther")}
                  />
                </Form.Group>
              )}
            </div>
          )}
          <div>
            <br />
            <Button
              className="btn btn-success btn-block border-0"
              type="button"
              onClick={() => setSection("nonOptical")}
            >
              Continue
            </Button>
          </div>
        </div>
        <div className={section !== "nonOptical" ? "d-none" : "d-block"}>
          <Row>
            <Form.Group controlId="recommendationNonOptical">
              <Form.Label>Recommendation Non-Optical</Form.Label>
            </Form.Group>
          </Row>
          <FormControl fullWidth size="small">
            <Select
              value={devices.recommendationNonOptical}
              onChange={(e) => {
                handleMultiSelectChange(e, "recommendationNonOptical");
              }}
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {recommendationNonOpticalOptions}
            </Select>
          </FormControl>

          {showOther.recommendationNonOptical && (
            <Form.Group controlId="recommendationNonOpticalOther">
              <Form.Label>Other Recommendation Non-Optical</Form.Label>
              <Form.Control
                as="input"
                autoComplete="off"
                value={formData["recommendationNonOpticalOther"]}
                onChange={(e) => updateFormData(e, "recommendationNonOpticalOther")}
              />
            </Form.Group>
          )}

          {allfields && (
            <div>
              <Row>
                <Col>
                  <Row>
                    <Form.Group controlId="dispensedNonOptical">
                      <Form.Label>Dispensed Non-Optical</Form.Label>
                    </Form.Group>
                  </Row>
                  <FormControl fullWidth size="small">
                    <Select
                      value={devices.dispensedNonOptical}
                      onChange={(e) => {
                        handleMultiSelectChange(e, "dispensedNonOptical");
                      }}
                      multiple
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {dispensedNonOpticalOptions}
                    </Select>
                  </FormControl>
                </Col>
              </Row>
              {devices.dispensedNonOptical.length > 0 && (
                <>
                  <Row>
                    <Col>
                      <Form.Group controlId="costNonOptical">
                        <Form.Label>Cost Non-Optical{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costNonOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "costNonOptical")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="dispensedDateNonOptical">
                        <Form.Label>Dispensed Date Non-Optical{required()}</Form.Label>
                        <Form.Control
                          type="date"
                          required
                          value={
                            formData["dispensedDateNonOptical"]
                              ? moment(formData["dispensedDateNonOptical"]).format("YYYY-MM-DD")
                              : ""
                          }
                          onChange={(e) => updateFormData(e, "dispensedDateNonOptical")}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group controlId="costToBeneficiaryNonOptical">
                        <Form.Label>Cost to Beneficiary Non-Optical{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costToBeneficiaryNonOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "costToBeneficiaryNonOptical")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="trainingGivenNonOptical">
                        <Form.Label>Training Given Non-Optical{required()}</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={formData["trainingGivenNonOptical"] ?? ""}
                          onChange={(e) => updateFormData(e, "trainingGivenNonOptical")}
                        >
                          <option defaultValue></option>
                          <option>Yes</option>
                          <option>No</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              {showOther.dispensedNonOptical && (
                <Form.Group controlId="dispensedNonOpticalOther">
                  <Form.Label>Other Dispensed Non-Optical</Form.Label>
                  <Form.Control
                    as="input"
                    autoComplete="off"
                    value={formData["dispensedNonOpticalOther"]}
                    onChange={(e) => updateFormData(e, "dispensedNonOpticalOther")}
                  />
                </Form.Group>
              )}
            </div>
          )}
          <div>
            <br />
            <Button
              className="btn btn-success btn-block border-0"
              type="button"
              onClick={() => setSection("electronic")}
            >
              Continue
            </Button>
          </div>
        </div>
        <div className={section !== "electronic" ? "d-none" : "d-block"}>
          <Row>
            <Form.Group controlId="recommendationElectronic">
              <Form.Label>Recommendation Electronic</Form.Label>
            </Form.Group>
          </Row>
          <FormControl fullWidth size="small">
            <Select
              value={devices.recommendationElectronic}
              onChange={(e) => {
                handleMultiSelectChange(e, "recommendationElectronic");
              }}
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {recommendationElectronicOptions}
            </Select>
          </FormControl>

          {showOther.recommendationElectronic && (
            <Form.Group controlId="recommendationElectronicOther">
              <Form.Label>Other Recommendation Electronic</Form.Label>
              <Form.Control
                as="input"
                autoComplete="off"
                value={formData["recommendationElectronicOther"]}
                onChange={(e) => updateFormData(e, "recommendationElectronicOther")}
              />
            </Form.Group>
          )}

          {allfields && (
            <div>
              <Row>
                <Col>
                  <Row>
                    <Form.Group controlId="dispensedElectronic">
                      <Form.Label>Dispensed Electronic</Form.Label>
                    </Form.Group>
                  </Row>
                  <FormControl fullWidth size="small">
                    <Select
                      value={devices.dispensedElectronic}
                      onChange={(e) => {
                        handleMultiSelectChange(e, "dispensedElectronic");
                      }}
                      multiple
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {dispensedElectronicOptions}
                    </Select>
                  </FormControl>
                </Col>
              </Row>
              {devices.dispensedElectronic.length > 0 && (
                <>
                  <Row>
                    <Col>
                      <Form.Group controlId="costElectronic">
                        <Form.Label>Cost Electronic{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costElectronic"] ?? ""}
                          onChange={(e) => updateFormData(e, "costElectronic")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="dispensedDateElectronic">
                        <Form.Label>Dispensed Date Electronic{required()}</Form.Label>
                        <Form.Control
                          type="date"
                          required
                          value={
                            formData["dispensedDateElectronic"]
                              ? moment(formData["dispensedDateElectronic"]).format("YYYY-MM-DD")
                              : ""
                          }
                          onChange={(e) => updateFormData(e, "dispensedDateElectronic")}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group controlId="costToBeneficiaryElectronic">
                        <Form.Label>Cost to Beneficiary Electronic{required()}</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min={0}
                          autoComplete="off"
                          value={formData["costToBeneficiaryElectronic"] ?? ""}
                          onChange={(e) => updateFormData(e, "costToBeneficiaryElectronic")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="trainingGivenElectronic">
                        <Form.Label>Training Given Electronic{required()}</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={formData["trainingGivenElectronic"] ?? ""}
                          onChange={(e) => updateFormData(e, "trainingGivenElectronic")}
                        >
                          <option defaultValue></option>
                          <option>Yes</option>
                          <option>No</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              {showOther.dispensedElectronic && (
                <Form.Group controlId="dispensedElectronicOther">
                  <Form.Label>Other Dispensed Electronic</Form.Label>
                  <Form.Control
                    as="input"
                    autoComplete="off"
                    value={formData["dispensedElectronicOther"]}
                    onChange={(e) => updateFormData(e, "dispensedElectronicOther")}
                  />
                </Form.Group>
              )}
            </div>
          )}
          <div>
            <br />
            <Button className="btn btn-success btn-block border-0" type="button" onClick={() => setSection("other")}>
              Continue
            </Button>
          </div>
        </div>
        <div className={section !== "other" ? "d-none" : "d-block"}>
          {allfields && (
            <div>
              <Row>
                <Col>
                  <Form.Group controlId="colourVisionRE">
                    <Form.Label>Colour Vision Right Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["colourVisionRE"]}
                      onChange={(e) => updateFormData(e, "colourVisionRE")}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="colourVisionLE">
                    <Form.Label>Colour Vision Left Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["colourVisionLE"]}
                      onChange={(e) => updateFormData(e, "colourVisionLE")}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group controlId="contrastSensitivityRE">
                    <Form.Label>Contrast Sensitivity Right Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["contrastSensitivityRE"]}
                      onChange={(e) => updateFormData(e, "contrastSensitivityRE")}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="contrastSensitivityLE">
                    <Form.Label>Contrast Sensitivity Left Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["contrastSensitivityLE"]}
                      onChange={(e) => updateFormData(e, "contrastSensitivityLE")}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group controlId="visualFieldsRE">
                    <Form.Label>Visual Fields Right Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["visualFieldsRE"]}
                      onChange={(e) => updateFormData(e, "visualFieldsRE")}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="visualFieldsLE">
                    <Form.Label>Visual Fields Left Eye</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      autoComplete="off"
                      value={formData["visualFieldsLE"]}
                      onChange={(e) => updateFormData(e, "visualFieldsLE")}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}
          <Form.Group controlId="extraInformation">
            <Form.Label>Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              autoComplete="off"
              value={formData["extraInformation"]}
              onChange={(e) => updateFormData(e, "extraInformation")}
            />
          </Form.Group>
          <div>
            <br />
            <Button
              disabled={loading}
              className="btn btn-success btn-block border-0"
              type="button"
              onClick={() => handleSubmit(formData)}
            >
              Submit Evaluation
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default TrainingFormCLVE;
