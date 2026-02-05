// API Configuration
const API_BASE = 'http://localhost:3002/api/inventory';

// Fetch companies
const fetchCompanies = async () => {
    try {
        const response = await fetch(`${API_BASE}/companies?search=${companySearch.value}`);
        const data = await response.json();
        if (data.success) {
            companies.value = data.data;
            filteredCompanies.value = data.data;
        }
    } catch (error) {
        console.error('Error fetching companies:', error);
        showToast('Failed to load companies', 'error');
    }
};

// Fetch company items
const fetchCompanyItems = async (companyId) => {
    try {
        const response = await fetch(
            `${API_BASE}/companies/${companyId}/items?search=${itemSearch.value}&filter=${filterBy.value}`
        );
        const data = await response.json();
        if (data.success) {
            filteredItems.value = data.data;
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        showToast('Failed to load inventory items', 'error');
    }
};

// Save company
const saveCompany = async () => {
    if (!companyForm.name.trim()) {
        showToast('Company name is required', 'error');
        return;
    }

    const url = editingCompany.value 
        ? `${API_BASE}/companies/${editingCompany.value.id}`
        : `${API_BASE}/companies`;
    
    const method = editingCompany.value ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyForm)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeModals();
            await fetchCompanies();
            
            if (!editingCompany.value && data.data) {
                selectCompany(data.data);
            }
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error saving company:', error);
        showToast('Failed to save company', 'error');
    }
};

// Save item
const saveItem = async () => {
    if (!itemForm.name.trim()) {
        showToast('Item name is required', 'error');
        return;
    }

    if (!selectedCompany.value) {
        showToast('Please select a company first', 'error');
        return;
    }

    const url = editingItem.value 
        ? `${API_BASE}/items/${editingItem.value.id}`
        : `${API_BASE}/items`;
    
    const method = editingItem.value ? 'PUT' : 'POST';
    
    const itemData = {
        ...itemForm,
        company_id: selectedCompany.value.id
    };
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeModals();
            await fetchCompanyItems(selectedCompany.value.id);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Failed to save item', 'error');
    }
};

// Adjust stock
const applyStockAdjustment = async () => {
    if (!adjustingItem.value || adjustQuantity.value <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/items/${adjustingItem.value.id}/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adjustment_type: adjustmentType.value,
                quantity: adjustQuantity.value,
                reason: adjustReason.value,
                notes: adjustNotes.value,
                adjusted_by: 'admin'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Stock adjusted successfully', 'success');
            closeModals();
            await fetchCompanyItems(selectedCompany.value.id);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showToast('Failed to adjust stock', 'error');
    }
};

// Quick adjust
const quickAdjust = async (itemId, amount) => {
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}/quick-adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: amount > 0 ? 'increase' : 'decrease'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Stock ${amount > 0 ? 'increased' : 'decreased'} by 1`, 'success');
            await fetchCompanyItems(selectedCompany.value.id);
        }
    } catch (error) {
        console.error('Error in quick adjust:', error);
    }
};

// Delete item
const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Item deleted successfully', 'success');
            await fetchCompanyItems(selectedCompany.value.id);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Failed to delete item', 'error');
    }
};

// Fetch statistics
const fetchStatistics = async () => {
    try {
        const response = await fetch(`${API_BASE}/statistics`);
        const data = await response.json();
        if (data.success) {
            // Update your statistics variables here
            console.log('Statistics:', data.data);
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
};

// Initialize on component mount
onMounted(async () => {
    await fetchCompanies();
    await fetchStatistics();
    
    if (companies.value.length > 0 && !selectedCompany.value) {
        selectCompany(companies.value[0]);
    }
});