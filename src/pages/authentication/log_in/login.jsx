import styles from "./SignInScreen.module.css";
import CustomToggleButton from "../../../components/CustomToggleButton";
import CustomCheckBox from "../../../components/CustomCheckBox";
import PhoneNumberInputWithCountry from "../../../components/PhoneNumberInput";
import CustomButton from "../../../components/CustomButton/CustomButton";
import khdoumLogo from "../../../assets/images/khdoum.png";
import { useSignInLogic } from "./hooks/useSignInLogic";

export default function SignInScreen() {
  const {
    phone,
    setPhone,
    // dialCode,
    setDialCode,
    useAsFinancialPhone,
    toggleUseAsFinancialPhone,
    handleSignIn,
    navigate,
  } = useSignInLogic();

  const handlePhoneInput = ({ phone, dialCode }) => {
    setPhone(phone);
    setDialCode(dialCode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toggleContainer}>
        <CustomToggleButton />
      </div>

      <div className={styles.content}>
        <img src={khdoumLogo} alt="logo" height={250} />

        <h2 className={styles.heading}>Sign In Now</h2>

        <label className={styles.label}>Phone Number</label>
        <div style={{ padding: 0 }}>
          <PhoneNumberInputWithCountry
            value={phone}
            onChange={handlePhoneInput}
          />
        </div>

        <div className={styles.checkboxContainer}>
          <CustomCheckBox
            value={useAsFinancialPhone}
            label="Login as employee"
            onChange={toggleUseAsFinancialPhone}
          />
        </div>

        <div className={styles.buttonContainer}>
          <CustomButton title="Sign In" onClick={handleSignIn} />
        </div>

        <p className={styles.footerText}>
          Don't have an account?{" "}
          <span className={styles.link} onClick={() => navigate("/signup")}>
            Create New
          </span>
        </p>
      </div>
    </div>
  );
}
