'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Save, X, User, Mail, Phone, Calendar, MapPin, Building2, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { backendApi } from '@/services/api';

export default function AddEmployeePage({ onSuccess, isModal = false, editingEmployee }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    userId: '',
    roleId: '',
    teamId: '',
    departmentId: '',
    designationId: '',
    customDesignation: '',
    reportingManagerId: '',
    organizationId: 1, // Default organization
    shiftId: '',
    attendanceAllowed: true,
    hiredAt: '',
    dateOfBirth: '',
    gender: '',
    status: 'ACTIVE',
    profileImage: null, // For image upload
    profileImageBase64: '', // For frontend display
    // Additional professional fields
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    workEmail: '',
    personalEmail: '',
    skills: '',
    experience: '',
    certifications: '',
    education: '',
    notes: '',
    leavePolicy: '',
    holidayPlan: '',
    baseSite: '',
    sitePool: '',
    attendanceRestriction: '',
    inOutNotification: '',
    workRestriction: '',
    defaultTransport: '',
    // Custom fields for "Other" options
    customTeam: '',
    customDepartment: ''
  });

  const [nextEmployeeId, setNextEmployeeId] = useState('');
  const [employeeIdError, setEmployeeIdError] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dropdown data in parallel with error handling
      const [rolesData, employeesData, teamsData, departmentsData, designationsData, nextIdData] = await Promise.allSettled([
        backendApi.get('/roles'),
        backendApi.get('/employees'),
        backendApi.get('/teams'),
        backendApi.get('/departments').catch(() => []), // Handle missing departments endpoint
        backendApi.get('/designations'),
        backendApi.get('/employees/next-employee-id')
      ]);

      setRoles(rolesData.status === 'fulfilled' ? rolesData.value : []);
      
      // Show all employees as potential reporting managers
      const managerEmployees = employeesData.status === 'fulfilled' ? employeesData.value || [] : [];
      setManagers(managerEmployees);
      
      setTeams(teamsData.status === 'fulfilled' ? teamsData.value : []);
      setDepartments(departmentsData.status === 'fulfilled' ? departmentsData.value : []);
      setDesignations(designationsData.status === 'fulfilled' ? designationsData.value : []);
      
      // Set next employee ID
      if (nextIdData.status === 'fulfilled') {
        setNextEmployeeId(nextIdData.value.nextEmployeeId || '');
      }
      
    } catch (err) {
      setError('Failed to load dropdown data');
      console.error('Error fetching dropdown data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const checkEmployeeId = async (employeeId) => {
    if (!employeeId.trim()) {
      setEmployeeIdError('');
      return;
    }
    
    try {
      const response = await fetch(`https://api.yashrajent.com/api/employees/check-employee-id/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB5YXNoZW50ZXJwcmlzZXMuY29tIiwiaWF0IjoxNzM1ODk2NzQ0LCJleHAiOjE3MzU5ODAzNDR9.test'}`
        }
      });
      
      const data = await response.json();
      if (data.exists) {
        setEmployeeIdError('Employee ID already exists');
      } else {
        setEmployeeIdError('');
      }
    } catch (error) {
      console.error('Error checking employee ID:', error);
    }
  };
  
  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, employeeId: value }));
    
    // Check if employee ID already exists
    if (value.trim()) {
      checkEmployeeId(value);
    } else {
      setEmployeeIdError('');
    }
  };
  
  const handleGenerateEmployeeId = async () => {
    try {
      const response = await fetch('https://api.yashrajent.com/api/employees/next-employee-id', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB5YXNoZW50ZXJwcmlzZXMuY29tIiwiaWF0IjoxNzM1ODk2NzQ0LCJleHAiOjE3MzU5ODAzNDR9.test'}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, employeeId: data.nextEmployeeId }));
        setEmployeeIdError('');
      }
    } catch (error) {
      console.error('Error generating employee ID:', error);
    }
  };

  // Populate form with editingEmployee data when available
  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        firstName: editingEmployee.firstName || '',
        lastName: editingEmployee.lastName || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        employeeId: editingEmployee.employeeId || '',
        employeeCode: editingEmployee.employeeCode || '',
        roleId: editingEmployee.roleId || '',
        reportingManagerId: editingEmployee.reportingManagerId || '',
        teamId: editingEmployee.teamId || '',
        departmentId: editingEmployee.departmentId || '',
        designationId: editingEmployee.designationId || '',
        status: editingEmployee.status || 'active',
        attendanceAllowed: editingEmployee.attendanceAllowed !== undefined ? editingEmployee.attendanceAllowed : true,
        hiredAt: editingEmployee.hiredAt || '',
        organizationId: editingEmployee.organizationId || 1,
        profileImage: null,
        profileImageBase64: '',
        // Additional professional fields
        dateOfBirth: editingEmployee.dateOfBirth || '',
        gender: editingEmployee.gender || '',
        bloodGroup: editingEmployee.bloodGroup || '',
        emergencyContact: editingEmployee.emergencyContact || '',
        emergencyPhone: editingEmployee.emergencyPhone || '',
        address: editingEmployee.address || '',
        city: editingEmployee.city || '',
        state: editingEmployee.state || '',
        pincode: editingEmployee.pincode || '',
        country: editingEmployee.country || '',
        workEmail: editingEmployee.workEmail || '',
        personalEmail: editingEmployee.personalEmail || '',
        skills: editingEmployee.skills || '',
        experience: editingEmployee.experience || '',
        certifications: editingEmployee.certifications || '',
        education: editingEmployee.education || '',
        notes: editingEmployee.notes || '',
        leavePolicy: editingEmployee.leavePolicy || '',
        holidayPlan: editingEmployee.holidayPlan || '',
        baseSite: editingEmployee.baseSite || '',
        sitePool: editingEmployee.sitePool || '',
        attendanceRestriction: editingEmployee.attendanceRestriction || '',
        inOutNotification: editingEmployee.inOutNotification || '',
        workRestriction: editingEmployee.workRestriction || '',
        defaultTransport: editingEmployee.defaultTransport || '',
        // Custom fields for "Other" options
        customTeam: editingEmployee.customTeam || '',
        customDesignation: editingEmployee.customDesignation || ''
      });
    }
  }, [editingEmployee]);

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === 1) {
      // Very permissive validation for testing
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      // Make email optional for testing
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
      if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) errors.phone = 'Invalid phone format';
      // Make role optional for testing
      // Make employeeId optional for testing
      // Make hire date optional for testing
    }
    
    if (currentStep === 2) {
      // Very permissive validation for testing
      // Temporarily make team optional for testing
      // if (!formData.teamId) errors.teamId = 'Team is required';
      // else if (formData.teamId === 'other' && !formData.customTeam.trim()) {
      //   errors.teamId = 'Please enter custom team name';
      // }
      
      // Temporarily make designation optional for testing
      // if (!formData.designationId) errors.designationId = 'Designation is required';
      // else if (formData.designationId === 'other' && !formData.customDesignation.trim()) {
      //   errors.designationId = 'Please enter custom designation';
      // }
      
      if (formData.emergencyPhone && !/^[0-9+\-\s()]+$/.test(formData.emergencyPhone)) {
        errors.emergencyPhone = 'Invalid emergency phone format';
      }
    }
    
    if (currentStep === 3) {
      // Very permissive validation for testing
      if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    const isValid = validateStep(step);
    
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.roleId) errors.roleId = 'Role is required';
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.hiredAt) errors.hiredAt = 'Hire date is required';
    
    // Email uniqueness check (basic validation)
    if (formData.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      errors.workEmail = 'Invalid work email format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setFormData(prev => ({
          ...prev,
          profileImageBase64: base64,
          profileImage: URL.createObjectURL(file)
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!formData.profileImage) {
      setError('Please select an image first');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Convert base64 back to file for upload
      const base64Data = formData.profileImageBase64;
      const byteString = atob(base64Data.split(',')[1]);
      const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
      const mime = mimeString.split(':')[1];
      
      const byteNumbers = new Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteNumbers[i] = byteString.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const file = new File([blob], 'employee-image.jpg', { type: mime });

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      const response = await backendApi.post(`/employees/${formData.employeeId}/upload-image`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response && response.imageUrl) {
        setFormData(prev => ({
          ...prev,
          profileImageUrl: response.imageUrl
        }));
        alert('Image uploaded successfully!');
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        employeeId: formData.employeeId,
        userId: formData.userId,
        roleId: formData.roleId ? parseInt(formData.roleId) : null,
        teamId: formData.teamId === 'other' ? null : (formData.teamId ? parseInt(formData.teamId) : null),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        designationId: formData.designationId === 'other' ? null : (formData.designationId ? parseInt(formData.designationId) : null),
        organizationId: formData.organizationId ? parseInt(formData.organizationId) : 1,
        hiredAt: formData.hiredAt ? new Date(formData.hiredAt).toISOString().split('T')[0] : null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : null,
        gender: formData.gender,
        status: formData.status ? formData.status.toUpperCase() : 'ACTIVE',
        attendanceAllowed: formData.attendanceAllowed,
        // Include custom values
        customTeam: formData.teamId === 'other' ? formData.customTeam : null,
        customDesignation: formData.designationId === 'other' ? formData.customDesignation : null,
        // Include profile image if available
        profileImageBase64: formData.profileImageBase64 || null
      };
      
      console.log('Sending payload:', payload);
      
      let response;
      if (editingEmployee) {
        // Update existing employee
        response = await backendApi.put(`/employees/${editingEmployee.id}`, payload);
        alert('Employee updated successfully!');
      } else {
        // Create new employee
        response = await backendApi.post('/employees', payload);
        alert('Employee created successfully!');
      }
      
      // Show success message
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/employees');
      }
      
    } catch (err) {
      setError(editingEmployee ? 'Failed to update employee' : 'Failed to create employee');
      console.error('Error saving employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onSuccess) {
      onSuccess();
    } else {
      router.push('/employees');
    }
  };

  if (loading) {
    if (isModal) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading form...</div>
        </div>
      );
    }
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading form...</div>
        </div>
      </DashboardLayout>
    );
  }

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        {!isModal && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < totalSteps && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Basic Information</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Organizational Details</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Additional Information</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-t-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={18} />
                    Basic Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image
                    </label>
                    <div className="space-y-3">
                      {formData.profileImage && (
                        <div className="flex items-center justify-center mb-4">
                          <img
                            src={formData.profileImage}
                            alt="Profile Preview"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, profileImage: null, profileImageBase64: '' }))}
                            className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                          >
                            Remove Image
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="profile-image-input"
                        />
                        <label
                          htmlFor="profile-image-input"
                          className="flex-1 cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
                        >
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
</svg>
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload or drag and drop your profile image
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Organizational Details */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={18} />
                    Organizational Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter employee ID"
                    />
                    {formErrors.employeeId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.employeeId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.roleId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.roleId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.roleId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Manager
                    </label>
                    <select
                      name="reportingManagerId"
                      value={formData.reportingManagerId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName} - {manager.roleName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team *
                    </label>
                    <select
                      name="teamId"
                      value={formData.teamId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.teamId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                      <option value="other">Other (Specify)</option>
                    </select>
                    {formErrors.teamId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.teamId}</p>
                    )}
                    
                    {/* Custom team input */}
                    {formData.teamId === 'other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="customTeam"
                          value={formData.customTeam}
                          onChange={handleChange}
                          placeholder="Enter custom team name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <select
                      name="designationId"
                      value={formData.designationId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.designationId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.name}
                        </option>
                      ))}
                      <option value="other">Other (Specify)</option>
                    </select>
                    {formErrors.designationId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.designationId}</p>
                    )}
                    
                    {/* Custom designation input */}
                    {formData.designationId === 'other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="customDesignation"
                          value={formData.customDesignation}
                          onChange={handleChange}
                          placeholder="Enter custom designation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hire Date *
                    </label>
                    <input
                      type="date"
                      name="hiredAt"
                      value={formData.hiredAt}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.hiredAt ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.hiredAt && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.hiredAt}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter emergency phone number"
                    />
                    {formErrors.emergencyPhone && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.emergencyPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      name="workEmail"
                      value={formData.workEmail}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.workEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter work email"
                    />
                    {formErrors.workEmail && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.workEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Email
                    </label>
                    <input
                      type="email"
                      name="personalEmail"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter personal email"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield size={18} />
                    Additional Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <textarea
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter skills (comma separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter experience details"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education
                    </label>
                    <textarea
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter education details"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications
                    </label>
                    <textarea
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter certifications"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={step === 1}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex gap-4">
                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="ml-2">Creating Employee...</span>
                      </div>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Create Employee</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <DashboardLayout>
      {formContent}
    </DashboardLayout>
  );
}
