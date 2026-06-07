import { useRouter } from "next/router";
import { useState, useEffect } from "react"; // Added hooks
import ReferencePage from "./ReferencePage";

export default function BeneficiaryServicesTable(props) {
  const router = useRouter();

  // 1. Create a state variable to track the hospital tier
  const [hospitalTier, setHospitalTier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch the hospital tier when the component mounts or hospitalId changes
  useEffect(() => {
    async function fetchHospitalTier() {
      if (!props.user?.hospitalId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Replace this URL/logic with your actual API endpoint or function
        const response = await fetch(`/api/hospitals/${props.user.hospitalId}`);
        const data = await response.json();

        // Assuming your backend payload returns an object like: { hospitalTier: "community_screening" }
        setHospitalTier(data.hospitalTier);
      } catch (error) {
        console.error("Failed to fetch hospital tier:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHospitalTier();
  }, [props.user?.hospitalId]);

  const openUserHistoricalEvaluationPage = async (mrn = null, hospitalId = null, service = null) => {
    if (mrn && hospitalId)
      router.push(`/historicalEvaluationDashboard?mrn=${mrn}&hospitalId=${hospitalId}&service=${service}`);
    else {
      router.push(`/beneficiaryinformation`, undefined, { shallow: true });
    }
  };

  const openNewEvalutaionPage = async (mrn = null, hospitalId = null, service = null) => {
    if (mrn && hospitalId) {
      router.push(`/newEvaluationDashboard?mrn=${mrn}&hospitalId=${hospitalId}&service=${service}`);
    } else {
      router.push(`/beneficiaryinformation`);
    }
  };

  // 3. Define your conditional display check
  const showCommunityScreening = hospitalTier === "COMMUNITY_SCREENING";

  return (
    <>
      <ReferencePage></ReferencePage>
      <br></br>
      <br></br>
      <table className="beneficiary-table table-bordered table">
        <thead className="thead-dark">
        <tr>
          <th scope="col">Services</th>
          <th scope="col">Evaluation Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <th scope="row">Comprehensive Low Vision Evaluation</th>
          <td>
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() =>
                openUserHistoricalEvaluationPage(
                  props.user.mrn,
                  props.user.hospitalId,
                  "Comprehensive_Low_Vision_Evaluation"
                )
              }
            >
              History
            </button>
            <div className="divider" />
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() =>
                openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Comprehensive_Low_Vision_Evaluation")
              }
            >
              New Evaluation
            </button>
          </td>
        </tr>
        <tr>
          <th scope="row">Vision Enhancement (less than 7 years old)</th>
          <td>
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() =>
                openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Vision_Enhancement")
              }
            >
              History
            </button>
            <div className="divider" />
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Vision_Enhancement")}
            >
              New Evaluation
            </button>
          </td>
        </tr>
        <tr>
          <th scope="row">Counselling</th>
          <td>
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() =>
                openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Counselling_Education")
              }
            >
              History
            </button>
            <div className="divider" />
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Counselling_Education")}
            >
              New Evaluation
            </button>
          </td>
        </tr>
        <tr>
          <th scope="row">Training</th>
          <td>
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() => openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Training")}
            >
              History
            </button>
            <div className="divider" />
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Training")}
            >
              New Evaluation
            </button>
          </td>
        </tr>
        <tr>
          <th scope="row">Camp_Low Vision Screening</th>
          <td>
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() =>
                openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Low_Vision_Screening")
              }
            >
              History
            </button>
            <div className="divider" />
            <button
              type="button"
              className="btn btn-success btn-block border-0"
              onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Low_Vision_Screening")}
            >
              New Evaluation
            </button>
          </td>
        </tr>

        {/* 4. Display row contextually based on API response state */}
        {!isLoading && showCommunityScreening && (
          <tr>
            <th scope="row">Community Screening</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Community_Screening")
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Community_Screening")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
        )}
        </tbody>
      </table>
    </>
  );
}