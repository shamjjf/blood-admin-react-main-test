import React from "react";

const DonationCard = ({ donation }) => {
  const { chosenDate, donor, status } = donation;
  // // console.log("Donations: ", donation)
  const { bloodGroup, dob, email, gender, homeAddress, lastDonated, name, officeAddress, phone, phoneCode, weight } =
    donor;
  return (
    <div className="col-md-6 mb-4 stretch-card transparent donation-card">
      <div className="card card-tale">
        <div className="card-body donation-card-body">
          <p className="align-center">
            <span className="font-weight">Donor: </span> {name}
          </p>
          <div className="flex-card">
            <p>
              <span className="font-weight">Blood Group: </span>
              {bloodGroup}
            </p>
          </div>
          <p>
            <span className="font-weight">Gender: </span>
            {gender}
          </p>
          <p>
            <span className="font-weight">Status: </span>
            {status}
          </p>
          <div className="flex-card">
            <p>
              <span className="font-weight">Phone: </span>+{phoneCode} {phone}
            </p>
          </div>
          <p>
            <span className="font-weight">Choosen Date: </span>
            {new Date(chosenDate).toISOString().split("T")[0]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
