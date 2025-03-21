import { useState, useEffect } from "react";
import { Search } from "some-icon-library"; // Ajusta según la biblioteca que uses

function OrganizationSelector({
  organizations,
  onSelect,
  selectedOrganization,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrganizations, setFilteredOrganizations] =
    useState(organizations);

  // Filtra las organizaciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrganizations(organizations);
    } else {
      const filtered = organizations.filter((org) =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchTerm, organizations]);

  return (
    <div className="organization-selector">
      {/* Campo de búsqueda */}
      <div className="search-container">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Buscar organizaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Lista de organizaciones filtradas */}
      <div className="organizations-list">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className={`organization-item ${
                selectedOrganization?.id === org.id ? "selected" : ""
              }`}
              onClick={() => onSelect(org)}
            >
              {org.logo && (
                <img
                  src={org.logo}
                  alt={`${org.name} logo`}
                  className="org-logo"
                />
              )}
              <span>{org.name}</span>
            </div>
          ))
        ) : (
          <div className="no-results">No se encontraron organizaciones</div>
        )}
      </div>
    </div>
  );
}

export default OrganizationSelector;
