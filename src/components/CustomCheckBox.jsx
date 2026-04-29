import "./CustomCheckBox.css";

export default function CustomCheckBox({ value, label, onChange }) {
  return (
    <label className="custom-checkbox">
      <input
        type="checkbox"
        checked={value}
        onChange={onChange}
        className="custom-checkbox-input"
      />

      <span className="custom-checkbox-box" />

      <span className="custom-checkbox-label">{label}</span>
    </label>
  );
}
