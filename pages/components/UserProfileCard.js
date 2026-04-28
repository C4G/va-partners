import Image from "next/image";
import logo from "public/images/vision-aid-logo.webp";

export default function UserProfileCard({
  gender,
  phoneNumber,
  beneficiaryName,
  occupation,
  education,
  hospitalName,
  MRN,
  extraInformation,
  districts,
  state,
  dob,
  name,
  mdvi,
}) {
  return (
    <div className="user-profile-card">
      <div>
        <Image src={logo} alt="Profile Image" className="profile-image" />
        <h2 className="user-name">{name}</h2>
      </div>

      <div className="profile-info">
        <hr />

        <div className="profile-info-grid">
          <div className="profile-info-row">
            <div className="profile-info-label">MRN:</div>
            <div className="profile-info-value">{MRN}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Beneficiary Name:</div>
            <div className="profile-info-value">{beneficiaryName}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Hospital Name:</div>
            <div className="profile-info-value">{hospitalName}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Gender:</div>
            <div className="profile-info-value">{gender}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">MDVI:</div>
            <div className="profile-info-value">{mdvi}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Phone Number:</div>
            <div className="profile-info-value">{phoneNumber}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Date of Birth:</div>
            <div className="profile-info-value">{dob}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Occupation:</div>
            <div className="profile-info-value">{occupation}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Education:</div>
            <div className="profile-info-value">{education}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Districts:</div>
            <div className="profile-info-value">{districts}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">State:</div>
            <div className="profile-info-value">{state}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Extra Information:</div>
            <div className="profile-info-value">{extraInformation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
