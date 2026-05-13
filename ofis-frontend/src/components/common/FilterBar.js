import React, { useState } from 'react';
import { FaSearch, FaFilter, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Button from './Button';
import Input from './Input';

const FilterBar = ({ 
  filters = [], 
  onFilterChange, 
  onSearch,
  onSort,
  sortField = null,
  sortOrder = null,
  showDateRange = false,
  loading = false,
  placeholder = "Rechercher...",
  children 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [localSortField, setLocalSortField] = useState(sortField);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleFilterChange = (key, value) => {
    const newValues = { ...filterValues, [key]: value };
    // Remove empty values
    Object.keys(newValues).forEach(k => {
      if (!newValues[k]) delete newValues[k];
    });
    setFilterValues(newValues);
    if (onFilterChange) onFilterChange(newValues);
  };

  const handleSort = (field) => {
    let newOrder = 'asc';
    if (localSortField === field && localSortOrder === 'asc') {
      newOrder = 'desc';
    }
    setLocalSortField(field);
    setLocalSortOrder(newOrder);
    if (onSort) onSort(field, newOrder);
  };

  const clearFilters = () => {
    setFilterValues({});
    setSearchTerm('');
    if (onFilterChange) onFilterChange({});
    if (onSearch) onSearch('');
  };

  const clearDateRange = () => {
    const newValues = { ...filterValues };
    delete newValues.date_debut;
    delete newValues.date_fin;
    setFilterValues(newValues);
    if (onFilterChange) onFilterChange(newValues);
  };

  const getSortIcon = (field) => {
    if (localSortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return localSortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filterCount = Object.keys(filterValues).filter(k => filterValues[k]).length;

  return (
    <div className="filter-bar" style={{ 
      background: 'white', 
      padding: '1rem', 
      borderRadius: '8px',
      marginBottom: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '250px' }}>
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearch}
            icon={<FaSearch />}
            disabled={loading}
          />
        </div>

        {filters.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setExpanded(!expanded)}
            icon={<FaFilter />}
            disabled={loading}
          >
            Filtres {filterCount > 0 && `(${filterCount})`}
          </Button>
        )}

        {(filterCount > 0 || searchTerm) && (
          <Button variant="ghost" onClick={clearFilters} icon={<FaTimes />} disabled={loading}>
            Effacer
          </Button>
        )}

        {children}
      </div>

      {expanded && filters.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e0e0e0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {filters.map(filter => (
              <div key={filter.name} className="form-group">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    disabled={loading}
                  >
                    <option value="">Tous</option>
                    {filter.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={filter.type || 'text'}
                    placeholder={filter.placeholder}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    disabled={loading}
                  />
                )}
              </div>
            ))}
          </div>

          {showDateRange && (
            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Date début</label>
                <Input
                  type="date"
                  value={filterValues.date_debut || ''}
                  onChange={(e) => handleFilterChange('date_debut', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Date fin</label>
                <Input
                  type="date"
                  value={filterValues.date_fin || ''}
                  onChange={(e) => handleFilterChange('date_fin', e.target.value)}
                  disabled={loading}
                />
              </div>
              {(filterValues.date_debut || filterValues.date_fin) && (
                <Button variant="ghost" onClick={clearDateRange} icon={<FaTimes />} size="sm">
                  Effacer dates
                </Button>
              )}
            </div>
          )}

          {onSort && (
            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Trier par :</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleSort('date')}
                icon={getSortIcon('date')}
              >
                Date
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleSort('created_at')}
                icon={getSortIcon('created_at')}
              >
                Date création
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;




