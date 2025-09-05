// AppointEase Admin JavaScript

function showMessage(text, type = 'success') {
    const existing = document.querySelector('.ae-message');
    if (existing) existing.remove();
    
    const message = document.createElement('div');
    message.className = `ae-message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

function openServiceModal() {
    showModal('serviceModal');
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
}

function openStaffModal() {
    showModal('staffModal');
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
}

function showModal(modalId) {
    const existingModal = document.querySelector('.ae-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    let modalHTML = '';
    
    if (modalId === 'serviceModal') {
        modalHTML = `
            <div class="ae-modal" id="serviceModal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h2 class="ae-modal-title">Add Service</h2>
                        <button class="ae-close" onclick="closeModal('serviceModal')">&times;</button>
                    </div>
                    <form id="serviceForm">
                        <input type="hidden" id="serviceId" name="id">
                        <div class="ae-form-group">
                            <label class="ae-form-label">Service Name</label>
                            <input type="text" id="serviceName" name="name" class="ae-form-input" required>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Duration (minutes)</label>
                            <input type="number" id="serviceDuration" name="duration" class="ae-form-input" required>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Price ($)</label>
                            <input type="number" id="servicePrice" name="price" step="0.01" class="ae-form-input" required>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Description</label>
                            <textarea id="serviceDescription" name="description" class="ae-form-input ae-form-textarea"></textarea>
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn secondary" onclick="closeModal('serviceModal')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Service</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } else if (modalId === 'staffModal') {
        modalHTML = `
            <div class="ae-modal" id="staffModal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h2 class="ae-modal-title">Add Staff Member</h2>
                        <button class="ae-close" onclick="closeModal('staffModal')">&times;</button>
                    </div>
                    <form id="staffForm">
                        <input type="hidden" id="staffId" name="id">
                        <div class="ae-form-group">
                            <label class="ae-form-label">Name</label>
                            <input type="text" id="staffName" name="name" class="ae-form-input" required>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Email</label>
                            <input type="email" id="staffEmail" name="email" class="ae-form-input" required>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Phone</label>
                            <input type="tel" id="staffPhone" name="phone" class="ae-form-input">
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn secondary" onclick="closeModal('staffModal')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Staff</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    if (modalId === 'serviceModal') {
        document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
    } else if (modalId === 'staffModal') {
        document.getElementById('staffForm').addEventListener('submit', handleStaffSubmit);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function handleServiceSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    const formData = new FormData(e.target);
    formData.append('action', 'save_service');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Service saved successfully!', 'success');
            closeModal('serviceModal');
            setTimeout(() => location.reload(), 1000);
        } else {
            showMessage('Failed to save service', 'error');
            btn.textContent = 'Save Service';
            btn.disabled = false;
        }
    })
    .catch(() => {
        showMessage('Error saving service', 'error');
        btn.textContent = 'Save Service';
        btn.disabled = false;
    });
}

function handleStaffSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    const formData = new FormData(e.target);
    formData.append('action', 'save_staff');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Staff member saved successfully!', 'success');
            closeModal('staffModal');
            setTimeout(() => location.reload(), 1000);
        } else {
            showMessage('Failed to save staff member', 'error');
            btn.textContent = 'Save Staff';
            btn.disabled = false;
        }
    })
    .catch(() => {
        showMessage('Error saving staff member', 'error');
        btn.textContent = 'Save Staff';
        btn.disabled = false;
    });
}

function editService(id) {
    fetch(ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_service&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const service = data.data;
            showModal('serviceModal');
            setTimeout(() => {
                document.getElementById('serviceId').value = service.id;
                document.getElementById('serviceName').value = service.name;
                document.getElementById('serviceDuration').value = service.duration;
                document.getElementById('servicePrice').value = service.price;
                document.getElementById('serviceDescription').value = service.description || '';
                document.querySelector('#serviceModal .ae-modal-title').textContent = 'Edit Service';
            }, 100);
        }
    });
}

function editStaff(id) {
    fetch(ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_staff&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const staff = data.data;
            showModal('staffModal');
            setTimeout(() => {
                document.getElementById('staffId').value = staff.id;
                document.getElementById('staffName').value = staff.name;
                document.getElementById('staffEmail').value = staff.email;
                document.getElementById('staffPhone').value = staff.phone || '';
                document.querySelector('#staffModal .ae-modal-title').textContent = 'Edit Staff Member';
            }, 100);
        }
    });
}

function deleteService(id) {
    if (confirm('Delete this service?')) {
        fetch(ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=delete_service&id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Service deleted successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showMessage('Failed to delete service', 'error');
            }
        })
        .catch(() => {
            showMessage('Error deleting service', 'error');
        });
    }
}

function deleteStaff(id) {
    if (confirm('Delete this staff member?')) {
        fetch(ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=delete_staff&id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Staff member deleted successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showMessage('Failed to delete staff member', 'error');
            }
        })
        .catch(() => {
            showMessage('Error deleting staff member', 'error');
        });
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('ae-modal')) {
        e.target.remove();
    }
});