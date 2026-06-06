document.addEventListener('DOMContentLoaded', function() {
    // Load pending requests
    document.getElementById('load-pending-btn').addEventListener('click', async function() {
        const response = await fetch('/admin/requests/pending');
        const requests = await response.json();
        const container = document.querySelector('#pending .grid');
        container.innerHTML = '';

        requests.forEach(request => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
            card.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">${request.fullName}</h3>
                <p class="text-sm text-gray-600 mb-4">${request.jobTitle} at ${request.organisation}</p>
                <p class="text-sm text-gray-700">Province: ${request.province}</p>
                <p class="text-sm text-gray-700">District: ${request.district}</p>
                <p class="text-sm text-gray-700">Phone: ${request.phone}</p>
                <p class="text-sm text-sm">Email: ${request.email}</p>
                <p class="text-sm text-gray-700 mt-2">Reason: ${request.reason}</p>
                <div class="mt-4 flex justify-between">
                    <button class="bg-green-500 text-white px-3 py-1 rounded" onclick="approveRequest('${request.id}')">Approve</button>
                    <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="rejectRequest('${request.id}')">Reject</button>
                </div>
            `;
            container.appendChild(card);
        });
    });

    // Load approved admins
    document.getElementById('load-approved-btn').addEventListener('click', async function() {
        const response = await fetch('/admin/users/approved');
        const users = await response.json();
        const tbody = document.getElementById('approved-admins-tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'border-b';
            row.innerHTML = `
                <td class="p-4">${user.username}</td>
                <td class="p-4">${user.email}</td>
                <td class="p-4">${user.role}</td>
                <td class="p-4">${user.status}</td>
                <td class="p-4">
                    <button class="bg-yellow-500 text-white px-3 py-1 rounded" onclick="suspendUser('${user.id}')">Suspend</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    });

    // Load suspended admins
    document.getElementById('load-suspended-btn').addEventListener('click', async function() {
        const response = await fetch('/admin/users/suspended');
        const users = await response.json();
        const tbody = document.getElementById('suspended-admins-tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'border-b';
            row.innerHTML = `
                <td class="p-4">${user.username}</td>
                <td class="p-4">${user.email}</td>
                <td class="p-4">${user.role}</td>
                <td class="p-4">${new Date(user.updatedAt).toLocaleDateString()}</td>
                <td class="p-4">
                    <button class="bg-green-500 text-white px-3 py-1 rounded" onclick="reactivateUser('${user.id}')">Reactivate</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    });

    // Load roles
    document.getElementById('load-roles-btn').addEventListener('click', async function() {
        const response = await fetch('/admin/roles');
        const roles = await response.json();
        const container = document.getElementById('roles-list');
        container.innerHTML = '';

        roles.forEach(role => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded mb-4';
            div.innerHTML = `
                <h4 class="text-lg font-semibold">${role.name}</h4>
                <p class="text-sm text-gray-600">Permissions: ${JSON.stringify(role.permissions)}</p>
            `;
            container.appendChild(div);
        });
    });

    // Load activity logs
    document.getElementById('load-logs-btn').addEventListener('click', async function() {
        const response = await fetch('/admin/logs');
        const logs = await response.json();
        const container = document.getElementById('activity-logs-container');
        container.innerHTML = '';

        logs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded mb-4';
            div.innerHTML = `
                <p class="text-sm text-gray-600">User: ${log.userId}</p>
                <p class="text-sm text-gray-700">Action: ${log.action}</p>
                <p class="text-sm text-gray-700">Target: ${log.target}</p>
                <p class="text-sm text-gray-600">Timestamp: ${new Date(log.timestamp).toLocaleString()}</p>
            `;
            container.appendChild(div);
        });
    });
});

// Global functions for approve/reject/suspend/reactivate
async function approveRequest(id) {
    const response = await fetch(`/admin/requests/${id}/approve`, { method: 'POST' });
    const data = await response.json();
    alert(data.message);
    // Refresh pending requests
    document.getElementById('load-pending-btn').click();
}

async function rejectRequest(id) {
    const response = await fetch(`/admin/requests/${id}/reject`, { method: 'POST' });
    const data = await response.json();
    alert(data.message);
    // Refresh pending requests
    document.getElementById('load-pending-btn').click();
}

async function suspendUser(id) {
    const response = await fetch(`/admin/users/${id}/suspend`, { method: 'POST' });
    const data = await response.json();
    alert(data.message);
    // Refresh approved admins
    document.getElementById('load-approved-btn').click();
}

async function reactivateUser(id) {
    const response = await fetch(`/admin/users/${id}/reactivate`, { method: 'POST' });
    const data = await response.json();
    alert(data.message);
    // Refresh suspended admins
    document.getElementById('load-suspended-btn').click();
}