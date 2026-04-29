import React from "react";
import "./SavedAddresses.css"; // CSS file for styles
import { FaChevronRight } from "react-icons/fa"; // ✅ You forgot this!

const savedAddresses = [
  { id: 1, label: "Home", location: "Amman - Dabouq" },
  { id: 2, label: "Home", location: "Amman - Dabouq" },
];

const SavedAddresses = () => {
  return (
    <div className="saved-addresses">
      {savedAddresses.map((address) => (
        <div key={address.id} className="address-card">
          <div className="address-text">
            <div className="label">{address.label}</div>
            <div className="location">{address.location}</div>
          </div>
          <FaChevronRight className="arrow-icon" />
        </div>
      ))}
    </div>
  );
};

export default SavedAddresses;
