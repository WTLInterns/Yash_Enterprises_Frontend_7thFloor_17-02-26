"use client";

import { useState, useEffect } from "react";
import { taskApi, taskEmployeesApi, taskCustomFieldsApi } from "@/services/taskApi";
import { Plus, Search, Filter, Calendar, Download, Edit2, Trash2, User, Clock, MapPin } from "lucide-react";
import { toast } from 'react-toastify';

// Safe date formatting function to prevent hydration issues
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // Use a consistent format that works on both server and client
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// Status color function for proper badge colors
const getStatusColor = (status) => {
  switch (status) {
    case "INQUIRY": return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS": return "bg-indigo-100 text-indigo-800";
    case "COMPLETED": return "bg-emerald-100 text-emerald-800";
    case "DELAYED": return "bg-rose-100 text-rose-800";
    case "CANCELLED": return "bg-slate-200 text-slate-800";
    default: return "bg-slate-100 text-slate-700";
  }
};

export default function TasksManagementContent() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // table or card
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange.start, dateRange.end]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tasksRes, employeesRes, fieldsRes] = await Promise.all([
        taskApi.list(),
        taskEmployeesApi.list({ 
          loggedInEmployeeId: 1, // Replace with actual user ID
          subadminId: 1, // Replace with actual subadmin ID
          roleName: "ADMIN" // Replace with actual user role
        }),
        taskCustomFieldsApi.list({ customTaskType: "Default Task" })
      ]);

      setTasks(tasksRes.data || []);
      setEmployees(employeesRes.data || []);
      setCustomFields(fieldsRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.assignedToEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesDate = (!dateRange.start || new Date(task.scheduledStartTime) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(task.scheduledStartTime) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort tasks by ID descending (latest first)
  const sortedFilteredTasks = [...filteredTasks].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedFilteredTasks.length / recordsPerPage);
  const paginatedTasks = sortedFilteredTasks.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const openCreateModal = () => {
    setEditingTask(null);
    setShowCreateModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
  };

  const handleDelete = async (taskId) => {
    try {
      await taskApi.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setDeleteTaskId(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks Management</h1>
            <p className="text-slate-600">Create and manage field tasks with dynamic custom fields</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Tasks</option>
                <option value="INQUIRY">Inquiry</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-4 flex justify-end gap-2">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "table" 
                ? "bg-indigo-600 text-white" 
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {viewMode === "table" ? "Card View" : "Table View"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
            <p className="mt-2 text-slate-600">Loading tasks...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {viewMode === "table" ? (
              /* Table View */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginatedTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" className="rounded border-slate-300" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{task.taskName || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{task.clientName || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 max-w-xs truncate">{task.address || task.customerAddress?.addressLine || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(task.scheduledStartTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(task.scheduledEndTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{task.assignedToEmployeeName || 'Unassigned'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(task)}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTaskId(task.id)}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">{task.taskName}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'DELAYED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(task.scheduledStartTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {task.assignedToEmployeeName || 'Unassigned'}
                      </div>
                      {task.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {task.address}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTaskId(task.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    currentPage === page ? "bg-indigo-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <TaskModal
            task={editingTask}
            employees={employees}
            customFields={customFields}
            onClose={closeModal}
            onSave={(savedTask) => {
              // ✅ Refresh tasks from server to show latest data
              loadInitialData();
              closeModal();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setDeleteTaskId(null)}
            />
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900">Delete Task?</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteTaskId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTaskId)}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({ task, employees, customFields, onClose, onSave }) {
  const [formData, setFormData] = useState({
    taskName: "",
    taskDescription: "",
    customTaskType: "Default Task",
    assignedToEmployeeId: "",
    startDate: "",
    endDate: "",
    scheduledStartTime: "",
    scheduledEndTime: "",
    repeatTask: false,
    status: "INQUIRY",
    clientId: "",
    customerAddressId: "",
    address: "",
    internalTaskId: "",
    customFields: {},
  });

  const [clients, setClients] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [modalCustomFields, setModalCustomFields] = useState(customFields || []);
  const [loading, setLoading] = useState(false);
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newField, setNewField] = useState({
    fieldLabel: "",
    fieldType: "TEXT",
    options: "",
    required: false,
  });

  useEffect(() => {
    // ✅ Initialize modalCustomFields from parent props
    setModalCustomFields(customFields || []);
  }, [customFields]);

  useEffect(() => {
    loadClients();
  }, []); // ✅ Only load clients once

  useEffect(() => {
    if (!formData.clientId) {
      setCustomerAddresses([]);
      setFormData(prev => ({ ...prev, customerAddressId: "" }));
      return;
    }

    fetchCustomerAddresses(formData.clientId);
  }, [formData.clientId]);

  useEffect(() => {
    if (!task) {
      // Create mode - initialize empty custom fields
      const emptyMap = {};
      modalCustomFields.forEach(field => {
        emptyMap[field.id] = "";
      });
      setFormData(prev => ({ ...prev, customFields: emptyMap }));
      return;
    }

    // Prefill Custom Field Values correctly
    const valuesMap = {};
    if (task.customFieldValues && Array.isArray(task.customFieldValues)) {
      task.customFieldValues.forEach((cf) => {
        // correct key based on backend: fieldId
        valuesMap[cf.fieldId] = cf.value ?? "";
      });
    }

    setFormData({
      taskName: task.taskName || "",
      taskDescription: task.taskDescription || "",
      customTaskType: task.customTaskType || "Default Task",

      assignedToEmployeeId: task.assignedToEmployeeId ? String(task.assignedToEmployeeId) : "",
      startDate: task.startDate || "",
      endDate: task.endDate || "",

      // convert backend datetime to input datetime-local format
      scheduledStartTime: task.scheduledStartTime ? task.scheduledStartTime.slice(0, 16) : "",
      scheduledEndTime: task.scheduledEndTime ? task.scheduledEndTime.slice(0, 16) : "",

      repeatTask: task.repeatTask ?? false,
      status: task.status || "INQUIRY",
      clientId: task.clientId ? String(task.clientId) : "",
      customerAddressId: task.customerAddressId ? String(task.customerAddressId) : "",
      address: task.address || "",
      internalTaskId: task.internalTaskId || "",

      // custom fields
      customFields: valuesMap,
    });

    // also fetch customfields for that tasktype
    fetchCustomFields(task.customTaskType || "Default Task");

  }, [task]); // ✅ Only depend on task, not modalCustomFields

  useEffect(() => {
    // ✅ Fetch custom fields when task type changes
    if (formData.customTaskType) {
      fetchCustomFields(formData.customTaskType);
    }
  }, [formData.customTaskType]); // ✅ Only depend on task type

  const loadClients = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.yashrajent.com';
      const response = await fetch(`${API_BASE_URL}/api/clients`);
      const data = await response.json();
      setClients(data || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  };

  const fetchCustomerAddresses = async (clientId) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.yashrajent.com';
      const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/addresses`);
      const data = await response.json();
      
      // Transform addresses to dropdown format
      const addressOptions = data.map(addr => ({
        id: addr.id,
        label: `${addr.addressType}: ${addr.addressLine}, ${addr.city || ''}`,
        isPrimary: addr.isPrimary
      }));
      
      // Sort: Primary address first, then others
      addressOptions.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
      
      setCustomerAddresses(addressOptions);
      
      // Auto-select primary address if available
      const primaryAddress = addressOptions.find(addr => addr.isPrimary);
      if (primaryAddress) {
        setFormData(prev => ({ ...prev, customerAddressId: primaryAddress.id }));
      }
    } catch (error) {
      console.error("Failed to fetch customer addresses:", error);
      setCustomerAddresses([]);
    }
  };

  const fetchCustomFields = async (taskType) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.yashrajent.com';
      const response = await fetch(`${API_BASE_URL}/api/task-custom-fields?customTaskType=${encodeURIComponent(taskType)}`);
      const data = await response.json();
      setModalCustomFields(data || []);
    } catch (error) {
      console.error("Failed to fetch custom fields:", error);
      setModalCustomFields([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // ✅ Custom fields fetch is now handled by useEffect - no need to call here
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

  const handleCreateCustomField = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.yashrajent.com";

      const payload = {
        customTaskType: formData.customTaskType,
        fieldLabel: newField.fieldLabel,
        fieldType: newField.fieldType,
        options: newField.fieldType === "DROPDOWN" ? newField.options : null,
        required: newField.required,
        active: true,
        sortOrder: (modalCustomFields?.length || 0) + 1,
        fieldKey: newField.fieldLabel.toLowerCase().replace(/\s+/g, "_"),
      };

      const res = await fetch(`${API_BASE_URL}/api/task-custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create custom field");

      setNewField({ fieldLabel: "", fieldType: "TEXT", options: "", required: false });
      setShowAddCustomField(false);

      // refresh list
      fetchCustomFields(formData.customTaskType);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create custom field");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.yashrajent.com';

      if (!formData.customerAddressId) {
        toast.error("Customer location is required. Please select a customer address with coordinates.");
        return;
      }
      
      // Debug: Log the customFields and payload
      console.log("Custom Fields available:", modalCustomFields);
      console.log("Form data custom fields:", formData.customFields);
      
      const payload = {
        id: task?.id,
        taskName: formData.taskName,
        taskDescription: formData.taskDescription,
        customTaskType: formData.customTaskType,
        assignedToEmployeeId: formData.assignedToEmployeeId ? Number(formData.assignedToEmployeeId) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        scheduledStartTime: formData.scheduledStartTime || null,
        scheduledEndTime: formData.scheduledEndTime || null,
        repeatTask: formData.repeatTask,
        status: formData.status,
        clientId: formData.clientId ? Number(formData.clientId) : null,
        customerAddressId: Number(formData.customerAddressId),
        address: formData.address,
        internalTaskId: formData.internalTaskId,

        // ✅ IMPORTANT: send LIST, not OBJECT with correct key name
        customFieldValues: modalCustomFields.map((field) => ({
          fieldId: field.id,
          value: formData.customFields?.[field.id] ?? ""
        }))
      };

      // Debug: Log the final payload
      console.log("Final payload:", JSON.stringify(payload, null, 2));

      const url = task 
        ? `${API_BASE_URL}/api/tasks/${task.id}` 
        : `${API_BASE_URL}/api/tasks`;
      const method = task ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task ? { ...payload, id: task.id } : payload)
      });

      if (response.ok) {
        const savedTask = await response.json();
        console.log("✅ Saved task response:", savedTask);
        toast.success(task ? "Task updated successfully" : "Task created successfully");
        onSave(savedTask);
      } else {
        throw new Error('Failed to save task');
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="taskName"
                value={formData.taskName}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter task name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                name="assignedToEmployeeId"
                value={formData.assignedToEmployeeId}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Task Description
            </label>
            <textarea
              name="taskDescription"
              value={formData.taskDescription}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter task description"
            />
          </div>

          {/* Task Type and Related Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom Task Type
              </label>
              <select
                name="customTaskType"
                value={formData.customTaskType}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Default Task">Default Task</option>
                <option value="Collect Payment">Collect Payment</option>
                <option value="Site Visit">Site Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Internal Task ID
              </label>
              <input
                name="internalTaskId"
                value={formData.internalTaskId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter internal task ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name || `Client ID: ${client.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Location <span className="text-red-500">*</span>
              </label>
              <select
                name="customerAddressId"
                value={formData.customerAddressId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedAddress = customerAddresses.find(a => String(a.id) === selectedId);

                  setFormData(prev => ({
                    ...prev,
                    customerAddressId: selectedId,
                    address: selectedAddress?.label || ""
                  }));
                }}
                required
                disabled={!formData.clientId}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                <option value="">{formData.clientId ? "Select customer location" : "Select a client first"}</option>
                {customerAddresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Task Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select Status</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Scheduling */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Scheduling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="scheduledStartTime"
                  value={formData.scheduledStartTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="scheduledEndTime"
                  value={formData.scheduledEndTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Repeat Task */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="repeatTask"
                checked={formData.repeatTask}
                onChange={handleInputChange}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Repeat Task
            </label>
          </div>

          {/* Dynamic Custom Fields */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Custom Fields</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomField((p) => !p)}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                + Add Custom Field
              </button>
            </div>

            {showAddCustomField && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Field Label</label>
                    <input
                      value={newField.fieldLabel}
                      onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="Eg. Amount"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Field Type</label>
                    <select
                      value={newField.fieldType}
                      onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="NUMBER">NUMBER</option>
                      <option value="DROPDOWN">DROPDOWN</option>
                    </select>
                  </div>

                  {newField.fieldType === "DROPDOWN" && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Options (comma separated)</label>
                      <input
                        value={newField.options}
                        onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="Cash, UPI, Card"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomField(false)}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomField}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                  >
                    Save Field
                  </button>
                </div>
              </div>
            )}

            {modalCustomFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modalCustomFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {field.fieldLabel}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.fieldType === 'TEXT' && (
                      <input
                        type="text"
                        value={formData.customFields[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={field.fieldLabel}
                      />
                    )}
                    {field.fieldType === 'NUMBER' && (
                      <input
                        type="number"
                        value={formData.customFields[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={field.fieldLabel}
                      />
                    )}
                    {field.fieldType === 'PHOTO' && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.files?.[0])}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    )}
                    {field.fieldType === 'DROPDOWN' && (
                      <select
                        value={formData.customFields[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select {field.fieldLabel}</option>
                        {field.options?.split(',').map(option => (
                          <option key={option.trim()} value={option.trim()}>
                            {option.trim()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-sm font-semibold text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : (task ? "Update Task" : "Create Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
