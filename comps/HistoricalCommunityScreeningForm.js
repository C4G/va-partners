import { useState } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import moment from "moment";
import { spectacleDevices } from "@/constants/devicesConstants";
import { createMenu } from "@/constants/globalFunctions";
import { CLVEDiagnosis } from "@/constants/generalConstants";

export default function HistoricalCommunityScreeningForm(props) {
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 300,
      },
    },
  };

  const [data, setData] = useState(props.evaluationData.service);
  const [editMode, setEditMode] = useState(false);

  const handleClick = () => {
    setEditMode(true);
  };

  const handleChange = (e) => {
    if (e.target.type === "date") {
      setData({
        ...data,
        [e.target.name]: new Date(Date.parse(e.target.value)),
      });
    } else if (e.target.type === "number") {
      setData({ ...data, [e.target.name]: parseInt(e.target.value) });
    } else {
      setData({ ...data, [e.target.name]: e.target.value });
    }
  };

  const deleteCommunityScreeningData = async () => {
    const result = confirm("Are you sure you want to delete this data?");
    if (result) {
      const res = await fetch("/api/communityScreening", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: data.id }),
      });
      if (res.status == 200) {
        await props.refetchUser();
      } else {
        alert("Failed to delete data!");
      }
    }
  };

  const saveCommunityScreeningData = async () => {
    const saveData = { ...data };
    delete saveData["beneficiaryId"];
    const res = await fetch("/api/communityScreening", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saveData),
    });
    if (res.status == 200) {
      setEditMode(false);
    } else {
      alert("Failed to save data!");
    }
    await props.refetchUser();
  };

  const diagnosisOptions = createMenu(CLVEDiagnosis, true, data.diagnosis ? data.diagnosis.split(", ") : []);
  const recommendationSpectacleOptions = createMenu(spectacleDevices, true, data.recommendationSpectacle ? data.recommendationSpectacle.split(", ") : []);
  const dispensedSpectacleOptions = createMenu(spectacleDevices, true, data.dispensedSpectacle ? data.dispensedSpectacle.split(", ") : []);

  const requiresDiagnosisNotes = data.diagnosis
    ? data.diagnosis.split(", ").some((d) => 
        ["Anterior Segment Condition", "Posterior Eye Disease", "Hereditary Eye Disease", "Neuro-ophthalmic Condition", "Others", "Other"].includes(d)
      )
    : false;

  const handleMultiSelectChange = (e) => {
    setData({
      ...data,
      [e.target.name]: typeof e.target.value === 'string' ? e.target.value : e.target.value.join(", "),
    });
  };

  const renderRow = (label, fieldName) => (
    <tr className="row">
      <th scope="row" className="col-md-4">
        {label}
      </th>
      <td className="col-md-8">
        {!editMode && (fieldName === "date" || fieldName === "dispensedDateSpectacle") && data[fieldName] !== null && data[fieldName] !== undefined && moment(data[fieldName]).format("DD-MM-YYYY")}
        {!editMode && fieldName !== "date" && fieldName !== "dispensedDateSpectacle" && data[fieldName]}
        {editMode && fieldName === "date" && (
          <input
            type="date"
            name="date"
            value={moment(data.date).format("YYYY-MM-DD")}
            onChange={(e) => handleChange(e)}
          />
        )}
        {editMode && fieldName === "sessionNumber" && (
          <FormControl fullWidth size="small">
            <input
              type="number"
              name="sessionNumber"
              value={data.sessionNumber}
              onChange={(e) => handleChange(e)}
              min="1"
              autoComplete="off"
            />
          </FormControl>
        )}
        {editMode && fieldName === "diagnosis" && (
          <FormControl fullWidth size="small">
            <Select
              onChange={(e) => handleMultiSelectChange(e)}
              value={data.diagnosis ? data.diagnosis.split(", ") : []}
              name="diagnosis"
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {diagnosisOptions}
            </Select>
          </FormControl>
        )}
        {editMode && fieldName === "mdvi" && (
          <FormControl fullWidth size="small">
            <Select onChange={(e) => handleChange(e)} value={data.mdvi} name="mdvi" MenuProps={MenuProps}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
              <MenuItem value="At Risk">At Risk</MenuItem>
            </Select>
          </FormControl>
        )}
        {editMode && fieldName === "extraInformation" && (
          <FormControl fullWidth size="small">
            <input
              type="text"
              name="extraInformation"
              value={data.extraInformation ?? ""}
              onChange={(e) => handleChange(e)}
              autoComplete="off"
            />
          </FormControl>
        )}
        {editMode && (fieldName === "diagnosisNotes" || fieldName === "referral" || fieldName === "comments") && (
          <FormControl fullWidth size="small">
            <textarea
              name={fieldName}
              value={data[fieldName] ?? ""}
              onChange={(e) => handleChange(e)}
              rows={2}
              autoComplete="off"
              required={fieldName === "diagnosisNotes" && requiresDiagnosisNotes}
              style={{ width: "100%", borderColor: fieldName === "diagnosisNotes" && requiresDiagnosisNotes && !data[fieldName] ? "red" : undefined }}
            />
          </FormControl>
        )}
        {editMode && (fieldName === "costSpectacle" || fieldName === "costToBeneficiarySpectacle") && (
          <FormControl fullWidth size="small">
            <input
              type="number"
              name={fieldName}
              value={data[fieldName] ?? ""}
              onChange={(e) => handleChange(e)}
              min="0"
              autoComplete="off"
            />
          </FormControl>
        )}
        {editMode && fieldName === "dispensedDateSpectacle" && (
          <input
            type="date"
            name="dispensedDateSpectacle"
            value={data.dispensedDateSpectacle ? moment(data.dispensedDateSpectacle).format("YYYY-MM-DD") : ""}
            onChange={(e) => handleChange(e)}
          />
        )}
        {editMode && fieldName === "trainingGivenSpectacle" && (
          <FormControl fullWidth size="small">
            <Select onChange={(e) => handleChange(e)} value={data.trainingGivenSpectacle ?? ""} name="trainingGivenSpectacle">
              <MenuItem value=""></MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
        )}
        {editMode && fieldName === "recommendationSpectacle" && (
          <FormControl fullWidth size="small">
            <Select
              onChange={(e) => handleMultiSelectChange(e)}
              value={data.recommendationSpectacle ? data.recommendationSpectacle.split(", ") : []}
              name="recommendationSpectacle"
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {recommendationSpectacleOptions}
            </Select>
          </FormControl>
        )}
        {editMode && fieldName === "dispensedSpectacle" && (
          <FormControl fullWidth size="small">
            <Select
              onChange={(e) => handleMultiSelectChange(e)}
              value={data.dispensedSpectacle ? data.dispensedSpectacle.split(", ") : []}
              name="dispensedSpectacle"
              multiple
              renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {dispensedSpectacleOptions}
            </Select>
          </FormControl>
        )}
        {editMode &&
          fieldName !== "date" &&
          fieldName !== "sessionNumber" &&
          fieldName !== "diagnosis" &&
          fieldName !== "mdvi" &&
          fieldName !== "extraInformation" &&
          fieldName !== "diagnosisNotes" &&
          fieldName !== "referral" &&
          fieldName !== "comments" &&
          fieldName !== "costSpectacle" &&
          fieldName !== "costToBeneficiarySpectacle" &&
          fieldName !== "dispensedDateSpectacle" &&
          fieldName !== "trainingGivenSpectacle" &&
          fieldName !== "recommendationSpectacle" &&
          fieldName !== "dispensedSpectacle" && (
            <FormControl fullWidth size="small">
              <input
                type="text"
                name={fieldName}
                value={data[fieldName]}
                onChange={(e) => handleChange(e)}
                autoComplete="off"
              />
            </FormControl>
          )}
      </td>
    </tr>
  );

  const renderSectionHeader = (title) => (
    <tr className="row">
      <th scope="row" className="col-md-12" style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
        {title}
      </th>
    </tr>
  );

  return data == undefined ? (
    <div className="text-align-left">No historical data is present for this date!</div>
  ) : (
    <div>
      <table className="beneficiary-table table-bordered row table">
        <thead className="thead-dark">
          <tr className="row">
            <th scope="col" className="col-md-4">
              Properties
            </th>
            <th scope="col" className="col-md-8">
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {renderSectionHeader("Presenting Visual")}
          {renderRow("Date", "date")}
          {renderRow("Diagnosis", "diagnosis")}
          {requiresDiagnosisNotes && renderRow("Diagnosis Notes", "diagnosisNotes")}
          {renderRow("CVI / MDVI", "mdvi")}
          {renderRow("Session Number", "sessionNumber")}
          <tr className="row"><th scope="row" className="col-md-12" style={{ backgroundColor: "#f8f9fa", fontStyle: "italic" }}>Uncorrected / Presenting Distance Acuity</th></tr>
          {renderRow("RE (Right Eye)", "uncorrectedDistanceRE")}
          {renderRow("LE (Left Eye)", "uncorrectedDistanceLE")}
          {renderRow("BE (Both Eyes)", "uncorrectedDistanceBE")}
          <tr className="row"><th scope="row" className="col-md-12" style={{ backgroundColor: "#f8f9fa", fontStyle: "italic" }}>Uncorrected / Presenting Near Acuity</th></tr>
          {renderRow("RE (Right Eye)", "uncorrectedNearRE")}
          {renderRow("LE (Left Eye)", "uncorrectedNearLE")}
          {renderRow("BE (Both Eyes)", "uncorrectedNearBE")}

          {renderSectionHeader("Best Corrected Vision")}
          <tr className="row"><th scope="row" className="col-md-12" style={{ backgroundColor: "#f8f9fa", fontStyle: "italic" }}>Best Corrected Distance Acuity</th></tr>
          {renderRow("RE (Right Eye)", "bestCorrectedDistanceRE")}
          {renderRow("LE (Left Eye)", "bestCorrectedDistanceLE")}
          {renderRow("BE (Both Eyes)", "bestCorrectedDistanceBE")}
          <tr className="row"><th scope="row" className="col-md-12" style={{ backgroundColor: "#f8f9fa", fontStyle: "italic" }}>Best Corrected Near Acuity</th></tr>
          {renderRow("RE (Right Eye)", "bestCorrectedNearRE")}
          {renderRow("LE (Left Eye)", "bestCorrectedNearLE")}
          {renderRow("BE (Both Eyes)", "bestCorrectedNearBE")}

          {renderSectionHeader("Spectacle")}
          {renderRow("Recommendation Spectacle", "recommendationSpectacle")}
          {renderRow("Dispensed Spectacle", "dispensedSpectacle")}
          {renderRow("Cost Spectacle", "costSpectacle")}
          {renderRow("Dispensed Date Spectacle", "dispensedDateSpectacle")}
          {renderRow("Cost to Beneficiary Spectacle", "costToBeneficiarySpectacle")}
          {renderRow("Training Given Spectacle", "trainingGivenSpectacle")}
          {renderRow("Extra Information", "extraInformation")}
          {renderRow("Referral if any", "referral")}
          {renderRow("Comments if any", "comments")}
        </tbody>
      </table>
      {props.evaluationData.editable && !editMode && (
        <button className="btn btn-success btn-block border-0" onClick={handleClick}>
          Edit
        </button>
      )}
      {editMode && (
        <button className="btn btn-success btn-block border-0" onClick={saveCommunityScreeningData}>
          Save
        </button>
      )}
      {!editMode && (
        <button className="btn btn-danger ms-3 btn-block border-0" onClick={deleteCommunityScreeningData}>
          Delete
        </button>
      )}
    </div>
  );
}
