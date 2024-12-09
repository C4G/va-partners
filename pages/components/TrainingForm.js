// TODO: Fix handling of Date. In some scenarios, you can pick a date in the future.
// and it will set it a day before. This is due to the timezone difference
// likely between the client and server. TrainingFormCLVE.js seems to
// handle this correctly. This may be due to the fact they use the moment library.
// However, they don't use moment.utc() so it's unclear why it works for them.

import { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import {
  Select,
  FormControl,
} from "@mui/material";
import { createMenu } from "@/constants/globalFunctions";
import { VEDiagnosis } from "@/constants/generalConstants";
import { required } from "../../comps/required";

const TrainingForm = ({
  addNewTraining,
  customFields,
  submitButtonTest,
  typeList,
  mdvi,
  updateMDVIForBeneficiary,
  mdviValue = "No",
  subTypeList,
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
  
  if (mdviValue === null || mdviValue === undefined || mdviValue === "")
    mdviValue = "No";
  const [mdviVal, setMdviVal] = useState(mdviValue);
  const [diagnosis, setDiagnosis] = useState([]);
  const [otherDiagnosis, setOtherDiagnosis] = useState("");

  const diagnosisOptions = createMenu(VEDiagnosis, true, diagnosis);

  const handleDiagnosisChange = (e) => {
    const {
      target: { value },
    } = e;
    setDiagnosis(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(true);

    const customData = customFields.reduce((acc, field) => {
      acc[field] = e.target[field].value;
      return acc;
    }, {});

    const allDiagnosis = diagnosis.reduce(
      (curr, selected) => `${curr} ${selected === "Other" ? otherDiagnosis.trim() : selected}`,
      ""
    ).trim();

    const newTraining = {
      date: e.target.date.value,
      sessionNumber: e.target.sessionNumber.value,
      type: e.target.type == null ? null : e.target.type.value,
      typeOther: e.target.typeOther == null ? null : e.target.typeOther.value,
      subType,
      subTypeOther:
        e.target.subTypeOther == null ? null : e.target.subTypeOther.value,
      MDVI: mdvi ? mdviVal : null,
      Diagnosis: allDiagnosis.length > 0 ? allDiagnosis : null,
      extraInformation: e.target.extraInformation.value,
      ...customData,
    };
    if (mdvi) {
      updateMDVIForBeneficiary({ mDVI: mdviVal });
    }
    addNewTraining(newTraining);
  };

  let types = [<option key="default"></option>];
  if (typeList != null) {
    typeList.forEach((type) => {
        types.push(<option value={type.value}>{type.value}</option>);
    });
  }

  const [subType, setSubType] = useState(null);
  const [subTypeOptions, setSubTypeOptions] = useState([]);
  const [showSubType, setShowSubType] = useState(false);
  const [showTypeOther, setShowTypeOther] = useState(false);
  const [showTypeOtherSub, setShowTypeOtherSub] = useState(false);
  function typeOnChange(event) {
    event.preventDefault();
    setSubType(null);
    if (event.target.value && subTypeList != null) {
      setShowSubType(true);
    } else {
      setShowSubType(false);
      if (event.target.value == "Other") {
        setShowTypeOther(true);
      } else {
        setShowTypeOther(false);
      }
      return;
    }
    if (event.target.value == "Other") {
      setShowTypeOther(true);
    } else {
      setShowTypeOther(false);
    }
    if (subTypeList != null) {
      let stTemp = [<option key="default" value={null} selected></option>];
      subTypeList.forEach((st) => {
        if (st.trainingType.value == event.target.value
        ) {
          stTemp.push(<option value={st.value}>{st.value}</option>);
        }
      });
      setSubTypeOptions(stTemp);
    }
  }

  function subTypeOnChange(event) {
    event.preventDefault();
    setSubType(event.target.value);
    if (event.target.value == "Other") {
      setShowTypeOtherSub(true);
    } else {
      setShowTypeOtherSub(false);
    }
  }

  return (
    <div className="col-12">
      <div className="row">
        <div className="justify-content-center align-items-center">
          <h3>New Evaluation Form</h3>
        </div>
      </div>
      <>
        <Form onSubmit={handleSubmit} className="mt-3">
          <br />
          <br />
          <Row>
            <Col>
              <Form.Group controlId="date">
                <Form.Label>Date { required() } </Form.Label>
                <Form.Control type="date" required />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="sessionNumber">
                <Form.Label>Session Number</Form.Label>
                <Form.Control type="number" min={1} autoComplete="off" />
              </Form.Group>
            </Col>
          </Row>
          {customFields &&
            customFields.map((field) => (
              <Form.Group controlId={field} key={field}>
                <Form.Label>{field}</Form.Label>
                <Form.Control type="text" autoComplete="off" />
              </Form.Group>
            ))}
          {mdvi == true && (
            <>
              <Row>
                <Col>
                  <Form.Group controlId="MDVI">
                    <Form.Label>MDVI</Form.Label>
                    <Form.Control
                      as="select"
                      value={mdviVal}
                      onChange={(e) => setMdviVal(e.target.value)}
                    >
                      <option key="Yes" value="Yes">
                        Yes
                      </option>
                      <option selected key="No" value="No">
                        No
                      </option>
                      <option key="At Risk" value="At Risk">
                        At Risk
                      </option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Label>Diagnosis { required() }</Form.Label>
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
              </Row>
              <Row>
                <Col>
                  {diagnosis.includes("Other") && (
                      <Form.Group controlId="diagnosisOther">
                        <Form.Label>Other Diagnosis {required()}</Form.Label>
                        <Form.Control
                          type="input"
                          required
                          autoComplete="off"
                          value={otherDiagnosis}
                          onChange={(e) => setOtherDiagnosis(e.target.value)}
                        />
                      </Form.Group>
                  )}
                </Col>
              </Row>
            </>
          )}
          {typeList != null && (
            <Form.Group controlId="type">
              <Form.Label>Type { required() }</Form.Label>
              <Form.Control as="select" required onChange={typeOnChange}>
                {types}
              </Form.Control>
            </Form.Group>
          )}
          {showTypeOther && typeList != null && subTypeList == null && (
            <Form.Group controlId="typeOther">
              <Form.Label>Type Other { required() }</Form.Label>
              <Form.Control
                as="textarea"
                required
                rows={1}
                autoComplete="off"
              ></Form.Control>
            </Form.Group>
          )}
          {showSubType && typeList != null && subTypeOptions != null && (
            <Form.Group controlId="subType">
              <Form.Label>Sub Type { required() } </Form.Label>
              <Form.Control
                id="subTypeSelect"
                required
                as="select"
                onChange={subTypeOnChange}
              >
                {subTypeOptions}
              </Form.Control>
            </Form.Group>
          )}
          {showTypeOtherSub && typeList != null && subTypeList != null && (
            <Form.Group controlId="subTypeOther">
              <Form.Label>Type Sub Other { required() }</Form.Label>
              <Form.Control
                as="textarea"
                rows={1}
                required
                autoComplete="off"
              ></Form.Control>
            </Form.Group>
          )}
          <Form.Group controlId="extraInformation">
            <Form.Label>Extra Information</Form.Label>
            <Form.Control as="textarea" rows={3} autoComplete="off" />
          </Form.Group>
          <br />
          <Button disabled={loading} className="btn btn-success border-0 btn-block" type="submit">
            {submitButtonTest}
          </Button>
        </Form>
      </>
    </div>
  );
};

export default TrainingForm;
