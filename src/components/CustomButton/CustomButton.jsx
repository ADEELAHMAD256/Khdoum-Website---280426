import styles from "./CustomButton.module.css";
import PropTypes from "prop-types";

export default function CustomButton({ title, onClick, height = 58 }) {
  return (
    <button
      onClick={onClick}
      className={styles.button}
      style={{ height }}
    >
      {title}
    </button>
  );
}

CustomButton.propTypes = {
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  height: PropTypes.number,
};
