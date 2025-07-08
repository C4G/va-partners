import { getCounsellingType } from "@/pages/api/counsellingType";
import { getTrainingSubTypes } from "@/pages/api/trainingSubType";
import { getTrainingTypes } from "@/pages/api/trainingType";
import { getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";
import { Check2, Pencil } from "react-bootstrap-icons";
import { readBeneficiaryMrn } from "./api/beneficiary";
import { readBeneficiaryMirror } from "./api/beneficiaryMirror";
import { findAllHospital } from "./api/hospital";
import { readUser } from "./api/user";
import BeneficiaryServicesTable from "./components/BeneficiaryServicesTable";
import ConsentForm from "./components/ConsentForm";
import UserProfileCard from "./components/UserProfileCard";
import Navigation from "./navigation/Navigation";

function UserPage(props) {
  const router = useRouter();
  const [formData, setFormData] = useState(props.user);
  const [editableField, setEditableField] = useState("");
  const [consentName, setConsentName] = useState("");

  const searchParams = useSearchParams();
  const prevHospitalId = searchParams.get("hospitalId");
  const prevMrn = searchParams.get("mrn");

  const hospitalOptions = [];
  for (let i = 0; i < props.hospitals.length; i++) {
    const hospital = props.hospitals[i];
    hospitalOptions.push(
      <option key={hospital.name} value={hospital.id}>
        {hospital.name} (ID {hospital.id})
      </option>
    );
  }

  const grantConsent = async () => {
    if (consentName === props.user.beneficiaryName) {
      const response = await fetch(`/api/beneficiary`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mrn: props.user.mrn, consent: "Yes" }),
      });

      if (response.ok) {
        setEditableField("");
        setConsentName("");
        setFormData((formData) => ({ ...formData, consent: "Yes" }));
      } else {
        alert("An error occurred while saving user data. Please try again.");
      }
    } else {
      alert("Please ensure that you have entered the beneficiary's name correctly. Try again!");
      setConsentName("");
    }
  };

  const revokeConsent = async () => {
    const response = await fetch(`/api/beneficiary`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mrn: props.user.mrn, consent: "No" }),
    });

    if (response.ok) {
      setEditableField("");
      setFormData((formData) => ({ ...formData, consent: "No" }));
      setConsentName("");
    } else {
      alert("An error occurred while saving user data. Please try again.");
    }
  };

  const deleteBeneficiary = async () => {
    const response = await fetch(`/api/beneficiary`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mrn: props.user.mrn,
        hospitalId: props.user.hospitalId,
      }),
    });

    if (response.ok) {
      router.push("/beneficiary");
    } else {
      alert("An error occurred while deleting user. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e) => {
    let sel = e.target;
    setFormData({
      ...formData,
      [sel.name]: sel.selectedOptions[0].label.split("(")[0],
    });
    if (sel.name === "hospitalName") {
      setFormData((formData) => ({
        ...formData,
        hospitalId: sel.selectedOptions[0].value,
      }));
    }
  };

  const handleEditClick = (field) => {
    setEditableField(field);
  };

  const handleSubmit = async (e, field) => {
    e.preventDefault();
    let fieldValue = formData[field];
    if (field === "hospitalName") {
      fieldValue = parseInt(document.getElementById("hospitalName").value);
      field = "newHospitalId";
    }
    if (field === "mrn") {
      field = "newMrn";
    }

    const response = await fetch(`/api/beneficiary`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mrn: prevMrn,
        hospitalId: prevHospitalId,
        [field]: fieldValue,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const currentParams = new URLSearchParams(searchParams);
      currentParams.set("mrn", data.mrn);
      currentParams.set("hospitalId", data.hospitalId);
      await router.push(`?${currentParams.toString()}`);

      setEditableField("");
      alert("The user has been updated!");
    } else {
      alert("An error occurred while saving user data. Please try again.");
    }
  };

  if (!props.user) {
    return <div>Loading...</div>;
  }

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const renderConsentField = (field, type, canEdit) => {
    if (formData[field] == null || formData[field] === "") {
      return (
        <div>
          <div className="text-align-left">
            <div className="flex-container">
              <div className="text-danger">No consent information recorded.</div>
              <div className="text-align-right">
                <button className="btn btn-sm btn-link" data-bs-toggle="modal" data-bs-target="#indicateConsent">
                  Indicate Consent
                </button>
              </div>
            </div>
          </div>
          <div className="modal" id="indicateConsent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Consent Form</h4>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" id="close-indicate"></button>
                </div>
                <div className="modal-body">
                  I hereby grant Vision-Aid the authority to use my photos, videos or other media in their public
                  campaigns.
                  <br />
                  <br />
                  <div>
                    Please type beneficiary&apos;s full name to grant consent:
                    <br />
                    <br />
                    <input type="text" value={consentName} onChange={(e) => setConsentName(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success"
                    data-bs-dismiss="modal"
                    onClick={() => grantConsent()}
                  >
                    Yes, I consent
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                    onClick={() => revokeConsent()}
                  >
                    No, I do not consent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (formData[field] === "Yes") {
      return (
        <div>
          <div className="text-align-left">
            <div className="flex-container">
              <div>{formData[field]}</div>
              <div className="text-align-right">
                {canEdit && (
                  <button
                    className="btn btn-sm btn-link text-primary ms-2"
                    data-bs-toggle="modal"
                    data-bs-target="#revokeConsent"
                  >
                    Revoke Consent
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal" id="revokeConsent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Revoke Consent?</h4>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" id="close-revoke"></button>
                </div>
                <div className="modal-body">Please confirm that you wish to revoke consent.</div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                    onClick={() => revokeConsent()}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (formData[field] === "No") {
      return (
        <div>
          <div className="text-align-left">
            <div className="flex-container">
              <div>{formData[field]}</div>
              <div className="text-align-right">
                {canEdit && (
                  <button
                    className="btn btn-sm btn-link text-primary ms-2"
                    data-bs-toggle="modal"
                    data-bs-target="#grantConsent"
                  >
                    Grant Consent
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal" id="grantConsent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Grant Consent?</h4>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" id="close-grant"></button>
                </div>
                <div className="modal-body">
                  <div>Type the beneficiary&apos;s full name to grant consent to Vision-Aid.</div>
                  <br /> <br />
                  <input type="text" value={consentName} onChange={(e) => setConsentName(e.target.value)} />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success"
                    data-bs-dismiss="modal"
                    onClick={() => grantConsent()}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderSelectField = (field, type, canEdit) => {
    let options = [];
    let currentValue = null;
    if (field === "hospitalName") {
      options = hospitalOptions;
      currentValue = formData["hospitalId"];
    } else if (field === "gender") {
      options = [
        <option key="" value="">
          Select Gender
        </option>,
        <option key="Male" value="Male">
          Male
        </option>,
        <option key="Female" value="Female">
          Female
        </option>,
        <option key="Other" value="Other">
          Other
        </option>,
      ];
      currentValue = formData[field];
    } else if (field === "mDVI") {
      options = [
        <option key="Yes" value="Yes">
          Yes
        </option>,
        <option key="No" value="No">
          No
        </option>,
        <option key="At Risk" value="At Risk">
          At Risk
        </option>,
      ];
      currentValue = formData[field];
    }

    return canEdit && editableField === field ? (
      <div className="text-align-left">
        <div className="flex-container">
          <form onSubmit={(e) => handleSubmit(e, field)} className="d-inline ms-2">
            <div className="row">
              <div className="col-md-9 nopadding">
                <select
                  className="profile-card-select"
                  name={field}
                  id={field}
                  onChange={handleSelectChange}
                  value={currentValue}
                >
                  {options}
                </select>
              </div>
              <div className="col-md-1 nopadding" />
              <div className="col-md-2 nopadding">
                <button type="submit" className="btn text-primary ms-2 nopadding">
                  <Check2 />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    ) : type === "hidden" ? (
      <div></div>
    ) : (
      <div className="text-align-left">
        <div className="flex-container">
          {formData[field]}
          {canEdit && (
            <button
              type="button"
              className="btn btn-link btn-sm text-primary ms-2"
              onClick={() => handleEditClick(field)}
            >
              <Pencil />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderField = (field, type, canEdit) => {
    return canEdit && editableField === field ? (
      <div className="text-align-left">
        <div className="flex-container">
          <form onSubmit={(e) => handleSubmit(e, field)} className="d-inline ms-2">
            <div className="row">
              <div className="col-md-9 nopadding">
                <input
                  type={type}
                  className="profile-card-input"
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-1 nopadding" />
              <div className="col-md-2 nopadding">
                <button type="submit" className="btn text-primary ms-2 nopadding">
                  <Check2 />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    ) : type === "hidden" ? (
      <div></div>
    ) : (
      <div className="text-align-left">
        <div className="flex-container">
          <div>{formData[field]}</div>
          {canEdit && (
            <button
              type="button"
              className="btn btn-link btn-sm text-primary ms-2"
              onClick={() => handleEditClick(field)}
            >
              <Pencil />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDOB = () => {
    return editableField === "dateOfBirth" ? (
      <div className="text-align-left">
        <div className="flex-container">
          <form onSubmit={(e) => handleSubmit(e, "dateOfBirth")}>
            <div className="row nopadding">
              <div className="col-md-9 nopadding">
                <input
                  type="date"
                  className="profile-card-input"
                  name="dateOfBirth"
                  value={formData["dateOfBirth"]}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-1 nopadding" />
              <div className="col-md-2 nopadding">
                <button type="submit" className="btn text-primary ms-2 nopadding text-align-right">
                  <Check2 />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    ) : (
      <div className="text-align-left">
        <div className="flex-container">
          {formatDate(formData["dateOfBirth"].toString().split("T")[0])}
          <button
            type="button"
            className="btn btn-link btn-sm text-primary ms-2 text-align-right"
            onClick={() => handleEditClick("dateOfBirth")}
          >
            <Pencil />
          </button>
        </div>
      </div>
    );
  };

  const renderExtraInformation = () => {
    return editableField === "extraInformation" ? (
      <div className="text-align-left">
        <div className="flex-container">
          <form onSubmit={(e) => handleSubmit(e, "extraInformation")} className="d-inline ms-2">
            <div className="row">
              <div className="col-md-9 nopadding">
                <textarea
                  className="profile-card-input"
                  name="extraInformation"
                  value={formData["extraInformation"]}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-1 nopadding" />
              <div className="col-md-2 nopadding">
                <button type="submit" className="btn text-primary ms-2 nopadding text-align-right">
                  <Check2 />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    ) : (
      <div className="text-align-left">
        <div className="flex-container">
          {formData["extraInformation"]}
          <button
            type="button"
            className="btn btn-link btn-sm text-primary ms-2"
            onClick={() => handleEditClick("extraInformation")}
          >
            <Pencil />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navigation user={props.currentUser} />
      <div className="container mb-3 p-4">
        <div className="d-flex">
          <h2 className="nopadding">Beneficiary Details</h2>
          <div className="ms-auto">
            <button className="btn btn-danger" data-bs-toggle="modal" data-bs-target="#deleteBeneficiary">
              Delete Beneficiary
            </button>
          </div>
          <div className="modal" id="deleteBeneficiary">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Delete Beneficiary</h4>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" id="close-revoke"></button>
                </div>
                <div className="modal-body">
                  Please confirm that you wish to delete this beneficiary permanently. This will remove all training
                  data associated with this beneficiary.
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                    onClick={() => deleteBeneficiary()}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="horizontal-line" />
        <div className="row">
          <div className="col-md-5">
            <UserProfileCard
              gender={renderSelectField("gender", "text", true)}
              phoneNumber={renderField("phoneNumber", "text", true)}
              MRN={renderField("mrn", "text", true)}
              dob={renderDOB()}
              hospitalName={renderSelectField("hospitalName", "text", true)}
              education={renderField(
                "education",
                props.beneficiaryMirror.educationRequired ? "text" : props.beneficiaryMirror,
                true
              )}
              districts={renderField(
                "districts",
                props.beneficiaryMirror.occupationRequired ? "text" : props.beneficiaryMirror,
                true
              )}
              state={renderField(
                "state",
                props.beneficiaryMirror.stateRequired ? "text" : props.beneficiaryMirror,
                true
              )}
              beneficiaryName={renderField("beneficiaryName", "text", true)}
              occupation={renderField(
                "occupation",
                props.beneficiaryMirror.occupationRequired ? "text" : props.beneficiaryMirror,
                true
              )}
              extraInformation={renderExtraInformation()}
              name={formData["beneficiaryName"]}
              mdvi={renderSelectField("mDVI", "text", true)}
            />
          </div>
          <div className="col-md-7">
            <BeneficiaryServicesTable user={props.user} />
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col-md-5">
            <ConsentForm consent={renderConsentField("consent", "text", true)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session == null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const currentUser = await readUser(session.user.email);
  const user = await readBeneficiaryMrn(ctx.query.mrn, ctx.query.hospitalId);

  if (!user) {
    return {
      notFound: true,
    };
  }

  const beneficiaryMirror = await readBeneficiaryMirror(user.hospital?.name);
  user.hospitalName = user.hospital?.name;

  return {
    props: {
      currentUser: JSON.parse(JSON.stringify(currentUser)),
      user: JSON.parse(JSON.stringify(user)),
      beneficiaryMirror: beneficiaryMirror,
      trainingType: await getTrainingTypes(),
      counsellingType: await getCounsellingType(),
      trainingSubType: await getTrainingSubTypes(),
      hospitals: await findAllHospital(),
      query: ctx.query,
    },
  };
}

export default UserPage;
