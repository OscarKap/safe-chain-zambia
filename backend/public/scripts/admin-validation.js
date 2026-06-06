document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('admin-request-form');
    const csrfInput = document.getElementById('csrfToken');
    const confirmationCheckbox = document.getElementById('confirmation');

    // Fetch CSRF token from server and set hidden input
    try {
        const csrfResp = await fetch('/csrf-token', { credentials: 'include' });
        const csrfData = await csrfResp.json();
        csrfInput.value = csrfData.csrfToken || '';
    } catch (e) {
        console.error('Failed to fetch CSRF token', e);
    }

    // Form validation function
    function validateForm() {
        const requiredFields = [
            'fullName', 'jobTitle', 'organisation', 'province', 'district',
            'phone', 'email', 'reason', 'accessType', 'confirmation'
        ];
        for (const fieldId of requiredFields) {
            const input = document.getElementById(fieldId);
            if (!input || !input.value.trim()) {
                alert('Please fill in all required fields.');
                return false;
            }
        }
        if (!confirmationCheckbox.checked) {
            alert('Please confirm information accuracy.');
            return false;
        }
        if (!csrfInput.value) {
            alert('Missing CSRF token.');
            return false;
        }
        return true;
    }

    // Submit handler
    form.addEventListener('submit', async function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        // Use FormData to include the hidden CSRF field automatically
        const formData = new FormData(form);
        try {
            const response = await fetch('/admin/request', {
                method: 'POST',
                credentials: 'include', // send cookies
                body: formData // browser will set multipart/form-data with boundary
            });
            const data = await response.json();
            if (response.ok) {
                alert('Request submitted successfully.');
                form.reset();
                // Refresh CSRF token after successful submission
                const fresh = await fetch('/csrf-token', { credentials: 'include' });
                const freshData = await fresh.json();
                csrfInput.value = freshData.csrfToken || '';
            } else {
                alert(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form.');
        }
    });
});