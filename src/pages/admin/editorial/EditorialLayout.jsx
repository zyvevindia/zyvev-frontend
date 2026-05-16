import { NavLink, Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { layout, sidebar, main, h1, muted } from "../../../components/editorial/editorialStyles";

const navLinkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  marginBottom: 4,
  borderRadius: 8,
  color: isActive ? "#fff" : "#94a3b8",
  background: isActive ? "#1e293b" : "transparent",
  textDecoration: "none",
  fontSize: 14,
});

export default function EditorialLayout() {
  return (
    <div style={layout}>
      <Helmet>
        <title>Editorial Operations | EVSavari</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <aside style={sidebar}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>
            EVSavari
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Editorial Ops</div>
        </div>
        <NavLink to="/admin/editorial" end style={navLinkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/editorial/staged" style={navLinkStyle}>
          Staged publish
        </NavLink>
        <NavLink to="/admin/editorial/coverage" style={navLinkStyle}>
          Coverage
        </NavLink>
        <NavLink to="/admin/editorial/observations" style={navLinkStyle}>
          Observations
        </NavLink>
        <NavLink to="/admin/editorial/lead-quality" style={navLinkStyle}>
          Lead quality
        </NavLink>
        <NavLink to="/admin/editorial/public-beta" style={navLinkStyle}>
          Public beta
        </NavLink>
        <NavLink to="/admin/editorial/market-health" style={navLinkStyle}>
          Market health
        </NavLink>
        <NavLink to="/admin/editorial/market-learning" style={navLinkStyle}>
          Market learning
        </NavLink>
        <NavLink to="/admin" style={{ ...navLinkStyle({ isActive: false }), marginTop: 24 }}>
          ← CRM
        </NavLink>
      </aside>
      <main style={main}>
        <Outlet />
      </main>
    </div>
  );
}
