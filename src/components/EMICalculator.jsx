import { useEffect, useState } from "react";

/* =========================================================
   ==================== EMI CALCULATOR =====================
   ========================================================= */

export default function EMICalculator({
  price,
}) {
  const [
    downPayment,
    setDownPayment,
  ] = useState(
    Math.round(price * 0.2)
  );

  const [
    interestRate,
    setInterestRate,
  ] = useState(9);

  const [tenure, setTenure] =
    useState(5);

  const [emi, setEmi] =
    useState(0);

  const [
    totalInterest,
    setTotalInterest,
  ] = useState(0);

  const [
    totalAmount,
    setTotalAmount,
  ] = useState(0);

  /* =========================================================
     ==================== EMI LOGIC =========================
     ========================================================= */

  useEffect(() => {
    calculateEMI();
  }, [
    downPayment,
    interestRate,
    tenure,
    price,
  ]);

  const calculateEMI = () => {
    const principal =
      price - Number(downPayment || 0);

    const monthlyRate =
      interestRate / 12 / 100;

    const months = tenure * 12;

    if (monthlyRate === 0) {
      const emiValue =
        principal / months;

      setEmi(Math.round(emiValue));

      setTotalAmount(
        Math.round(principal)
      );

      setTotalInterest(0);

      return;
    }

    const emiValue =
      (principal *
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          months
        )) /
      (Math.pow(
        1 + monthlyRate,
        months
      ) -
        1);

    const totalPayable =
      emiValue * months;

    const totalInterestPayable =
      totalPayable - principal;

    setEmi(Math.round(emiValue));

    setTotalAmount(
      Math.round(totalPayable)
    );

    setTotalInterest(
      Math.round(
        totalInterestPayable
      )
    );
  };

  const loanAmount =
    price - downPayment;

  /* =========================================================
     ======================== RENDER =========================
     ========================================================= */

  return (
    <div style={container}>
      {/* ================= HEADER ================= */}

      <div style={headerSection}>
        <div style={headerRow}>
          <div style={iconWrapper}>
            💰
          </div>

          <div>
            <h2 style={title}>
              EMI Calculator
            </h2>

            <p style={subtitle}>
              Calculate your monthly EV
              financing instantly with
              premium financing insights.
            </p>
          </div>
        </div>

        <div style={topBadge}>
          Finance Ready
        </div>
      </div>

      {/* ================= MAIN RESULT ================= */}

      <div style={heroResultCard}>
        <p style={resultLabel}>
          Estimated Monthly EMI
        </p>

        <h1 style={resultValue}>
          ₹{emi.toLocaleString()}
        </h1>

        <p style={monthlyText}>
          per month
        </p>
      </div>

      {/* ================= BREAKDOWN ================= */}

      <div style={summaryGrid}>
        <div style={summaryCard}>
          <p style={summaryLabel}>
            Vehicle Price
          </p>

          <h3 style={summaryValue}>
            ₹
            {price.toLocaleString()}
          </h3>
        </div>

        <div style={summaryCard}>
          <p style={summaryLabel}>
            Loan Amount
          </p>

          <h3 style={summaryValue}>
            ₹
            {loanAmount.toLocaleString()}
          </h3>
        </div>

        <div style={summaryCard}>
          <p style={summaryLabel}>
            Total Interest
          </p>

          <h3 style={summaryValue}>
            ₹
            {totalInterest.toLocaleString()}
          </h3>
        </div>

        <div style={summaryCard}>
          <p style={summaryLabel}>
            Total Payable
          </p>

          <h3 style={summaryValue}>
            ₹
            {totalAmount.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}

      <div style={controlsSection}>
        {/* ================= DOWN PAYMENT ================= */}

        <div style={controlCard}>
          <div style={controlHeader}>
            <label style={label}>
              Down Payment
            </label>

            <span style={valuePill}>
              ₹
              {downPayment.toLocaleString()}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={price}
            step="50000"
            value={downPayment}
            onChange={(e) =>
              setDownPayment(
                Number(
                  e.target.value
                )
              )
            }
            style={slider}
          />

          <input
            type="number"
            value={downPayment}
            onChange={(e) =>
              setDownPayment(
                Number(
                  e.target.value
                )
              )
            }
            style={input}
          />
        </div>

        {/* ================= INTEREST RATE ================= */}

        <div style={controlCard}>
          <div style={controlHeader}>
            <label style={label}>
              Interest Rate
            </label>

            <span style={valuePill}>
              {interestRate}%
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={interestRate}
            onChange={(e) =>
              setInterestRate(
                Number(
                  e.target.value
                )
              )
            }
            style={slider}
          />

          <input
            type="number"
            value={interestRate}
            onChange={(e) =>
              setInterestRate(
                Number(
                  e.target.value
                )
              )
            }
            style={input}
          />
        </div>

        {/* ================= TENURE ================= */}

        <div style={controlCard}>
          <div style={controlHeader}>
            <label style={label}>
              Loan Tenure
            </label>

            <span style={valuePill}>
              {tenure} Years
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={tenure}
            onChange={(e) =>
              setTenure(
                Number(
                  e.target.value
                )
              )
            }
            style={slider}
          />

          <input
            type="number"
            value={tenure}
            onChange={(e) =>
              setTenure(
                Number(
                  e.target.value
                )
              )
            }
            style={input}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const container = {
  background: "white",
  padding:
    "clamp(24px, 4vw, 36px)",
  borderRadius: "32px",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

/* =========================================================
   ========================= HEADER =========================
   ========================================================= */

const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "34px",
};

const headerRow = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const iconWrapper = {
  width: "62px",
  height: "62px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, #16a34a, #15803d)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  color: "white",
  boxShadow:
    "0 14px 32px rgba(22,163,74,0.24)",
};

const title = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.8px",
};

const subtitle = {
  color: "#64748b",
  marginTop: "8px",
  marginBottom: 0,
  lineHeight: "1.8",
  maxWidth: "520px",
};

const topBadge = {
  background:
    "linear-gradient(135deg, #dcfce7, #bbf7d0)",
  color: "#15803d",
  padding: "10px 18px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "13px",
};

/* =========================================================
   ======================= HERO RESULT ======================
   ========================================================= */

const heroResultCard = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  borderRadius: "30px",
  padding:
    "clamp(30px, 5vw, 46px)",
  textAlign: "center",
  color: "white",
  boxShadow:
    "0 24px 60px rgba(37,99,235,0.24)",
};

const resultLabel = {
  color: "#dbeafe",
  marginBottom: "14px",
  fontWeight: "600",
  fontSize: "15px",
};

const resultValue = {
  fontSize:
    "clamp(42px, 7vw, 72px)",
  margin: 0,
  fontWeight: "800",
  letterSpacing: "-2px",
  lineHeight: "1",
};

const monthlyText = {
  marginTop: "14px",
  color: "#dbeafe",
  fontSize: "15px",
};

/* =========================================================
   ======================== SUMMARY =========================
   ========================================================= */

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginTop: "30px",
};

const summaryCard = {
  background:
    "linear-gradient(to bottom, #ffffff, #f8fafc)",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "22px",
};

const summaryLabel = {
  color: "#64748b",
  marginBottom: "12px",
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const summaryValue = {
  margin: 0,
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
};

/* =========================================================
   ======================== CONTROLS ========================
   ========================================================= */

const controlsSection = {
  display: "flex",
  flexDirection: "column",
  gap: "22px",
  marginTop: "34px",
};

const controlCard = {
  background:
    "linear-gradient(to bottom, #ffffff, #f8fafc)",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "24px",
};

const controlHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const label = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
};

const valuePill = {
  background:
    "linear-gradient(135deg, #dbeafe, #bfdbfe)",
  color: "#1d4ed8",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "700",
};

const slider = {
  width: "100%",
  cursor: "pointer",
  marginBottom: "18px",
};

const input = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "18px",
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "white",
};