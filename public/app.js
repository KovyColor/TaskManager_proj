// API Base Configuration - use relative paths for production compatibility
// Note: AUTH_API is defined in auth.js
const API = "/api/tasks";
const USERS_API = "/api/users";
const REPORTS_API = "/api/reports";

// Helper to get sidebar element (must be called after DOM loads)
function getSidebar() {
  return document.getElementById("sidebar");
}

// --- Authentication Functions ---
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// --- Logout function (called from HTML onclick) ---
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login.html';
}

// --- Role-based visibility ---
function applyRoleBasedVisibility() {
  const role = localStorage.getItem('role') || 'user';
  const employeesButton = document.querySelector('[data-view="employees"]');
  const reportsButton = document.querySelector('[data-view="reports"]');

  if (!employeesButton || !reportsButton) {
    return; // Sidebar buttons not found, skip
  }

  if (role === 'admin') {
    console.log('✅ User is ADMIN - showing Employees and Reports buttons');
    employeesButton.style.display = 'block';
    reportsButton.style.display = 'block';
  } else {
    console.log('📌 User is regular user - hiding Employees, showing Reports');
    employeesButton.style.display = 'none';
    reportsButton.style.display = 'block';
  }
}

// Global application state
const appState = {
  tasks: [],
  categories: [],
  categoriesFromServer: false,
  categoriesMap: {},
  recentlyViewedTasks: [],
  employees: [],
  reports: [],
  currentPage: 1,
  totalPages: 1,
  filters: {
    status: '',
    search: '',
    employee: '',
    reportCategory: ''
  }
};

// Toggle sidebar visibility
function toggleSidebar() {
  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl) {
    sidebarEl.hidden = false; // Ensure it's not hidden by attribute
    sidebarEl.classList.toggle("open");
  }
}

// --- Local storage helpers ---
function saveTasksToStorage() {
  try {
    localStorage.setItem('tasks', JSON.stringify(appState.tasks));
  } catch (err) {
    console.warn('Failed to save tasks to localStorage', err);
  }
}

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem('tasks');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      appState.tasks = parsed;
    }
  } catch (err) {
    console.warn('Failed to load tasks from localStorage', err);
  }
}

// Initialize app state from localStorage (if present)
loadTasksFromStorage();

// Categories support (fetch from server or fall back to defaults)
const defaultCategories = [
  { id: 'work', name: 'Work' },
  { id: 'study', name: 'Study' },
  { id: 'personal', name: 'Personal' }
];


async function loadCategories() {
  const select = document.getElementById('category');
  select.innerHTML = '';
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const cats = await res.json();
      if (Array.isArray(cats) && cats.length > 0) {
        appState.categoriesFromServer = true;
        appState.categories = cats;
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = c.name;
          select.appendChild(opt);
          appState.categoriesMap[c._id] = c.name;
        });
        return;
      }
    }
  } catch (err) {
    // ignore, we'll fall back to defaults
  }

  // Fallback to default categories (frontend-only)
  appState.categoriesFromServer = false;
  appState.categories = defaultCategories.slice();
  defaultCategories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    select.appendChild(opt);
    appState.categoriesMap[c.name] = c.name;
  });
}

// Load employees (admin only)
async function loadEmployees() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    appState.employees = [];
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    appState.employees = [];
    return;
  }

  try {
    const res = await fetch(USERS_API, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      appState.employees = await res.json();
    } else {
      appState.employees = [];
    }
  } catch (err) {
    console.warn('Failed to load employees:', err);
    appState.employees = [];
  }

  renderEmployees();
}

// Render employees in table
function renderEmployees() {
  const tableBody = document.getElementById('employees-table-body');
  const emptyMessage = document.getElementById('employees-empty');

  if (!tableBody || !emptyMessage) return;

  tableBody.innerHTML = '';

  if (appState.employees.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  appState.employees.forEach(employee => {
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid #1e293b;';

    const emailCell = document.createElement('td');
    emailCell.style.cssText = 'padding: 12px; color: #e5e7eb;';
    emailCell.textContent = employee.email;

    const roleCell = document.createElement('td');
    roleCell.style.cssText = 'padding: 12px; color: #e5e7eb;';
    roleCell.textContent = employee.role;

    const actionCell = document.createElement('td');
    actionCell.style.cssText = 'padding: 12px; text-align: center;';
    
    const viewTasksBtn = document.createElement('button');
    viewTasksBtn.textContent = 'View Tasks';
    viewTasksBtn.style.cssText = 'padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
    viewTasksBtn.onclick = () => {
      // Set employee filter and navigate to dashboard
      appState.filters.employee = employee.email;
      appState.filters.search = '';  // Clear other filters
      appState.filters.status = '';
      appState.currentPage = 1;
      loadTasks().then(() => {
        showView('view-dashboard', 'Dashboard');
      });
    };

    actionCell.appendChild(viewTasksBtn);
    row.appendChild(emailCell);
    row.appendChild(roleCell);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

// Load reports (auth required)
async function loadReports() {
  const token = localStorage.getItem('token');
  if (!token) {
    appState.reports = [];
    return;
  }

  try {
    const res = await fetch(REPORTS_API, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      appState.reports = await res.json();
    } else {
      appState.reports = [];
    }
  } catch (err) {
    console.warn('Failed to load reports:', err);
    appState.reports = [];
  }

  renderReports();
}

// Render reports
function renderReports() {
  const container = document.getElementById('reports-container');
  const emptyMessage = document.getElementById('reports-empty');
  const role = localStorage.getItem('role') || 'user';

  if (!container || !emptyMessage) return;

  container.innerHTML = '';

  // Apply category filter if set
  let filtered = appState.reports;
  if (appState.filters.reportCategory) {
    filtered = appState.reports.filter(r => r.category === appState.filters.reportCategory);
  }

  if (filtered.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  filtered.forEach(report => {
    const reportEl = document.createElement('div');
    reportEl.style.cssText = 'background: #111827; border: 1px solid #1e293b; border-radius: 4px; padding: 12px; margin-bottom: 10px;';

    const titleEl = document.createElement('h4');
    titleEl.style.cssText = 'margin: 0 0 5px; color: #3b82f6; font-size: 14px;';
    titleEl.textContent = report.title;

    const descEl = document.createElement('p');
    descEl.style.cssText = 'margin: 0 0 8px; color: #e5e7eb; font-size: 13px;';
    descEl.textContent = report.description;

    const metaEl = document.createElement('div');
    metaEl.style.cssText = 'font-size: 12px; color: #9ca3af; margin-bottom: 8px;';
    metaEl.innerHTML = `<span>Category: <strong>${report.category}</strong></span> | <span>By: <strong>${report.createdBy?.email || 'Unknown'}</strong></span>`;

    reportEl.appendChild(titleEl);
    reportEl.appendChild(descEl);
    reportEl.appendChild(metaEl);

    // Add delete button for admin only
    if (role === 'admin') {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️ Delete';
      deleteBtn.style.cssText = 'padding: 6px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;';
      deleteBtn.onclick = () => deleteReport(report._id);
      reportEl.appendChild(deleteBtn);
    }

    container.appendChild(reportEl);
  });
}

// Create report
async function createReport() {
  const titleEl = document.getElementById('report-title');
  const descEl = document.getElementById('report-description');
  const categoryEl = document.getElementById('report-category');
  const token = localStorage.getItem('token');

  if (!token) {
    alert('You must be logged in to create a report');
    return;
  }

  const title = titleEl?.value?.trim();
  const description = descEl?.value?.trim();
  const category = categoryEl?.value;

  if (!title || !description || !category) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const res = await fetch(REPORTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ title, description, category })
    });

    const data = await res.json();

    if (res.ok) {
      titleEl.value = '';
      descEl.value = '';
      categoryEl.value = '';
      loadReports();
      alert('Report created successfully');
    } else {
      alert('Failed to create report: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error creating report: ' + err.message);
  }
}

// Delete report (admin only)
async function deleteReport(reportId) {
  if (!confirm('Are you sure you want to delete this report?')) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in');
    return;
  }

  try {
    const res = await fetch(REPORTS_API + '/' + reportId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      loadReports();
      alert('Report deleted successfully');
    } else {
      const data = await res.json();
      alert('Failed to delete report: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error deleting report: ' + err.message);
  }
}

// Load recently viewed tasks for authenticated users
async function loadRecentlyViewedTasks() {
  const token = localStorage.getItem('token');
  if (!token) {
    appState.recentlyViewedTasks = [];
    return;
  }
  
  try {
    const res = await fetch(API + '/recently-viewed/list', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      appState.recentlyViewedTasks = await res.json();
    } else {
      appState.recentlyViewedTasks = [];
    }
  } catch (err) {
    console.warn('Failed to load recently viewed tasks:', err);
    appState.recentlyViewedTasks = [];
  }
}

// Apply filters and reload tasks
function applyFilters() {
  appState.currentPage = 1;
  loadTasks(1);
}

// Clear employee filter
function clearEmployeeFilter() {
  appState.filters.employee = '';
  appState.currentPage = 1;
  loadTasks(1);
}

// Update pagination UI
function updatePaginationUI() {
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const pageInfo = document.getElementById('page-info');
  
  const prevBtnTasks = document.getElementById('prev-page-btn-tasks');
  const nextBtnTasks = document.getElementById('next-page-btn-tasks');
  const pageInfoTasks = document.getElementById('page-info-tasks');
  
  // Update dashboard pagination
  if (prevBtn && nextBtn && pageInfo) {
    prevBtn.disabled = appState.currentPage <= 1;
    nextBtn.disabled = appState.currentPage >= appState.totalPages;
    pageInfo.textContent = 'Page ' + appState.currentPage + ' of ' + appState.totalPages;
  }
  
  // Update tasks view pagination
  if (prevBtnTasks && nextBtnTasks && pageInfoTasks) {
    prevBtnTasks.disabled = appState.currentPage <= 1;
    nextBtnTasks.disabled = appState.currentPage >= appState.totalPages;
    pageInfoTasks.textContent = 'Page ' + appState.currentPage + ' of ' + appState.totalPages;
  }
}

// ===== TASK MODAL FUNCTIONS =====

async function openTaskModal(taskId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found');
      return;
    }

    // Fetch task details
    console.log('📥 Fetching task details for:', taskId);
    const response = await fetch(`/api/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.status}`);
    }

    const task = await response.json();
    console.log('✅ Task loaded:', task);

    // Populate modal fields
    document.getElementById('modalTitle').textContent = task.title || 'Task';
    document.getElementById('modalDescription').textContent = task.description || 'No description';
    document.getElementById('modalAssignedTo').textContent = task.assignedTo || 'Unassigned';
    document.getElementById('modalCreatedAt').textContent = new Date(task.createdAt).toLocaleDateString();
    document.getElementById('modalStatus').value = task.status || 'pending';

    // Store task ID for save operation
    window.currentTaskId = taskId;

    // Show modal
    const modalEl = document.getElementById('taskModal');
    modalEl.hidden = false;
    console.log('🟢 Modal opened for task:', taskId);
  } catch (err) {
    console.error('❌ Error opening task modal:', err);
    alert('Failed to load task details');
  }
}

function closeModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.hidden = true;
  }
  window.currentTaskId = null;
  console.log('🟢 Modal closed');
}

// Alias for compatibility
const closeTaskModal = closeModal;

async function updateTaskStatus(taskId) {
  try {
    if (!taskId) {
      console.error('❌ No task ID provided');
      return;
    }

    // Read the new status from modal select
    const modalStatus = document.getElementById('modalStatus');
    const newStatus = modalStatus ? modalStatus.value : null;
    
    if (!newStatus) {
      console.error('❌ No status selected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found');
      return;
    }

    console.log('📤 Updating task status:', taskId, newStatus);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status}`);
    }

    const updatedTask = await response.json();
    console.log('✅ Task updated:', updatedTask);

    // Refresh task lists
    loadTasks();
    loadRecentlyViewedTasks();

    // Show success message
    alert('Task status updated successfully!');
    
    // Close modal after successful save
    closeModal();
  } catch (err) {
    console.error('❌ Error updating task:', err);
    alert('Failed to update task status');
  }
}

// ===== MODAL SETUP FUNCTION =====
function setupModalEventListeners() {
  const modalEl = document.getElementById('taskModal');
  const modalCloseBtn = document.querySelector('.modal-close');
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalSaveBtn = document.getElementById('modalSaveBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');
  
  console.log('🔧 Setting up modal event listeners');
  
  // Close modal on close button click
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  }
  
  // Close modal on overlay click
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  }
  
  // Close modal on cancel button click
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  }
  
  // Save status changes
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const taskId = window.currentTaskId;
      if (taskId) {
        await updateTaskStatus(taskId);
      }
    });
  }
  
  // Delete task
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const taskId = window.currentTaskId;
      if (taskId) {
        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
          await deleteTask(taskId);
        }
      }
    });
  }
  
  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('taskModal');
      if (modal && !modal.hidden) {
        closeModal();
      }
    }
  });
  
  console.log('✅ Modal event listeners setup complete');
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated - redirect to login if not
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const currentRole = localStorage.getItem('role');
  console.log('📍 Dashboard loaded');
  console.log('   Token exists:', !!localStorage.getItem('token'));
  console.log('   Current role:', currentRole);
  console.log('   Full localStorage:', JSON.stringify(localStorage));

  // Unhide sidebar on successful authentication
  const sidebar = getSidebar();
  if (sidebar) {
    sidebar.hidden = false;
  }

  // Setup menu button click handler
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Auto-resize textarea
  const textarea = document.getElementById("description");
  if (textarea) {
    textarea.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = (this.scrollHeight) + "px";
    });
  }

  // Setup filter event listeners for DASHBOARD
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      appState.filters.search = this.value;
      appState.filters.employee = '';  // Clear employee filter
      applyFilters();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      appState.filters.status = this.value;
      appState.filters.employee = '';  // Clear employee filter
      applyFilters();
    });
  }

  // Setup filter event listeners for TASKS VIEW
  const searchInputTasks = document.getElementById('search-input-tasks');
  const statusFilterTasks = document.getElementById('status-filter-tasks');
  
  if (searchInputTasks) {
    searchInputTasks.addEventListener('input', function() {
      appState.filters.search = this.value;
      appState.filters.employee = '';  // Clear employee filter
      applyFilters();
    });
  }
  
  if (statusFilterTasks) {
    statusFilterTasks.addEventListener('change', function() {
      appState.filters.status = this.value;
      appState.filters.employee = '';  // Clear employee filter
      applyFilters();
    });
  }

  // Apply role-based visibility
  console.log('🔐 Applying role-based visibility rules...');
  applyRoleBasedVisibility();

  // Setup report filter listener
  const reportFilter = document.getElementById('report-filter');
  if (reportFilter) {
    reportFilter.addEventListener('change', function() {
      appState.filters.reportCategory = this.value;
      renderReports();
    });
  }

  // ===== SETUP MODAL EVENT LISTENERS (ONCE) =====
  setupModalEventListeners();

  // Setup sidebar event listeners
  const headerTitle = document.querySelector('.header h3');
  
  // Sidebar navigation listeners with proper data-view handling
  const sidebarButtons = document.querySelectorAll('.sidebar button[data-view]');
  console.log('✏️  Sidebar buttons found:', sidebarButtons.length);
  
  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const view = this.getAttribute('data-view');
      console.log('👆 Clicked button:', view);
      const viewId = 'view-' + view;
      
      // Clear employee filter when navigating to Dashboard
      if (view === 'dashboard') {
        appState.filters.employee = '';
        appState.filters.search = '';
        appState.filters.status = '';
        appState.currentPage = 1;
      }
      
      // Show the view
      showView(viewId, this.textContent.trim());
      const sidebarEl = getSidebar();
      if (sidebarEl) sidebarEl.classList.remove('open');
      
      // Load data based on view
      if (view === 'employees') {
        loadEmployees();
      }
      if (view === 'reports') {
        loadReports();
      }
    });
  });

  // Load initial data if authenticated
  if (isAuthenticated()) {
    // First, make sure dashboard is visible
    const dashboardView = document.getElementById('view-dashboard');
    if (dashboardView) {
      dashboardView.classList.add('active');
      dashboardView.hidden = false;
    }
    
    // Update active button for dashboard
    const dashboardBtn = document.querySelector('.sidebar button[data-view="dashboard"]');
    if (dashboardBtn) dashboardBtn.classList.add('active');
    
    // Then load data
    loadCategories().then(() => {
      loadTasks();
      loadRecentlyViewedTasks();
      loadEmployees();
      loadReports();
    });
  }
});

// Close sidebar when clicking outside it
document.addEventListener("click", function(event) {
  const sidebar = getSidebar();
  if (!sidebar || !sidebar.classList.contains("open")) return;
  
  // Don't close if clicking the menu button or inside sidebar
  if (event.target.classList.contains("menu-btn") || 
      sidebar.contains(event.target)) {
    return;
  }
  
  // Close sidebar
  sidebar.classList.remove("open");
});

// Delegated delete handler (single listener)
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (!id) return;
  deleteTask(id);
});

// View navigation (SPA-style)
function showView(viewId, title) {
  console.log('📄 Showing view:', viewId, 'Title:', title);
  const headerTitle = document.querySelector('.header h3');
  
  // Hide all views and remove active class
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active'); 
    v.hidden = true;
  });
  
  // Show selected view
  const view = document.getElementById(viewId);
  if (view) { 
    view.classList.add('active'); 
    view.hidden = false;
  }

  // Update active sidebar button
  document.querySelectorAll('.sidebar button[data-view]').forEach(b => b.classList.remove('active'));
  const viewName = viewId.replace('view-','');
  const btn = document.querySelector(`.sidebar button[data-view="${viewName}"]`);
  if (btn) btn.classList.add('active');

  // Update header title
  if (headerTitle && title) headerTitle.textContent = title;

  // Update pagination UI for current page
  updatePaginationUI();

  // Handle view-specific initialization
  if (viewId === 'view-dashboard') {
    // Dashboard: update stats and render all
    renderAll();
  }
  
  if (viewId === 'view-tasks') {
    // Tasks view: render recently added component and sync filters
    renderRecentlyAddedTasks('recently-added-tasks-view');
    
    // Sync filter inputs with current app state
    const searchInputTasks = document.getElementById('search-input-tasks');
    const statusFilterTasks = document.getElementById('status-filter-tasks');
    
    if (searchInputTasks) searchInputTasks.value = appState.filters.search;
    if (statusFilterTasks) statusFilterTasks.value = appState.filters.status;
    
    // Also update the pagination and task list
    updatePaginationUI();
    renderAll();
  }
  
  if (viewId === 'view-employees') {
    // Employees view: render recently added component
    renderRecentlyAddedTasks('recently-added-tasks-employees');
  }
}

function createEmptyState(title, subtitle) {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  const icon = document.createElement('div');
  icon.className = 'empty-icon';
  const h4 = document.createElement('h4'); h4.textContent = title;
  const p = document.createElement('p'); p.textContent = subtitle;
  wrapper.appendChild(icon); wrapper.appendChild(h4); wrapper.appendChild(p);
  return wrapper;
}

function createTaskElement(t) {
  const div = document.createElement('div');
  div.className = 'task';
  div.style.cursor = 'pointer';

  const left = document.createElement('div');
  const titleEl = document.createElement('b'); titleEl.textContent = t.title;
  const p = document.createElement('p'); p.textContent = t.description;
  const badge = document.createElement('span'); badge.className = `badge ${t.priority}`; badge.textContent = t.priority;

  // Category label (resolve from populated object, client-side name, or id mapping)
  const categoryLabel = (t.category && t.category.name) || t.categoryName || appState.categoriesMap[t.category] || t.category;
  let categoryEl = null;
  if (categoryLabel) {
    categoryEl = document.createElement('span');
    categoryEl.className = 'category-tag';
    categoryEl.textContent = categoryLabel;
  }

  left.appendChild(titleEl);
  if (categoryEl) left.appendChild(categoryEl);
  left.appendChild(p);
  left.appendChild(badge);

  const btn = document.createElement('button');
  btn.className = 'delete-btn';
  btn.setAttribute('data-id', t._id);
  btn.setAttribute('aria-label', 'Delete task');
  btn.textContent = '✕';

  // Prevent modal open when clicking delete button
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  div.appendChild(left);
  div.appendChild(btn);

  // Add click listener to open task modal
  div.addEventListener('click', () => {
    console.log('📌 Task clicked:', t._id);
    openTaskModal(t._id);
  });

  return div;
}

function updateStats() {
  const tasks = appState.tasks;
  document.getElementById("total").innerText = tasks.length;
  document.getElementById("high").innerText = tasks.filter(t=>t.priority==="high").length;
  document.getElementById("progress").innerText = tasks.filter(t=>t.status==="in_progress").length;
}

function renderAll() {
  const tasks = appState.tasks;
  
  // Display employee filter message if active (for dashboard)
  const employeeFilterMsg = document.getElementById('employee-filter-message');
  if (employeeFilterMsg) {
    if (appState.filters.employee) {
      const clearBtn = document.createElement('div');
      clearBtn.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
      clearBtn.innerHTML = `<div>📋 Viewing tasks for: <strong>${appState.filters.employee}</strong></div>
                            <button type="button" onclick="clearEmployeeFilter()" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✕ Clear Filter</button>`;
      employeeFilterMsg.innerHTML = '';
      employeeFilterMsg.appendChild(clearBtn);
      employeeFilterMsg.style.display = 'block';
    } else {
      employeeFilterMsg.style.display = 'none';
    }
  }
  
  // Display employee filter message if active (for tasks view)
  const employeeFilterMsgTasks = document.getElementById('employee-filter-message-tasks');
  if (employeeFilterMsgTasks) {
    if (appState.filters.employee) {
      const clearBtn = document.createElement('div');
      clearBtn.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
      clearBtn.innerHTML = `<div>📋 Viewing tasks for: <strong>${appState.filters.employee}</strong></div>
                            <button type="button" onclick="clearEmployeeFilter()" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✕ Clear Filter</button>`;
      employeeFilterMsgTasks.innerHTML = '';
      employeeFilterMsgTasks.appendChild(clearBtn);
      employeeFilterMsgTasks.style.display = 'block';
    } else {
      employeeFilterMsgTasks.style.display = 'none';
    }
  }
  
  // Render recently viewed tasks (from server) - dashboard only
  const recentlyViewedContainer = document.getElementById('recently-viewed-tasks');
  if (recentlyViewedContainer) {
    recentlyViewedContainer.innerHTML = '';
    if (appState.recentlyViewedTasks.length === 0) {
      recentlyViewedContainer.appendChild(createEmptyState('No recently viewed tasks', 'View a task to see it here'));
    } else {
      appState.recentlyViewedTasks.forEach(t => {
        recentlyViewedContainer.appendChild(createTaskElement(t));
      });
    }
  }
  
  // Recent tasks (most recently created) - dashboard only
  const recentContainer = document.getElementById('recent-tasks');
  if (recentContainer) {
    recentContainer.innerHTML = '';
    const recent = tasks.slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5);
    if (recent.length === 0) {
      recentContainer.appendChild(createEmptyState('No recent tasks', 'Create a task to see it here'));
    } else {
      recent.forEach(t => recentContainer.appendChild(createTaskElement(t)));
    }
  }

  // All tasks (filtered/paginated) - dashboard
  const list = document.getElementById('tasks');
  if (list) {
    list.innerHTML = '';
    if (tasks.length === 0) {
      list.appendChild(createEmptyState('No tasks found', 'Try adjusting your filters'));
    } else {
      tasks.forEach(t => list.appendChild(createTaskElement(t)));
    }
  }
  
  // All tasks (filtered/paginated) - tasks view
  const listTasks = document.getElementById('tasks-list');
  if (listTasks) {
    listTasks.innerHTML = '';
    if (tasks.length === 0) {
      listTasks.appendChild(createEmptyState('No tasks found', 'Try adjusting your filters'));
    } else {
      tasks.forEach(t => listTasks.appendChild(createTaskElement(t)));
    }
  }

  updateStats();
}

async function loadTasks(page = 1) {
  try {
    appState.currentPage = page;
    
    // Build URL with query parameters
    let url = API + '?page=' + page + '&limit=5';
    
    // Add status filter if set (and not filtering by employee)
    if (appState.filters.status && !appState.filters.employee) {
      url += '&status=' + encodeURIComponent(appState.filters.status);
    }
    
    // Add search filter if set (and not filtering by employee)
    if (appState.filters.search && !appState.filters.employee) {
      url += '&search=' + encodeURIComponent(appState.filters.search);
    }
    
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    
    const res = await fetch(url, { headers });
    const data = await res.json();
    
    // Handle both paginated and direct task array responses
    if (data.tasks && data.pagination) {
      appState.tasks = data.tasks;
      appState.currentPage = data.pagination.page;
      appState.totalPages = data.pagination.pages;
    } else if (Array.isArray(data)) {
      appState.tasks = data;
      appState.totalPages = 1;
    } else {
      appState.tasks = [];
      appState.totalPages = 1;
    }
    
    // Apply employee filter on frontend if set
    if (appState.filters.employee) {
      appState.tasks = appState.tasks.filter(t => t.assignedTo === appState.filters.employee);
    }
    
    saveTasksToStorage();
  } catch (err) {
    console.warn('Failed to load tasks from server, using local cache');
    appState.totalPages = 1;
  }
  renderAll();
  updatePaginationUI();
}

async function createTask(){
  const titleEl = document.getElementById('title');
  const descriptionEl = document.getElementById('description');
  const assignedEl = document.getElementById('assignedTo');
  const priorityEl = document.getElementById('priority');
  const statusEl = document.getElementById('status');

  const categoryEl = document.getElementById('category');
  const selectedCategoryValue = categoryEl ? categoryEl.value : null;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in as an admin to create tasks. Please log in.');
    return;
  }

  const payload = {
    title: titleEl.value,
    description: descriptionEl.value,
    assignedTo: assignedEl.value,
    priority: priorityEl.value,
    status: statusEl ? statusEl.value : 'pending'
  };
  if (appState.categoriesFromServer && selectedCategoryValue) payload.category = selectedCategoryValue;

  try {
    const res = await fetch(API,{
      method:"POST",
      headers:{ "Content-Type":"application/json", 'Authorization': 'Bearer ' + token },
      body:JSON.stringify(payload)
    });

    // Read body once as text, then attempt to parse JSON and reuse parsed object
    const text = await res.text();
    let created = null;
    try {
      created = text ? JSON.parse(text) : null;
    } catch (err) {
      created = null;
    }

    if (res.status === 401 || res.status === 403) {
      alert('Permission denied: admin access required to create tasks.');
      console.error('Create failed authorization', res.status, text);
      return;
    }

    if (res.ok) {
      if (!created) {
        alert('Server returned an invalid response.');
        console.error('Expected JSON body on successful create but got:', text);
        return;
      }
      // Add server-confirmed task
      appState.tasks.push(created);
      if (created.category && created.category._id && created.category.name) {
        appState.categoriesMap[created.category._id] = created.category.name;
      }
      saveTasksToStorage();
      loadTasks();  // Reload tasks to update pagination
      // Reset inputs after successful create
      titleEl.value = descriptionEl.value = assignedEl.value = "";
      if (statusEl) statusEl.value = "pending";
    } else {
      alert('Failed to create task: ' + res.status + ' ' + text);
      console.error('Server responded with error when creating task:', res.status, text);
    }
  } catch (err) {
    alert('An error occurred while creating the task.');
    console.error('Failed to send new task to server:', err.message);
  }
}

async function deleteTask(id){
  // If this is a local temporary task (not yet on server), remove locally immediately
  if (String(id).startsWith('local-')) {
    const idx = appState.tasks.findIndex(t => t._id === id);
    if (idx !== -1) {
      appState.tasks.splice(idx,1);
      saveTasksToStorage();
      renderAll();
    }
    return;
  }

  // For server-backed tasks, call DELETE and only update local state on success
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to delete tasks. Please log in.');
      return;
    }

    const url = `${API}/${id}`;
    const res = await fetch(url, { method: "DELETE", headers: { 'Authorization': 'Bearer ' + token } });

    const text = await res.text();

    if (res.status === 401) {
      alert('Authentication required. Please log in again.');
      console.error('Delete failed with authorization error', res.status, text);
      return;
    }

    if (res.status === 403) {
      alert('Permission denied: You can only delete tasks you created.');
      console.error('Delete failed with authorization error', res.status, text);
      return;
    }

    if (res.ok || res.status === 404) {
      const idx = appState.tasks.findIndex(t => t._id === id);
      if (idx !== -1) {
        appState.tasks.splice(idx,1);
        saveTasksToStorage();
        renderAll();
      }
      
      // Close modal and reload task list
      closeModal();
      loadTasks();
      
      alert('Task deleted successfully');
    } else {
      alert('Failed to delete task: ' + res.status + ' ' + text);
      console.error('Server failed to delete task:', res.status, text);
    }
  } catch (err) {
    alert('An error occurred while deleting the task.');
    console.error('Failed to delete task on server:', err);
  }
}

// Global Recently Added Tasks Component
async function renderRecentlyAddedTasks(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const token = localStorage.getItem('token');
  if (!token) {
    container.innerHTML = '<div class="empty-state"><p>Please log in to view recently added tasks</p></div>';
    return;
  }

  try {
    // Fetch tasks sorted by createdAt descending, limited to 5
    const res = await fetch(API + '?page=1&limit=5&sortBy=createdAt&sortOrder=desc', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      container.innerHTML = '<div class="empty-state"><p>No recently added tasks</p></div>';
      return;
    }

    const data = await res.json();
    const tasks = Array.isArray(data) ? data : (data.tasks || []);
    
    if (tasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No tasks available</p></div>';
      return;
    }

    // Format and display recently added tasks
    container.innerHTML = '';
    const recentTasks = tasks.slice(0, 5);
    
    recentTasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'recently-added-task';
      
      // Format date
      const createdDate = new Date(task.createdAt);
      const formattedDate = createdDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      // Status badge color
      const statusColor = task.status === 'completed' ? '#22c55e' : 
                         task.status === 'in_progress' ? '#f59e0b' : '#6b7280';
      
      taskEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
          <div style="flex: 1; min-width: 0;">
            <p style="margin: 0 0 4px; font-weight: 600; font-size: 13px; color: #e5e7eb; word-break: break-word;">
              ${task.title || 'Untitled'}
            </p>
            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
              ${task.assignedTo ? 'Assigned to: <strong>' + task.assignedTo + '</strong>' : 'No assignment'}
            </p>
          </div>
          <span style="display: inline-block; padding: 3px 8px; background: ${statusColor}30; color: ${statusColor}; border-radius: 4px; font-size: 11px; white-space: nowrap; flex-shrink: 0;">
            ${task.status || 'pending'}
          </span>
        </div>
        <p style="margin: 0; font-size: 11px; color: #6b7280;">
          ${formattedDate}
        </p>
      `;
      
      container.appendChild(taskEl);
    });
  } catch (err) {
    console.warn('Failed to load recently added tasks:', err);
    container.innerHTML = '<div class="empty-state"><p>Unable to load tasks</p></div>';
  }
}

