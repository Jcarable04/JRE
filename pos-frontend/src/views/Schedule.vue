<template>
  <div class="schedule-page">
    <!-- Header -->
    <header class="schedule-header">
      <div class="header-content">
        <h1>📅 Employee Schedule Generator</h1>
        <p class="subtitle">Manage employee schedules with automated rotation</p>
        
        <!-- Week Navigation -->
        <div class="week-navigation">
          <button @click="previousWeek" class="nav-btn">
            ◀ Previous Week
          </button>
          <div class="current-week">
            <h2>Week {{ currentWeek }} of {{ currentYear }}</h2>
            <p>{{ formatDateRange(currentWeekDates.start) }} - {{ formatDateRange(currentWeekDates.end) }}</p>
          </div>
          <button @click="nextWeek" class="nav-btn">
            Next Week ▶
          </button>
        </div>
        
        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <span class="stat-number">{{ totalEmployees }}</span>
              <span class="stat-label">Total Employees</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <span class="stat-number">{{ scheduledEmployees }}</span>
              <span class="stat-label">Scheduled</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <span class="stat-number">{{ dayShiftCount }}</span>
              <span class="stat-label">Day Shifts</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌙</div>
            <div class="stat-info">
              <span class="stat-number">{{ nightShiftCount }}</span>
              <span class="stat-label">Night Shifts</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Sidebar - Employee Management -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>👥 Employees</h3>
          <button @click="showAddEmployee = true" class="add-employee-btn">
            ➕ Add Employee
          </button>
        </div>
        
        <!-- Employee List -->
        <div class="employee-list">
          <div 
            v-for="employee in employees"
            :key="employee.id"
            @click="selectEmployee(employee)"
            class="employee-item"
            :class="{ 'active': selectedEmployee?.id === employee.id }"
          >
            <div class="employee-avatar">
              {{ getInitials(employee.first_name, employee.last_name) }}
            </div>
            <div class="employee-info">
              <h4 class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</h4>
              <p class="employee-details">
                {{ employee.position }}
                <span :class="getShiftPreferenceClass(employee.shift_preference)">
                  {{ formatShiftPreference(employee.shift_preference) }}
                </span>
              </p>
            </div>
            <div class="employee-actions">
              <button @click.stop="editEmployee(employee)" class="icon-btn small">
                ✏️
              </button>
              <button @click.stop="deleteEmployee(employee.id)" class="icon-btn small danger">
                🗑️
              </button>
            </div>
          </div>
          
          <div v-if="employees.length === 0" class="empty-employee-list">
            <p>No employees found</p>
            <button @click="showAddEmployee = true" class="add-first-btn">
              ➕ Add Your First Employee
            </button>
          </div>
        </div>
        
        <!-- Schedule Controls -->
        <div class="schedule-controls">
          <h4>Schedule Actions</h4>
          <button @click="generateSchedule" class="primary-btn full-width">
            🔄 Generate Schedule
          </button>
          <button @click="clearSchedule" class="secondary-btn full-width">
            🗑️ Clear Schedule
          </button>
          <button @click="exportSchedule" class="secondary-btn full-width">
            📥 Export Schedule
          </button>
          <button @click="loadSampleData" class="secondary-btn full-width">
            📋 Load Sample Data
          </button>
        </div>
      </aside>

      <!-- Main Schedule Area -->
      <main class="schedule-main">
        <!-- Schedule Table -->
        <div class="schedule-container">
          <div class="schedule-header-row">
            <div class="employee-header">Employee</div>
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="day-header"
              :class="{ 'weekend': day.isWeekend }"
            >
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>
          
          <!-- Employee Rows -->
          <div 
            v-for="employee in employees"
            :key="employee.id"
            class="schedule-row"
          >
            <div class="employee-cell">
              <div class="employee-cell-content">
                <div class="employee-avatar small">
                  {{ getInitials(employee.first_name, employee.last_name) }}
                </div>
                <div class="employee-cell-info">
                  <strong>{{ employee.first_name }} {{ employee.last_name }}</strong>
                  <small>{{ employee.position }}</small>
                  <small :class="getShiftPreferenceClass(employee.shift_preference)">
                    {{ formatShiftPreference(employee.shift_preference) }}
                  </small>
                </div>
              </div>
            </div>
            
            <!-- Day Cells -->
            <div 
              v-for="day in weekDays" 
              :key="`${employee.id}-${day.date}`"
              class="day-cell"
              :class="{
                'weekend': day.isWeekend,
                'rest-day': isRestDay(employee.id, day.date),
                'day-shift': isDayShift(employee.id, day.date),
                'night-shift': isNightShift(employee.id, day.date)
              }"
              @click="editShift(employee, day.date)"
            >
              <div v-if="isRestDay(employee.id, day.date)" class="rest-day-indicator">
                🛌 Rest
              </div>
              <div v-else-if="isDayShift(employee.id, day.date)" class="shift-indicator day">
                ☀️ Day Shift<br>
                <small>8:00 AM - 5:00 PM</small>
              </div>
              <div v-else-if="isNightShift(employee.id, day.date)" class="shift-indicator night">
                🌙 Night Shift<br>
                <small>9:00 PM - 6:00 AM</small>
              </div>
              <div v-else class="empty-shift" @click="assignShift(employee, day.date)">
                + Assign
              </div>
              
              <!-- Shift Controls -->
              <div v-if="getShift(employee.id, day.date)" class="shift-controls">
                <button @click.stop="removeShift(employee.id, day.date)" class="icon-btn tiny danger">
                  ✕
                </button>
              </div>
            </div>
          </div>
          
          <!-- Summary Row -->
          <div class="summary-row">
            <div class="employee-cell">Daily Summary</div>
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="summary-cell"
              :class="{ 'weekend': day.isWeekend }"
            >
              <div class="summary-counts">
                <span class="day-count">☀️ {{ getDayShiftCount(day.date) }}</span>
                <span class="night-count">🌙 {{ getNightShiftCount(day.date) }}</span>
              </div>
              <div class="rest-count">🛌 {{ getRestDayCount(day.date) }}</div>
            </div>
          </div>
        </div>

        <!-- Schedule Statistics -->
        <div class="schedule-stats">
          <div class="stat-card">
            <h4>📊 Schedule Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total Work Days:</span>
                <span class="stat-value">{{ totalWorkDays }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Day Shifts:</span>
                <span class="stat-value">{{ dayShiftCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Night Shifts:</span>
                <span class="stat-value">{{ nightShiftCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Rest Days:</span>
                <span class="stat-value">{{ restDayCount }}</span>
              </div>
            </div>
          </div>
          
          <!-- Employee Work Summary -->
          <div class="employee-summary">
            <h4>👥 Employee Work Hours</h4>
            <div class="summary-list">
              <div 
                v-for="employee in employeesWithHours"
                :key="employee.id"
                class="employee-hours"
                :class="{ 'overtime': employee.weeklyHours > 48 }"
              >
                <span class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</span>
                <span class="hours-count">{{ employee.weeklyHours }} hours</span>
                <div class="hours-bar">
                  <div 
                    class="hours-fill"
                    :style="{ width: Math.min(employee.weeklyHours / 60 * 100, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    
    <!-- Add/Edit Employee Modal -->
    <div v-if="showAddEmployee" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingEmployee ? 'Edit Employee' : 'Add New Employee' }}</h3>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>First Name *</label>
              <input v-model="employeeForm.first_name" placeholder="John" />
            </div>
            <div class="form-group">
              <label>Last Name *</label>
              <input v-model="employeeForm.last_name" placeholder="Doe" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Employee ID *</label>
              <input v-model="employeeForm.employee_id" placeholder="EMP-001" />
            </div>
            <div class="form-group">
              <label>Position *</label>
              <input v-model="employeeForm.position" placeholder="Cashier" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Department</label>
              <input v-model="employeeForm.department" placeholder="Front Desk" />
            </div>
            <div class="form-group">
              <label>Shift Preference *</label>
              <select v-model="employeeForm.shift_preference">
                <option value="any">Any Shift</option>
                <option value="day">Day Shift Only</option>
                <option value="night">Night Shift Only</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input v-model="employeeForm.email" placeholder="john@company.com" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input v-model="employeeForm.phone" placeholder="+63 912 345 6789" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Rest Days per Week</label>
            <div class="rest-days-selector">
              <button 
                v-for="n in [1, 2]"
                :key="n"
                @click="employeeForm.rest_days_per_week = n"
                class="rest-day-btn"
                :class="{ 'active': employeeForm.rest_days_per_week === n }"
              >
                {{ n }} {{ n === 1 ? 'Day' : 'Days' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="employeeForm.notes" placeholder="Additional notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="secondary-btn">Cancel</button>
          <button @click="saveEmployee" class="primary-btn">
            {{ editingEmployee ? 'Update' : 'Save' }} Employee
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Shift Modal -->
    <div v-if="showAssignShift" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h3>Assign Shift - {{ assigningEmployee?.first_name }} {{ assigningEmployee?.last_name }}</h3>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="shift-info">
            <p><strong>Date:</strong> {{ assigningDate }}</p>
            <p><strong>Day:</strong> {{ getDayName(assigningDate) }}</p>
          </div>
          
          <div class="shift-options">
            <button 
              @click="assignRestDay"
              class="shift-option-btn rest"
              :class="{ 'active': selectedShift === 'rest' }"
            >
              🛌 Rest Day
            </button>
            
            <button 
              @click="selectedShift = 'day'"
              class="shift-option-btn day"
              :class="{ 'active': selectedShift === 'day' }"
              :disabled="assigningEmployee?.shift_preference === 'night'"
            >
              ☀️ Day Shift
              <small>8:00 AM - 5:00 PM</small>
            </button>
            
            <button 
              @click="selectedShift = 'night'"
              class="shift-option-btn night"
              :class="{ 'active': selectedShift === 'night' }"
              :disabled="assigningEmployee?.shift_preference === 'day'"
            >
              🌙 Night Shift
              <small>9:00 PM - 6:00 AM</small>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="secondary-btn">Cancel</button>
          <button @click="saveShift" class="primary-btn" :disabled="!selectedShift">
            Assign Shift
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <span class="toast-icon">{{ toast.icon }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';

export default {
  name: 'Schedule',
  setup() {
    // State Management
    const employees = ref([]);
    const schedules = ref({});
    const selectedEmployee = ref(null);
    
    // Current week tracking
    const currentWeek = ref(getCurrentWeek());
    const currentYear = ref(new Date().getFullYear());
    
    // UI State
    const showAddEmployee = ref(false);
    const showAssignShift = ref(false);
    const editingEmployee = ref(null);
    const assigningEmployee = ref(null);
    const assigningDate = ref('');
    const selectedShift = ref('');
    
    // Forms
    const employeeForm = reactive({
      first_name: '',
      last_name: '',
      employee_id: '',
      position: '',
      department: '',
      shift_preference: 'any',
      email: '',
      phone: '',
      rest_days_per_week: 1,
      notes: '',
      status: 'active'
    });
    
    // Toast
    const toast = reactive({
      show: false,
      message: '',
      type: 'success',
      icon: '✅'
    });

    // Computed Properties
    const totalEmployees = computed(() => employees.value.length);
    
    const scheduledEmployees = computed(() => {
      return employees.value.filter(emp => {
        const empSchedules = schedules.value[emp.id] || {};
        return Object.keys(empSchedules).length > 0;
      }).length;
    });
    
    const weekDays = computed(() => {
      const days = [];
      const startDate = getWeekStartDate(currentWeek.value, currentYear.value);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toISOString().split('T')[0];
        const isWeekend = dayName === 'Sat' || dayName === 'Sun';
        
        days.push({
          name: dayName,
          date: dateStr,
          fullDate: date,
          isWeekend
        });
      }
      
      return days;
    });
    
    const currentWeekDates = computed(() => {
      const start = getWeekStartDate(currentWeek.value, currentYear.value);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    });
    
    const dayShiftCount = computed(() => {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        Object.values(empSchedule).forEach(shift => {
          if (shift === 'day') count++;
        });
      });
      return count;
    });
    
    const nightShiftCount = computed(() => {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        Object.values(empSchedule).forEach(shift => {
          if (shift === 'night') count++;
        });
      });
      return count;
    });
    
    const restDayCount = computed(() => {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        Object.values(empSchedule).forEach(shift => {
          if (shift === 'rest') count++;
        });
      });
      return count;
    });
    
    const totalWorkDays = computed(() => {
      return dayShiftCount.value + nightShiftCount.value;
    });
    
    const employeesWithHours = computed(() => {
      return employees.value.map(emp => {
        const empSchedule = schedules.value[emp.id] || {};
        const workDays = Object.values(empSchedule).filter(shift => 
          shift === 'day' || shift === 'night'
        ).length;
        
        const weeklyHours = workDays * 9; // 9 hours per shift
        
        return {
          ...emp,
          weeklyHours
        };
      });
    });

    // Initialize
    onMounted(() => {
      loadEmployees();
      loadSchedules();
    });

    // Helper Functions
    function getCurrentWeek() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
      return Math.ceil(days / 7);
    }
    
    function getWeekStartDate(week, year) {
      const firstDayOfYear = new Date(year, 0, 1);
      const daysOffset = (week - 1) * 7;
      const startDate = new Date(firstDayOfYear);
      startDate.setDate(firstDayOfYear.getDate() + daysOffset - firstDayOfYear.getDay() + 1);
      return startDate;
    }
    
    function formatDateRange(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    function getInitials(firstName, lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    
    function formatShiftPreference(preference) {
      const map = {
        'any': 'Any Shift',
        'day': 'Day Only',
        'night': 'Night Only'
      };
      return map[preference] || preference;
    }
    
    function getShiftPreferenceClass(preference) {
      const classes = {
        'any': 'any-shift',
        'day': 'day-shift',
        'night': 'night-shift'
      };
      return classes[preference] || '';
    }
    
    function getDayName(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    function showToast(message, type = 'success') {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      toast.message = message;
      toast.type = type;
      toast.icon = icons[type] || icons.info;
      toast.show = true;

      setTimeout(() => {
        toast.show = false;
      }, 3000);
    }

    // Schedule Helper Functions
    function isRestDay(employeeId, date) {
      const empSchedule = schedules.value[employeeId] || {};
      return empSchedule[date] === 'rest';
    }
    
    function isDayShift(employeeId, date) {
      const empSchedule = schedules.value[employeeId] || {};
      return empSchedule[date] === 'day';
    }
    
    function isNightShift(employeeId, date) {
      const empSchedule = schedules.value[employeeId] || {};
      return empSchedule[date] === 'night';
    }
    
    function getShift(employeeId, date) {
      const empSchedule = schedules.value[employeeId] || {};
      return empSchedule[date];
    }
    
    function getDayShiftCount(date) {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        if (empSchedule[date] === 'day') count++;
      });
      return count;
    }
    
    function getNightShiftCount(date) {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        if (empSchedule[date] === 'night') count++;
      });
      return count;
    }
    
    function getRestDayCount(date) {
      let count = 0;
      Object.values(schedules.value).forEach(empSchedule => {
        if (empSchedule[date] === 'rest') count++;
      });
      return count;
    }

    // Data Persistence
    function loadEmployees() {
      const saved = localStorage.getItem('employees');
      if (saved) {
        employees.value = JSON.parse(saved);
      }
    }
    
    function saveEmployees() {
      localStorage.setItem('employees', JSON.stringify(employees.value));
    }
    
    function loadSchedules() {
      const saved = localStorage.getItem('schedules');
      if (saved) {
        schedules.value = JSON.parse(saved);
      }
    }
    
    function saveSchedules() {
      localStorage.setItem('schedules', JSON.stringify(schedules.value));
    }

    // UI Actions
    function previousWeek() {
      if (currentWeek.value > 1) {
        currentWeek.value--;
      } else {
        currentWeek.value = 52;
        currentYear.value--;
      }
    }
    
    function nextWeek() {
      if (currentWeek.value < 52) {
        currentWeek.value++;
      } else {
        currentWeek.value = 1;
        currentYear.value++;
      }
    }
    
    function selectEmployee(employee) {
      selectedEmployee.value = employee;
    }
    
    function editShift(employee, date) {
      assigningEmployee.value = employee;
      assigningDate.value = date;
      selectedShift.value = getShift(employee.id, date) || '';
      showAssignShift.value = true;
    }
    
    function assignShift(employee, date) {
      assigningEmployee.value = employee;
      assigningDate.value = date;
      selectedShift.value = '';
      showAssignShift.value = true;
    }
    
    function assignRestDay() {
      selectedShift.value = 'rest';
    }
    
    function closeModals() {
      showAddEmployee.value = false;
      showAssignShift.value = false;
      editingEmployee.value = null;
      assigningEmployee.value = null;
      assigningDate.value = '';
      selectedShift.value = '';
      resetEmployeeForm();
    }
    
    function resetEmployeeForm() {
      Object.assign(employeeForm, {
        first_name: '',
        last_name: '',
        employee_id: '',
        position: '',
        department: '',
        shift_preference: 'any',
        email: '',
        phone: '',
        rest_days_per_week: 1,
        notes: '',
        status: 'active'
      });
    }

    // Employee CRUD
    function saveEmployee() {
      if (!employeeForm.first_name || !employeeForm.last_name || !employeeForm.employee_id) {
        showToast('Please fill required fields', 'error');
        return;
      }

      if (editingEmployee.value) {
        // Update existing employee
        const index = employees.value.findIndex(e => e.id === editingEmployee.value.id);
        if (index !== -1) {
          employees.value[index] = {
            ...employees.value[index],
            ...employeeForm
          };
          showToast('Employee updated successfully', 'success');
        }
      } else {
        // Add new employee
        const newEmployee = {
          id: Date.now(),
          ...employeeForm,
          created_at: new Date().toISOString().split('T')[0]
        };
        
        employees.value.push(newEmployee);
        showToast('Employee added successfully', 'success');
      }
      
      saveEmployees();
      closeModals();
    }
    
    function editEmployee(employee) {
      editingEmployee.value = employee;
      Object.assign(employeeForm, employee);
      showAddEmployee.value = true;
    }
    
    function deleteEmployee(employeeId) {
      if (confirm('Are you sure you want to delete this employee?')) {
        employees.value = employees.value.filter(e => e.id !== employeeId);
        
        // Remove from schedules
        delete schedules.value[employeeId];
        saveSchedules();
        
        if (selectedEmployee.value?.id === employeeId) {
          selectedEmployee.value = null;
        }
        
        saveEmployees();
        showToast('Employee deleted successfully', 'success');
      }
    }
    
    function saveShift() {
      if (!assigningEmployee.value || !assigningDate.value || !selectedShift.value) {
        showToast('Please select a shift', 'error');
        return;
      }
      
      const employeeId = assigningEmployee.value.id;
      
      if (!schedules.value[employeeId]) {
        schedules.value[employeeId] = {};
      }
      
      schedules.value[employeeId][assigningDate.value] = selectedShift.value;
      saveSchedules();
      
      showToast('Shift assigned successfully', 'success');
      closeModals();
    }
    
    function removeShift(employeeId, date) {
      if (confirm('Remove this shift assignment?')) {
        if (schedules.value[employeeId]) {
          delete schedules.value[employeeId][date];
          saveSchedules();
          showToast('Shift removed successfully', 'success');
        }
      }
    }

    // Schedule Generation Logic
    function generateSchedule() {
      if (employees.value.length === 0) {
        showToast('No employees found. Please add employees first.', 'error');
        return;
      }
      
      // Clear existing schedule for this week
      const weekDates = weekDays.value.map(day => day.date);
      Object.keys(schedules.value).forEach(empId => {
        weekDates.forEach(date => {
          if (schedules.value[empId]) {
            delete schedules.value[empId][date];
          }
        });
      });
      
      // Distribute rest days
      const employeesWithRotation = [...employees.value];
      
      // Separate day-only employees
      const dayOnlyEmployees = employeesWithRotation.filter(emp => emp.shift_preference === 'day');
      const otherEmployees = employeesWithRotation.filter(emp => emp.shift_preference !== 'day');
      
      // Shuffle arrays for randomness
      const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
      shuffleArray(dayOnlyEmployees);
      shuffleArray(otherEmployees);
      
      // Assign rest days with rotation
      weekDates.forEach((date, dateIndex) => {
        // Skip weekend assignment logic for simplicity
        const dayOfWeek = new Date(date).getDay();
        
        // Assign day shifts to day-only employees
        dayOnlyEmployees.forEach((emp, empIndex) => {
          if (!schedules.value[emp.id]) schedules.value[emp.id] = {};
          
          // Give 1-2 rest days per week based on their preference
          const restDaysPerWeek = emp.rest_days_per_week || 1;
          const shouldHaveRest = empIndex % (7 / restDaysPerWeek) === dateIndex % (7 / restDaysPerWeek);
          
          if (shouldHaveRest) {
            schedules.value[emp.id][date] = 'rest';
          } else {
            schedules.value[emp.id][date] = 'day';
          }
        });
        
        // Assign shifts to other employees (rotation between day and night)
        otherEmployees.forEach((emp, empIndex) => {
          if (!schedules.value[emp.id]) schedules.value[emp.id] = {};
          
          // Rest day rotation
          const restDaysPerWeek = emp.rest_days_per_week || 1;
          const isRestDayForThisEmployee = empIndex % (7 / restDaysPerWeek) === dateIndex % (7 / restDaysPerWeek);
          
          if (isRestDayForThisEmployee) {
            schedules.value[emp.id][date] = 'rest';
          } else {
            // Rotate between day and night shifts
            const shiftType = (empIndex + dateIndex) % 2 === 0 ? 'day' : 'night';
            
            // Respect shift preference
            if (emp.shift_preference === 'any' || emp.shift_preference === shiftType) {
              schedules.value[emp.id][date] = shiftType;
            } else {
              // If preference doesn't match, use opposite
              schedules.value[emp.id][date] = shiftType === 'day' ? 'night' : 'day';
            }
          }
        });
      });
      
      saveSchedules();
      showToast('Schedule generated successfully!', 'success');
    }
    
    function clearSchedule() {
      if (confirm('Clear all schedule assignments for this week?')) {
        const weekDates = weekDays.value.map(day => day.date);
        Object.keys(schedules.value).forEach(empId => {
          weekDates.forEach(date => {
            if (schedules.value[empId]) {
              delete schedules.value[empId][date];
            }
          });
        });
        saveSchedules();
        showToast('Schedule cleared successfully', 'success');
      }
    }
    
    function exportSchedule() {
      const exportData = {
        week: currentWeek.value,
        year: currentYear.value,
        dateRange: currentWeekDates.value,
        employees: employees.value.map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          position: emp.position,
          schedule: schedules.value[emp.id] || {}
        })),
        generatedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_week_${currentWeek.value}_${currentYear.value}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('Schedule exported successfully', 'success');
    }
    
    function loadSampleData() {
      const sampleEmployees = [
        {
          id: 1,
          first_name: 'Maria',
          last_name: 'Santos',
          employee_id: 'EMP-001',
          position: 'Cashier',
          department: 'Front Desk',
          shift_preference: 'day',
          rest_days_per_week: 2,
          status: 'active'
        },
        {
          id: 2,
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          employee_id: 'EMP-002',
          position: 'Manager',
          department: 'Management',
          shift_preference: 'any',
          rest_days_per_week: 1,
          status: 'active'
        },
        {
          id: 3,
          first_name: 'Ana',
          last_name: 'Reyes',
          employee_id: 'EMP-003',
          position: 'Inventory Clerk',
          department: 'Warehouse',
          shift_preference: 'any',
          rest_days_per_week: 1,
          status: 'active'
        },
        {
          id: 4,
          first_name: 'Pedro',
          last_name: 'Gonzales',
          employee_id: 'EMP-004',
          position: 'Night Guard',
          department: 'Security',
          shift_preference: 'night',
          rest_days_per_week: 2,
          status: 'active'
        },
        {
          id: 5,
          first_name: 'Sofia',
          last_name: 'Lim',
          employee_id: 'EMP-005',
          position: 'Cashier',
          department: 'Front Desk',
          shift_preference: 'day',
          rest_days_per_week: 1,
          status: 'active'
        }
      ];
      
      employees.value = sampleEmployees;
      saveEmployees();
      showToast('Sample data loaded successfully', 'success');
    }

    return {
      // State
      employees,
      selectedEmployee,
      currentWeek,
      currentYear,
      weekDays,
      showAddEmployee,
      showAssignShift,
      editingEmployee,
      assigningEmployee,
      assigningDate,
      selectedShift,
      employeeForm,
      toast,
      
      // Computed
      totalEmployees,
      scheduledEmployees,
      currentWeekDates,
      dayShiftCount,
      nightShiftCount,
      restDayCount,
      totalWorkDays,
      employeesWithHours,
      
      // Methods
      previousWeek,
      nextWeek,
      formatDateRange,
      getInitials,
      formatShiftPreference,
      getShiftPreferenceClass,
      getDayName,
      selectEmployee,
      editShift,
      assignShift,
      assignRestDay,
      closeModals,
      saveEmployee,
      editEmployee,
      deleteEmployee,
      saveShift,
      removeShift,
      generateSchedule,
      clearSchedule,
      exportSchedule,
      loadSampleData,
      
      // Schedule Helpers
      isRestDay,
      isDayShift,
      isNightShift,
      getShift,
      getDayShiftCount,
      getNightShiftCount,
      getRestDayCount
    };
  }
};
</script>

<style scoped>
/* Add this CSS to your existing styles or create a new Schedule.vue component */

.schedule-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

/* Header Styles */
.schedule-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 30px 20px 50px;
  position: relative;
  overflow: hidden;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 10px;
  background: linear-gradient(to right, #ffffff, #dbeafe);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 30px;
}

.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px 20px;
}

.nav-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.current-week {
  text-align: center;
}

.current-week h2 {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.current-week p {
  opacity: 0.9;
  font-size: 0.9rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.3s, background 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.15);
}

.stat-icon {
  font-size: 1.8rem;
  background: rgba(255, 255, 255, 0.2);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Main Content Layout */
.main-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 25px;
  max-width: 1400px;
  margin: -30px auto 0;
  padding: 0 20px 40px;
  position: relative;
  z-index: 2;
}

/* Sidebar Styles */
.sidebar {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: fit-content;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
}

.add-employee-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.add-employee-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.employee-list {
  max-height: 400px;
  overflow-y: auto;
  border-bottom: 1px solid #e2e8f0;
}

.employee-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.employee-item:hover {
  background: #f8fafc;
}

.employee-item.active {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
}

.employee-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.employee-avatar.small {
  width: 35px;
  height: 35px;
  font-size: 0.9rem;
}

.employee-info {
  flex: 1;
  min-width: 0;
}

.employee-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-details {
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.employee-details span.day-shift {
  color: #059669;
  font-weight: 600;
}

.employee-details span.night-shift {
  color: #7c3aed;
  font-weight: 600;
}

.employee-details span.any-shift {
  color: #3b82f6;
  font-weight: 600;
}

.employee-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s;
}

.employee-item:hover .employee-actions {
  opacity: 1;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.icon-btn.small {
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
}

.icon-btn.tiny {
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
}

.icon-btn:hover {
  transform: translateY(-2px);
}

.icon-btn.danger {
  background: #fee2e2;
  color: #dc2626;
}

.icon-btn.danger:hover {
  background: #dc2626;
  color: white;
}

.empty-employee-list {
  padding: 30px 20px;
  text-align: center;
  color: #64748b;
}

.add-first-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.add-first-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.schedule-controls {
  padding: 20px;
}

.schedule-controls h4 {
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 15px;
}

.primary-btn, .secondary-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  width: 100%;
  margin-bottom: 10px;
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.secondary-btn {
  background: #f1f5f9;
  color: #475569;
}

.secondary-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

/* Schedule Main Area */
.schedule-main {
  min-height: 800px;
}

.schedule-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.schedule-header-row {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 0.9rem;
}

.employee-header, .day-header {
  padding: 12px;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  color: #475569;
}

.day-header.weekend {
  background: #fef2f2;
  color: #dc2626;
}

.day-name {
  font-size: 1rem;
  font-weight: 700;
}

.day-date {
  font-size: 0.85rem;
  opacity: 0.8;
}

.schedule-row {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 10px;
  align-items: stretch;
}

.employee-cell {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
}

.employee-cell-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.employee-cell-info {
  flex: 1;
  min-width: 0;
}

.employee-cell-info strong {
  display: block;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 2px;
}

.employee-cell-info small {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
}

.day-cell {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  min-height: 80px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.day-cell:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.day-cell.weekend {
  background: #fef2f2;
  border-color: #fecaca;
}

.day-cell.rest-day {
  background: #f0f9ff;
  border-color: #a5f3fc;
}

.day-cell.day-shift {
  background: #d1fae5;
  border-color: #a7f3d0;
}

.day-cell.night-shift {
  background: #ede9fe;
  border-color: #ddd6fe;
}

.rest-day-indicator {
  color: #0891b2;
  font-weight: 600;
  font-size: 0.9rem;
}

.shift-indicator {
  font-size: 0.9rem;
  font-weight: 600;
}

.shift-indicator.day {
  color: #059669;
}

.shift-indicator.night {
  color: #7c3aed;
}

.shift-indicator small {
  display: block;
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.8;
}

.empty-shift {
  color: #94a3b8;
  font-size: 0.9rem;
  padding: 5px;
}

.shift-controls {
  position: absolute;
  top: 5px;
  right: 5px;
}

.summary-row {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e2e8f0;
}

.summary-cell {
  padding: 10px;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
}

.summary-cell.weekend {
  background: #fef2f2;
}

.summary-counts {
  display: flex;
  justify-content: space-around;
  margin-bottom: 5px;
}

.day-count, .night-count, .rest-count {
  font-size: 0.85rem;
  font-weight: 600;
}

.day-count { color: #059669; }
.night-count { color: #7c3aed; }
.rest-count { color: #0891b2; }

/* Schedule Statistics */
.schedule-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-card, .employee-summary {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-card h4, .employee-summary h4 {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
}

.stat-value {
  color: #1e293b;
  font-weight: 700;
  font-size: 1.1rem;
}

.employee-summary {
  max-height: 300px;
  overflow-y: auto;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.employee-hours {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.employee-hours.overtime {
  border-left-color: #dc2626;
  background: #fef2f2;
}

.employee-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
}

.hours-count {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b82f6;
}

.employee-hours.overtime .hours-count {
  color: #dc2626;
}

.hours-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
}

.hours-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.employee-hours.overtime .hours-fill {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #e2e8f0;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  color: #475569;
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.rest-days-selector {
  display: flex;
  gap: 10px;
}

.rest-day-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.rest-day-btn.active {
  border-color: #3b82f6;
  background: #f0f9ff;
  color: #3b82f6;
}

.shift-info {
  background: #f8fafc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.shift-info p {
  margin: 5px 0;
  color: #475569;
}

.shift-options {
  display: grid;
  gap: 10px;
}

.shift-option-btn {
  padding: 15px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.shift-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shift-option-btn.rest {
  border-color: #a5f3fc;
  background: #f0f9ff;
  color: #0891b2;
}

.shift-option-btn.rest.active {
  background: #a5f3fc;
  color: #164e63;
}

.shift-option-btn.day {
  border-color: #a7f3d0;
  background: #d1fae5;
  color: #065f46;
}

.shift-option-btn.day.active {
  background: #34d399;
  color: white;
}

.shift-option-btn.night {
  border-color: #ddd6fe;
  background: #ede9fe;
  color: #5b21b6;
}

.shift-option-btn.night.active {
  background: #8b5cf6;
  color: white;
}

.shift-option-btn small {
  display: block;
  font-weight: normal;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 5px;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 14px 20px;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: toastSlideIn 0.3s ease-out forwards;
  z-index: 1001;
  max-width: 400px;
}

.toast.success {
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.warning {
  border-left: 4px solid #f59e0b;
}

.toast.info {
  border-left: 4px solid #3b82f6;
}

.toast-icon {
  font-size: 1.1rem;
}

.toast-message {
  font-weight: 500;
  color: #1e293b;
}

/* Animations */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .schedule-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .schedule-header {
    padding: 20px 15px 40px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .week-navigation {
    flex-direction: column;
    gap: 15px;
  }
  
  .schedule-header-row,
  .schedule-row,
  .summary-row {
    grid-template-columns: 150px repeat(7, 120px);
    min-width: 1100px;
  }
  
  .employee-header,
  .employee-cell {
    min-width: 150px;
  }
  
  .schedule-container {
    overflow-x: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .schedule-header-row,
  .schedule-row,
  .summary-row {
    grid-template-columns: 120px repeat(7, 100px);
  }
  
  .employee-header,
  .employee-cell {
    min-width: 120px;
  }
  
  .modal {
    max-width: 95%;
  }
}
</style>