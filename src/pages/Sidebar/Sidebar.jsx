import React, { useState } from "react";
import "./Sidebar.css";

import newShipmentIcon from "../../assets/icons/new_shipment.png";
import allShipmentsIcon from "../../assets/icons/box.png";
import addressBookIcon from "../../assets/icons/address_book.png";
import logoutIcon from "../../assets/icons/logout.png";
import khdoumLogo from "../../assets/icons/khdoum.png";

const sidebarItems = [
  { key: "new", label: "New Shipment", icon: newShipmentIcon },
  { key: "all", label: "All Shipment", icon: allShipmentsIcon },
  { key: "book", label: "Address Book", icon: addressBookIcon },
  { key: "logout", label: "Log Out", icon: logoutIcon },
];

function getProfileName(profile) {
  if (!profile) return "";
  const direct =
    profile.storeName ||
    profile.fullName ||
    profile.name ||
    profile.companyName ||
    profile.businessName ||
    "";
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const first = typeof profile.firstName === "string" ? profile.firstName : "";
  const last = typeof profile.lastName === "string" ? profile.lastName : "";
  const composed = `${first} ${last}`.trim();
  return composed;
}

function getProfilePhone(profile) {
  if (!profile) return "";
  const phone =
    profile.phone ||
    profile.mobile ||
    profile.phoneNumber ||
    profile.whatsappNumber ||
    profile.whatsAppNumber ||
    "";
  return typeof phone === "string" ? phone.trim() : "";
}

export default function Sidebar({
  activeKey,
  onSelect,
  profile,
  profileLoading,
  profileError,
  isOpen,
  onClose,
}) {
  const [internalActiveItem, setInternalActiveItem] = useState("new");
  const activeItem = activeKey ?? internalActiveItem;
  const profileName = getProfileName(profile);
  const profilePhone = getProfilePhone(profile);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "open" : ""}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="logo">
          <img src={khdoumLogo} alt="Khdoum Logo" />
        </div>

        <div className="sidebar-profile">
          {profileLoading ? (
            <div className="sidebar-profile-name">Loading...</div>
          ) : profileError ? (
            <div className="sidebar-profile-name">Profile</div>
          ) : profileName ? (
            <>
              <div className="sidebar-profile-name" title={profileName}>
                {profileName}
              </div>
              {profilePhone ? (
                <div className="sidebar-profile-phone" title={profilePhone}>
                  {profilePhone}
                </div>
              ) : null}
            </>
          ) : (
            <div className="sidebar-profile-name">Profile</div>
          )}
        </div>

        <div className="sidebar-menu">
          {sidebarItems.map((item, index) => (
            <div key={item.key} className="menu-wrapper">
              <div
                className={`menu-item ${activeItem === item.key ? "active" : ""}`}
                onClick={() => {
                  if (activeKey === undefined) {
                    setInternalActiveItem(item.key);
                  }
                  if (onSelect) {
                    onSelect(item.key);
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="menu-icon"
                  style={{
                    filter: activeItem === item.key ? "brightness(0)" : "none",
                  }}
                />
                <span
                  className="menu-label"
                  style={{
                    color: activeItem === item.key ? "#000" : "#df2429",
                  }}
                >
                  {item.label}
                </span>
              </div>

              {index !== sidebarItems.length - 1 && <hr />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
