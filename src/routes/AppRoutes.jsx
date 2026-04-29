import { Routes, Route } from "react-router-dom";
import SignIn from "../pages/authentication/log_in/login";
import PinCodeScreen from "../pages/authentication/pin/PinCodeScreen";
import DeliveryTracker from "../pages/home/HomeScreen.jsx";
import AddShipment from "../pages/add_shipment/addShipment";
import ShipmentDetails from "../pages/shipments/ShipmentDetails";
import { PublicOnly, RequireAuth } from "./RouteGuards";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <SignIn />
          </PublicOnly>
        }
      />
      <Route
        path="/pin"
        element={
          <PublicOnly>
            <PinCodeScreen />
          </PublicOnly>
        }
      />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <DeliveryTracker />
          </RequireAuth>
        }
      />{" "}
      {/* ✔️ Home route */}
      <Route
        path="/add-shipment"
        element={
          <RequireAuth>
            <AddShipment />
          </RequireAuth>
        }
      />{" "}
      <Route
        path="/shipment/:id"
        element={
          <RequireAuth>
            <ShipmentDetails />
          </RequireAuth>
        }
      />{" "}
      {/* ✔️ Home route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
