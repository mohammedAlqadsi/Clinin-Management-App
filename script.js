// ====================================================
// ثوابت وإعدادات النظام
// ====================================================

const INITIAL_PASSWORD = "1234";
const SECRET_MOBILE = "0501234567";

// ثابت نسبة تقسيم المختبر (30% للعيادة و 70% لصاحب المختبر)
const LAB_SPLIT_CLINIC_PERCENT = 0.30;

// ====================================================
// متغيرات تخزين البيانات (localStorage)
// ====================================================

let patients = [];
let nextPatientId = 1;

let labTests = [];
let nextLabId = 1;

let archivedDays = [];
let SERVICE_PRICES = {};

let monthlyExpenses = {};
let nextExpenseId = 1;

// ====================================================
// الدوال المساعدة للتحميل والحفظ والتخزين والتاريخ
// ====================================================

function getStoredPassword() {
    let password = localStorage.getItem('clinicPassword');
    if (!password) {
        password = INITIAL_PASSWORD;
        localStorage.setItem('clinicPassword', password);
    }
    return password;
}

function loadPatients() {
    const storedPatients = localStorage.getItem('clinicPatients');
    if (storedPatients) {
        patients = JSON.parse(storedPatients);
        if (patients.length > 0) {
            nextPatientId = Math.max(...patients.map(p => p.id)) + 1;
        }
    }
}

function savePatients() {
    localStorage.setItem('clinicPatients', JSON.stringify(patients));
}

function loadLabTests() {
    const storedTests = localStorage.getItem('clinicLabTests');
    if (storedTests) {
        labTests = JSON.parse(storedTests);
        if (labTests.length > 0) {
            nextLabId = Math.max(...labTests.map(t => t.id)) + 1;
        }
    } else {
        labTests = [
            { id: 1, name: "فحص سكر عشوائي", price: 20.00 },
            { id: 2, name: "صورة دم كاملة (CBC)", price: 85.00 }
        ];
        nextLabId = 3;
        saveLabTests();
    }
}

function saveLabTests() {
    localStorage.setItem('clinicLabTests', JSON.stringify(labTests));
}

function loadArchive() {
    const storedArchive = localStorage.getItem('clinicArchive');
    if (storedArchive) {
        archivedDays = JSON.parse(storedArchive);
    }
}

function saveArchive() {
    localStorage.setItem('clinicArchive', JSON.stringify(archivedDays));
}

function loadServicePrices() {
    const storedPrices = localStorage.getItem('clinicServicePrices');
    if (storedPrices) {
        SERVICE_PRICES = JSON.parse(storedPrices);
    } else {
        SERVICE_PRICES = {
            examination: { name: "المعاينة", price: 50.00 },
            nursing: { name: "التمريض", price: 30.00 },
        };
        saveServicePrices();
    }
}

function saveServicePrices() {
    localStorage.setItem('clinicServicePrices', JSON.stringify(SERVICE_PRICES));
}

function loadExpenses() {
    const storedMonthlyExpenses = localStorage.getItem('clinicMonthlyExpenses');
    if (storedMonthlyExpenses) {
        monthlyExpenses = JSON.parse(storedMonthlyExpenses);
    } else {
        monthlyExpenses = {};
    }
    nextExpenseId = 1;
    Object.values(monthlyExpenses).forEach(expenseList => {
        expenseList.forEach(e => {
            if (e.id >= nextExpenseId) {
                nextExpenseId = e.id + 1;
            }
        });
    });
}

function saveExpenses() {
    localStorage.setItem('clinicMonthlyExpenses', JSON.stringify(monthlyExpenses));
}


function getGregorianDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

// ====================================================
// التهيئة والمستمعات الرئيسية
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    getStoredPassword();
    loadLabTests();
    loadArchive();
    loadServicePrices();
    loadExpenses();
    setupLoginListener();
});

function setupLoginListener() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function setupSystemEventListeners() {
    document.getElementById('patient-form').addEventListener('submit', handlePatientRegistration);
    document.getElementById('service-form').addEventListener('submit', handleServiceAddition);
    document.getElementById('invoice-patient-select').addEventListener('change', displayInvoice);
    document.getElementById('password-change-form').addEventListener('submit', handleChangePassword);
    document.getElementById('lab-form').addEventListener('submit', handleLabFormSubmit);
    document.getElementById('price-edit-form').addEventListener('submit', handlePriceEditSubmit);

    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmission);

    const archiveSelect = document.getElementById('archive-day-select');
    if (archiveSelect) {
        archiveSelect.addEventListener('change', displayArchiveDayDetails);
    }
}

// ====================================================
// إدارة التنقل والعرض
// ====================================================

function showSection(sectionId) {
    document.querySelectorAll('#main-system section').forEach(section => {
        section.style.display = 'none';
    });
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.style.display = 'block';

        if (sectionId === 'patient-list') {
            renderPatientList();
        } else if (sectionId === 'billing') {
            populateInvoicePatients();
        } else if (sectionId === 'lab-management') {
            renderLabTestsTable();
        } else if (sectionId === 'archive-review') {
            renderArchiveReview();
        } else if (sectionId === 'expenses-management') {
            renderExpensesTable();
        } else if (sectionId === 'daily-report') {
            renderDailyReport();
        }
        if (sectionId === 'registration') {
            document.getElementById('patient-form').reset();
        }
    }
}

// ====================================================
// إدارة تسجيل الدخول وتغيير كلمة المرور
// ====================================================

function handleLogin(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('password').value;
    const errorMessage = document.getElementById('login-error');
    const storedPassword = getStoredPassword();

    if (passwordInput === storedPassword) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';

        loadPatients();
        setupSystemEventListeners();
        showSection('registration');
    } else {
        errorMessage.textContent = 'كلمة المرور غير صحيحة. حاول مرة أخرى.';
        errorMessage.style.display = 'block';
        document.getElementById('password').value = '';
    }
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        document.getElementById('main-system').style.display = 'none';
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('password').value = '';
        closeModal('password-modal');
    }
}

function handleChangePassword(event) {
    event.preventDefault();
    const oldPasswordInput = document.getElementById('old-password').value;
    const newPasswordInput = document.getElementById('new-password').value;
    const mobileRecoveryInput = document.getElementById('mobile-recovery').value;
    const changeError = document.getElementById('change-error');
    changeError.style.display = 'none';

    const storedPassword = getStoredPassword();

    let authorizedByOldPass = (oldPasswordInput && oldPasswordInput === storedPassword);
    let authorizedByMobile = (mobileRecoveryInput && mobileRecoveryInput === SECRET_MOBILE);

    if (!authorizedByOldPass && !authorizedByMobile) {
        changeError.textContent = 'كلمة المرور القديمة أو رقم الجوال السري غير صحيح.';
        changeError.style.display = 'block';
        return;
    }

    if (newPasswordInput.length < 4) {
        changeError.textContent = 'يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل.';
        changeError.style.display = 'block';
        return;
    }

    localStorage.setItem('clinicPassword', newPasswordInput);

    alert('تم تغيير كلمة المرور بنجاح! سيتم استخدامها في تسجيل الدخول التالي.');
    closeModal('password-modal');
    logout();
}

// ====================================================
// إدارة النوافذ المنبثقة (Modals) والقائمة المنسدلة
// ====================================================

function toggleDropdown() {
    document.getElementById("settings-menu").classList.toggle("show");
}

window.onclick = function (event) {
    if (!event.target.matches('.settings-btn, .settings-icon')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';

    if (modalId === 'add-expense-modal') {
        document.getElementById('expense-date').value = new Date().toISOString().substring(0, 10);
    }
}

function openServiceModal(patientId, patientName) {
    document.getElementById('modal-patient-id').value = patientId;
    document.getElementById('modal-patient-name').textContent = patientName;
    openModal('service-modal');
    document.getElementById('service-type').value = '';

    toggleServiceInputs();
}

function openPriceEditModal() {
    document.getElementById('examination-price').value = SERVICE_PRICES.examination.price;
    document.getElementById('nursing-price').value = SERVICE_PRICES.nursing.price;
    openModal('price-edit-modal');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

    if (modalId === 'service-modal') {
        document.getElementById('service-form').reset();
        toggleServiceInputs();
    } else if (modalId === 'password-modal') {
        document.getElementById('password-change-form').reset();
        document.getElementById('change-error').style.display = 'none';
    } else if (modalId === 'lab-edit-modal') {
        document.getElementById('lab-form').reset();
    } else if (modalId === 'price-edit-modal') {
        document.getElementById('price-edit-form').reset();
    } else if (modalId === 'add-expense-modal') {
        document.getElementById('expense-form').reset();
    }
}

// ====================================================
// إدارة أسعار الخدمات الثابتة (المعاينة والتمريض)
// ====================================================

function handlePriceEditSubmit(event) {
    event.preventDefault();
    const newExamPrice = parseFloat(document.getElementById('examination-price').value);
    const newNursingPrice = parseFloat(document.getElementById('nursing-price').value);

    if (isNaN(newExamPrice) || newExamPrice <= 0 || isNaN(newNursingPrice) || newNursingPrice <= 0) {
        alert('الرجاء إدخال أسعار صحيحة وموجبة.');
        return;
    }

    SERVICE_PRICES.examination.price = newExamPrice;
    SERVICE_PRICES.nursing.price = newNursingPrice;
    saveServicePrices();

    alert('تم تعديل أسعار الخدمات الثابتة بنجاح.');
    closeModal('price-edit-modal');
}

// ====================================================
// إدارة المرضى والخدمات المخصصة والفواتير والمختبر
// ====================================================

function handlePatientRegistration(event) {
    event.preventDefault();
    const name = document.getElementById('p-name').value;
    const age = document.getElementById('p-age').value;
    const contact = document.getElementById('p-contact').value;

    const newPatient = {
        id: nextPatientId++,
        name: name,
        age: age,
        contact: contact,
        services: []
    };

    patients.push(newPatient);
    savePatients();
    alert(`تم تسجيل المريض ${name} بنجاح! رقم المريض: ${newPatient.id}`);
    document.getElementById('patient-form').reset();
    showSection('patient-list');
}

function renderPatientList() {
    const tableBody = document.querySelector('#patients-table tbody');
    tableBody.innerHTML = '';

    patients.forEach(patient => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = patient.id;
        row.insertCell().textContent = patient.name;
        row.insertCell().textContent = patient.age;

        const actionsCell = row.insertCell();
        const addServiceBtn = document.createElement('button');
        addServiceBtn.textContent = 'إضافة خدمة';
        addServiceBtn.className = 'action-btn';
        addServiceBtn.onclick = () => openServiceModal(patient.id, patient.name);
        actionsCell.appendChild(addServiceBtn);

        const viewInvoiceBtn = document.createElement('button');
        viewInvoiceBtn.textContent = 'عرض الفاتورة';
        viewInvoiceBtn.className = 'action-btn';
        viewInvoiceBtn.onclick = () => {
            showSection('billing');
            document.getElementById('invoice-patient-select').value = patient.id;
            displayInvoice();
        };
        actionsCell.appendChild(viewInvoiceBtn);
    });
}

function toggleServiceInputs() {
    const serviceType = document.getElementById('service-type').value;

    const labInputs = document.getElementById('lab-inputs');
    const labSelect = document.getElementById('lab-test-select');

    const customInputs = document.getElementById('custom-inputs');
    const customNameInput = document.getElementById('custom-name');
    const customPriceInput = document.getElementById('custom-price');

    labInputs.style.display = 'none';
    if (labSelect) labSelect.required = false;

    customInputs.style.display = 'none';
    if (customNameInput) customNameInput.required = false;
    if (customPriceInput) customPriceInput.required = false;


    if (serviceType === 'laboratory') {
        labInputs.style.display = 'block';
        if (labSelect) labSelect.required = true;

        if (labSelect) {
            labSelect.innerHTML = '<option value="">اختر نوع الفحص</option>';
            labTests.forEach(test => {
                const option = document.createElement('option');
                option.value = `${test.id}|${test.name}|${test.price}`;
                option.textContent = `${test.name} (${test.price.toFixed(2)} ريال)`;
                labSelect.appendChild(option);
            });
        }

    } else if (serviceType === 'other') {
        customInputs.style.display = 'block';
        if (customNameInput) customNameInput.required = true;
        if (customPriceInput) customPriceInput.required = true;
    }
}


function handleServiceAddition(event) {
    event.preventDefault();
    const patientId = parseInt(document.getElementById('modal-patient-id').value);
    const serviceType = document.getElementById('service-type').value;
    const serviceNotes = document.getElementById('service-notes').value;

    let serviceName, servicePrice;

    if (serviceType === 'laboratory') {
        const labValue = document.getElementById('lab-test-select').value;
        if (!labValue) {
            alert('الرجاء اختيار فحص مختبر.');
            return;
        }

        const [labId, name, price] = labValue.split('|');
        serviceName = name;
        servicePrice = parseFloat(price);

    } else if (serviceType === 'other') {
        serviceName = document.getElementById('custom-name').value;
        servicePrice = parseFloat(document.getElementById('custom-price').value);

        if (serviceName.trim() === "" || isNaN(servicePrice) || servicePrice <= 0) {
            alert('الرجاء إدخال اسم وسعر صحيحين للخدمة الجديدة.');
            return;
        }

    } else if (SERVICE_PRICES[serviceType]) {
        serviceName = SERVICE_PRICES[serviceType].name;
        servicePrice = SERVICE_PRICES[serviceType].price;
    } else {
        alert('الرجاء اختيار نوع خدمة صالح.');
        return;
    }

    const patient = patients.find(p => p.id === patientId);

    if (patient) {
        const newService = {
            date: getGregorianDateString(new Date()),
            time: new Date().toLocaleTimeString('ar-YE'),
            department: serviceName,
            price: servicePrice,
            notes: serviceNotes
        };

        patient.services.push(newService);
        savePatients();
        alert(`تمت إضافة خدمة ${serviceName} للمريض ${patient.name}.`);
        closeModal('service-modal');
    }
}

function renderLabTestsTable() {
    const tableBody = document.querySelector('#lab-tests-table tbody');
    tableBody.innerHTML = '';

    labTests.forEach(test => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = test.name;
        row.insertCell().textContent = test.price.toFixed(2);

        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'edit-btn';
        editBtn.onclick = () => openLabModal('edit', test.id);
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteLabTest(test.id);
        actionsCell.appendChild(deleteBtn);
    });
}

function openLabModal(mode, testId = null) {
    const title = document.getElementById('lab-modal-title');
    const labIdInput = document.getElementById('lab-id');
    const labNameInput = document.getElementById('modal-lab-name');
    const labPriceInput = document.getElementById('modal-lab-price');

    document.getElementById('lab-form').reset();

    if (mode === 'add') {
        title.textContent = 'إضافة فحص مختبر جديد';
        labIdInput.value = '';
    } else if (mode === 'edit') {
        const test = labTests.find(t => t.id === testId);
        if (test) {
            title.textContent = `تعديل فحص: ${test.name}`;
            labIdInput.value = test.id;
            labNameInput.value = test.name;
            labPriceInput.value = test.price;
        }
    }
    openModal('lab-edit-modal');
}

function handleLabFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('lab-id').value;
    const name = document.getElementById('modal-lab-name').value;
    const price = parseFloat(document.getElementById('modal-lab-price').value);

    if (isNaN(price) || price <= 0) {
        alert('الرجاء إدخال سعر صحيح وموجب.');
        return;
    }

    if (id) {
        const testIndex = labTests.findIndex(t => t.id === parseInt(id));
        if (testIndex !== -1) {
            labTests[testIndex].name = name;
            labTests[testIndex].price = price;
            alert('تم تعديل الفحص بنجاح!');
        }
    } else {
        const newTest = {
            id: nextLabId++,
            name: name,
            price: price
        };
        labTests.push(newTest);
        alert('تم إضافة الفحص بنجاح!');
    }

    saveLabTests();
    renderLabTestsTable();
    closeModal('lab-edit-modal');
}

function deleteLabTest(testId) {
    if (confirm('هل أنت متأكد من حذف هذا الفحص؟')) {
        labTests = labTests.filter(t => t.id !== testId);
        saveLabTests();
        renderLabTestsTable();
        alert('تم حذف الفحص بنجاح.');
    }
}

function populateInvoicePatients() {
    const select = document.getElementById('invoice-patient-select');
    const currentPatientId = select.value;
    select.innerHTML = '<option value="">اختر المريض</option>';

    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.id} - ${patient.name}`;
        select.appendChild(option);
    });

    if (patients.some(p => p.id == currentPatientId)) {
        select.value = currentPatientId;
    }

    displayInvoice();
}

function displayInvoice() {
    const patientId = parseInt(document.getElementById('invoice-patient-select').value);
    const detailsDiv = document.getElementById('invoice-details');
    detailsDiv.innerHTML = '';

    if (!patientId) {
        detailsDiv.innerHTML = '<p>الرجاء اختيار مريض لعرض فاتورته.</p>';
        return;
    }

    const patient = patients.find(p => p.id === patientId);
    if (!patient || patient.services.length === 0) {
        detailsDiv.innerHTML = `
            <h3>فاتورة المريض: ${patient.name}</h3>
            <p><strong>رقم الملف:</strong> ${patient.id}</p>
            <p style="color: green; font-weight: bold;">لا توجد خدمات مسجلة/مستحقة على المريض. الرصيد: صفر.</p>
        `;
        return;
    }

    let totalCost = 0;

    let invoiceHTML = `
        <h3>فاتورة المريض: ${patient.name}</h3>
        <p><strong>رقم الملف:</strong> ${patient.id}</p>
        <p><strong>العمر:</strong> ${patient.age}</p>
        <p><strong>تاريخ الفاتورة:</strong> ${getGregorianDateString(new Date())}</p> 
        
        <table>
            <thead>
                <tr>
                    <th>القسم/الخدمة</th>
                    <th>التاريخ والوقت</th>
                    <th>الملاحظات</th>
                    <th>السعر (ريال)</th>
                </tr>
            </thead>
            <tbody>
    `;

    patient.services.forEach(service => {
        invoiceHTML += `
            <tr>
                <td>${service.department}</td>
                <td>${service.date} ${service.time}</td>
                <td>${service.notes || '-'}</td>
                <td>${service.price.toFixed(2)}</td>
            </tr>
        `;
        totalCost += service.price;
    });

    invoiceHTML += `
            </tbody>
        </table>
        <hr>
        <div style="text-align: left; padding: 10px; font-size: 1.2em;">
            <strong>المجموع الكلي المستحق:</strong> <span style="color: red;">${totalCost.toFixed(2)} ريال</span>
        </div>
        
        <button class="print-btn" onclick="printInvoice()">طباعة الفاتورة</button>
        <button class="action-btn" style="background-color: #4CAF50; color: white;" onclick="recordPayment(${patientId}, '${patient.name}')">
            تسجيل السداد وحفظ الفاتورة
        </button>
    `;

    detailsDiv.innerHTML = invoiceHTML;
}

function recordPayment(patientId, patientName) {
    if (!confirm(`هل أنت متأكد من تسجيل سداد الفاتورة للمريض ${patientName}؟ سيتم تصفير الخدمات المسجلة.`)) {
        return;
    }

    const patient = patients.find(p => p.id === patientId);

    if (patient) {
        // يتم تصفير الخدمات بعد السداد
        patient.services = [];
        savePatients();

        alert(`تم تسجيل سداد المريض ${patientName} بنجاح. رصيده الآن صفر.`);

        displayInvoice();
        showSection('patient-list');
    } else {
        alert('حدث خطأ: لم يتم العثور على المريض.');
    }
}

function printInvoice() {
    window.print();
}

// ====================================================
// إدارة الأرشيف والمراجعة الشهرية
// ====================================================

function archiveAndClearPatients() {
    // 1. فحص وجود بيانات وتأكيد الأرشفة
    if (patients.length === 0) {
        alert('لا توجد بيانات مرضى لحفظها وأرشفتها اليوم.');
        return;
    }

    if (!confirm('هل أنت متأكد من أرشفة بيانات مرضى اليوم وحذفهم؟ سيتم تصفير قائمة المرضى الحالية لبدء يوم جديد.')) {
        return;
    }

    // 2. حساب تفاصيل التقرير اليومي بالكامل
    let totalGeneralRevenue = 0;
    let totalLabRevenue = 0;
    const labTestNames = labTests.map(test => test.name);
    const today = new Date().toISOString().substring(0, 10); // تنسيق YYYY-MM-DD

    patients.forEach(patient => {
        patient.services.forEach(service => {
            const price = service.price;
            if (labTestNames.includes(service.department)) {
                // فحوصات المختبر
                totalLabRevenue += price;
            } else {
                // خدمات عامة (معاينة، تمريض، خدمات أخرى)
                totalGeneralRevenue += price;
            }
        });
    });

    // حساب التقسيم
    const clinicShare = totalLabRevenue * LAB_SPLIT_CLINIC_PERCENT;
    const labOwnerShare = totalLabRevenue - clinicShare;

    // حساب المصروفات اليومية - **مؤكد: تصفية لتاريخ اليوم فقط**
    let totalExpense = 0;
    Object.values(monthlyExpenses).forEach(expenseList => {
        expenseList.filter(e => e.date === today)
            .forEach(e => {
                totalExpense += e.amount;
            });
    });

    const netProfitCalculation = totalGeneralRevenue + clinicShare - totalExpense;

    // 3. إنشاء سجل الأرشيف الشامل (يتضمن الملخص المالي)
    const archiveDay = {
        date: getGregorianDateString(new Date()),
        patientCount: patients.length,
        patientsData: patients, // بيانات المرضى الأصلية

        // الملخص المالي (التقرير المؤرشف)
        summary: {
            totalRevenue: totalGeneralRevenue + totalLabRevenue,
            generalRevenue: totalGeneralRevenue,
            labRevenue: totalLabRevenue,
            clinicShare: clinicShare,
            labOwnerShare: labOwnerShare,
            totalExpense: totalExpense, // المصروفات التي حدثت اليوم فقط
            netProfit: netProfitCalculation,
        }
    };

    // 4. حفظ الأرشيف وتصفير بيانات اليوم الجديد
    archivedDays.push(archiveDay);
    saveArchive();

    patients = [];
    nextPatientId = 1;
    savePatients();

    alert(`✅ تمت أرشفة اليوم بنجاح.\nإجمالي الإيرادات: ${(archiveDay.summary.totalRevenue).toFixed(2)} ريال.\nصافي الربح المُحتسب: ${archiveDay.summary.netProfit.toFixed(2)} ريال.`);

    showSection('registration');
}

function renderArchiveReview() {
    loadArchive();
    const daySelect = document.getElementById('archive-day-select');

    daySelect.innerHTML = '<option value="">اختر يوم للمراجعة</option>';

    let totalPatientsArchived = 0;
    let totalRevenueArchived = 0;

    archivedDays.forEach((day, index) => {
        const totalDayRevenue = day.summary ? day.summary.totalRevenue : day.revenue;

        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${day.date} - (${day.patientCount} مريض - ${totalDayRevenue.toFixed(2)} ريال)`;
        daySelect.appendChild(option);

        totalPatientsArchived += day.patientCount;
        totalRevenueArchived += totalDayRevenue;
    });

    document.getElementById('archive-total-days').textContent = `عدد الأيام المؤرشفة: ${archivedDays.length}`;
    document.getElementById('archive-total-patients').textContent = `إجمالي عدد المرضى المؤرشفين: ${totalPatientsArchived}`;
    document.getElementById('archive-total-revenue').textContent = `إجمالي الإيرادات المؤرشفة: ${totalRevenueArchived.toFixed(2)} ريال`;

    document.getElementById('archive-details-display').innerHTML = '';
}

function displayArchiveDayDetails() {
    const dayIndex = document.getElementById('archive-day-select').value;
    const detailsDiv = document.getElementById('archive-details-display');
    detailsDiv.innerHTML = '';

    if (dayIndex === "" || isNaN(dayIndex) || !archivedDays[dayIndex]) {
        return;
    }

    const dayData = archivedDays[dayIndex];
    const summary = dayData.summary || {
        generalRevenue: 'غير متوفر',
        labRevenue: 'غير متوفر',
        clinicShare: 'غير متوفر',
        labOwnerShare: 'غير متوفر',
        totalExpense: 'غير متوفر',
        netProfit: 'غير متوفر',
        totalRevenue: dayData.revenue || 'غير متوفر'
    };

    let detailsHTML = `
        <h4>تقرير وملخص يوم ${dayData.date} المالي</h4>
        <div style="border: 2px solid #007bff; padding: 15px; margin-bottom: 20px;">
            <p><strong>الإيرادات الكلية:</strong> <span style="font-weight: bold;">${summary.totalRevenue.toFixed(2)} ريال</span></p>
            <p><strong>عدد المرضى المسجلين:</strong> ${dayData.patientCount}</p>
            <hr>
            <h5>ملخص الإيرادات والربح:</h5>
            <ul>
                <li><strong>إيرادات الخدمات العامة:</strong> ${summary.generalRevenue.toFixed(2)} ريال</li>
                <li><strong>إيرادات المختبر (الفحوصات):</strong> ${summary.labRevenue.toFixed(2)} ريال</li>
                <li><strong>حصة العيادة من المختبر (${LAB_SPLIT_CLINIC_PERCENT * 100}%):</strong> <span style="color: blue;">${summary.clinicShare.toFixed(2)} ريال</span></li>
                <li><strong>حصة صاحب المختبر:</strong> ${summary.labOwnerShare.toFixed(2)} ريال</li>
                <li><strong>إجمالي المصروفات (لليوم):</strong> <span style="color: red;">${summary.totalExpense.toFixed(2)} ريال</span></li>
            </ul>
            <h5 style="margin-top: 10px;">صافي ربح العيادة: <span style="font-weight: bold; color: ${summary.netProfit >= 0 ? 'green' : 'red'};">${summary.netProfit.toFixed(2)} ريال</span></h5>
        </div>
        
        <h4>تفاصيل خدمات المرضى:</h4>
    `;

    dayData.patientsData.forEach(patient => {
        let patientRevenue = patient.services.reduce((sum, s) => sum + s.price, 0);

        detailsHTML += `
            <div style="border: 1px dashed #ccc; padding: 10px; margin-bottom: 10px;">
                <p style="font-weight: bold; background-color: #f0f8ff; padding: 5px;">[${patient.id}] ${patient.name} (${patient.age} سنة) - (مجموع خدماته: ${patientRevenue.toFixed(2)} ريال)</p>
                <table>
                    <thead>
                        <tr>
                            <th>الخدمة</th>
                            <th>السعر</th>
                            <th>الملاحظات</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        patient.services.forEach(service => {
            detailsHTML += `
                <tr>
                    <td>${service.department}</td>
                    <td>${service.price.toFixed(2)}</td>
                    <td>${service.notes || '-'}</td>
                    <td>${service.date} ${service.time || ''}</td>
                </tr>
            `;
        });
        detailsHTML += `
                    </tbody>
                </table>
            </div>
        `;
    });

    detailsDiv.innerHTML = detailsHTML;
}

function clearAllArchiveData() {
    if (archivedDays.length === 0) {
        alert('الأرشيف فارغ بالفعل.');
        return;
    }

    if (!confirm('تحذير! هل أنت متأكد من حذف كل بيانات الأرشيف نهائيًا؟ هذه العملية لا يمكن التراجع عنها.')) {
        return;
    }

    archivedDays = [];
    saveArchive();
    alert('تم حذف كل بيانات الأرشيف بنجاح.');
    renderArchiveReview();
}

// ====================================================
// إدارة المصروفات المجمعة (Expenses)
// ====================================================

function renderExpensesTable() {
    loadExpenses();
    const tableBody = document.querySelector('#expenses-table tbody');
    tableBody.innerHTML = '';

    const totalExpensesDisplay = document.getElementById('total-expenses');
    document.getElementById('expenses-details-display').innerHTML = '';

    let grandTotal = 0;

    const recipients = Object.keys(monthlyExpenses);

    recipients.forEach(recipientName => {
        const expensesList = monthlyExpenses[recipientName];
        const recipientTotal = expensesList.reduce((sum, e) => sum + e.amount, 0);
        grandTotal += recipientTotal;

        const row = tableBody.insertRow();

        const nameCell = row.insertCell();
        nameCell.innerHTML = `<a href="#" onclick="displayRecipientDetails('${recipientName.replace(/'/g, "\\'")}')">${recipientName}</a>`;
        nameCell.style.fontWeight = 'bold';

        row.insertCell().textContent = recipientTotal.toFixed(2);
        row.insertCell().textContent = expensesList.length;

        const actionsCell = row.insertCell();
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف الكل';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteRecipientExpenses(recipientName);
        actionsCell.appendChild(deleteBtn);
    });

    totalExpensesDisplay.textContent = `${grandTotal.toFixed(2)} ريال`;
}


function handleExpenseSubmission(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('expense-amount').value);
    const recipient = document.getElementById('expense-recipient').value.trim();
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value;

    if (isNaN(amount) || amount <= 0) {
        alert('الرجاء إدخال مبلغ صحيح وموجب للمصروف.');
        return;
    }

    if (!recipient) {
        alert('الرجاء إدخال اسم مستلم المبلغ.');
        return;
    }

    const newExpense = {
        id: nextExpenseId++,
        amount: amount,
        date: date, // يتم تخزين التاريخ بتنسيق YYYY-MM-DD
        notes: notes || 'لا توجد ملاحظات'
    };

    if (!monthlyExpenses[recipient]) {
        monthlyExpenses[recipient] = [];
    }
    monthlyExpenses[recipient].push(newExpense);

    saveExpenses();
    alert(`تم تسجيل مصروف بمبلغ ${amount.toFixed(2)} ريال للمستلم ${recipient} بتاريخ ${date}.`);

    closeModal('add-expense-modal');
    renderExpensesTable();
}

function deleteRecipientExpenses(recipientName) {
    if (confirm(`تحذير! هل أنت متأكد من حذف جميع المصروفات (${monthlyExpenses[recipientName].length} سحب) للمستلم ${recipientName}؟ هذه العملية لا يمكن التراجع عنها.`)) {
        delete monthlyExpenses[recipientName];
        saveExpenses();
        renderExpensesTable();
        alert(`تم حذف جميع مصروفات ${recipientName} بنجاح.`);
    }
}

function deleteSingleExpense(recipientName, expenseId) {
    const list = monthlyExpenses[recipientName];
    if (list) {
        monthlyExpenses[recipientName] = list.filter(e => e.id !== expenseId);

        if (monthlyExpenses[recipientName].length === 0) {
            delete monthlyExpenses[recipientName];
        }

        saveExpenses();
        if (monthlyExpenses[recipientName]) {
            displayRecipientDetails(recipientName);
        } else {
            renderExpensesTable();
        }
        alert('تم حذف المصروف بنجاح.');
    }
}

function displayRecipientDetails(recipientName) {
    const detailsDiv = document.getElementById('expenses-details-display');
    detailsDiv.innerHTML = '';

    const expensesList = monthlyExpenses[recipientName];
    if (!expensesList || expensesList.length === 0) {
        detailsDiv.innerHTML = `<p>لا توجد مصروفات مسجلة لـ ${recipientName}.</p>`;
        return;
    }

    const total = expensesList.reduce((sum, e) => sum + e.amount, 0);

    let html = `
        <h4 style="margin-top: 20px;">تفاصيل المصروفات لـ: ${recipientName}</h4>
        <p style="font-weight: bold;">الإجمالي المستحق على هذا المستلم: <span style="color: red;">${total.toFixed(2)} ريال</span></p>
        <button onclick="renderExpensesTable()" class="action-btn">العودة للجدول الرئيسي</button>
        <table style="margin-top: 10px;">
            <thead>
                <tr>
                    <th>المبلغ (ريال)</th>
                    <th>تاريخ السحب</th>
                    <th>ملاحظات</th>
                    <th>حذف</th>
                </tr>
            </thead>
            <tbody>
    `;

    expensesList.forEach(expense => {
        html += `
            <tr>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.date}</td>
                <td>${expense.notes}</td>
                <td><button class="delete-btn" onclick="deleteSingleExpense('${recipientName.replace(/'/g, "\\'")}', ${expense.id})">حذف</button></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    detailsDiv.innerHTML = html;
}

// ====================================================
// التقرير اليومي (Daily Report) - **مؤكد: تصفية المصروفات**
// ====================================================

function renderDailyReport() {
    // 1. إعداد المتغيرات والجداول
    document.getElementById('report-date').textContent = getGregorianDateString(new Date());

    const revenueTableBody = document.querySelector('#revenue-summary-table tbody');
    const labRevenueTableBody = document.querySelector('#lab-revenue-summary-table tbody');
    const expenseTableBody = document.querySelector('#expense-summary-table tbody');

    revenueTableBody.innerHTML = '';
    labRevenueTableBody.innerHTML = '';
    expenseTableBody.innerHTML = '';

    // 2. تحليل الإيرادات
    let totalGeneralRevenue = 0;
    let totalLabRevenue = 0;

    let generalServiceSummary = {};
    let labServiceSummary = {};

    let patientCount = patients.length;

    // إنشاء قائمة بأسماء الفحوصات المعرفة في نظام المختبر
    const labTestNames = labTests.map(test => test.name);

    patients.forEach(patient => {
        patient.services.forEach(service => {
            const serviceName = service.department;
            const price = service.price;

            if (labTestNames.includes(serviceName)) {
                // فحوصات المختبر
                if (!labServiceSummary[serviceName]) {
                    labServiceSummary[serviceName] = { count: 0, total: 0 };
                }
                labServiceSummary[serviceName].count++;
                labServiceSummary[serviceName].total += price;
                totalLabRevenue += price;
            } else {
                // جميع الخدمات الأخرى
                if (!generalServiceSummary[serviceName]) {
                    generalServiceSummary[serviceName] = { count: 0, total: 0 };
                }
                generalServiceSummary[serviceName].count++;
                generalServiceSummary[serviceName].total += price;
                totalGeneralRevenue += price;
            }
        });
    });

    // 2.1. عرض ملخص الخدمات العامة (معاينة، تمريض، وغيرها)
    Object.keys(generalServiceSummary).forEach(serviceName => {
        const summary = generalServiceSummary[serviceName];
        const row = revenueTableBody.insertRow();
        row.insertCell().textContent = serviceName;
        row.insertCell().textContent = summary.count;
        row.insertCell().textContent = summary.total.toFixed(2);

        let fixedPrice = '';
        if (serviceName === SERVICE_PRICES.examination.name) {
            fixedPrice = SERVICE_PRICES.examination.price.toFixed(2);
        } else if (serviceName === SERVICE_PRICES.nursing.name) {
            fixedPrice = SERVICE_PRICES.nursing.price.toFixed(2);
        } else {
            fixedPrice = 'مُدخل يدوياً';
        }
        row.insertCell().textContent = fixedPrice;
    });

    document.getElementById('total-daily-revenue').textContent = `${totalGeneralRevenue.toFixed(2)} ريال`;
    document.getElementById('report-patient-count').textContent = patientCount;

    // 2.2. عرض ملخص إيرادات المختبر والفحوصات
    Object.keys(labServiceSummary).forEach(serviceName => {
        const summary = labServiceSummary[serviceName];
        const row = labRevenueTableBody.insertRow();
        row.insertCell().textContent = serviceName;
        row.insertCell().textContent = summary.count;
        row.insertCell().textContent = summary.total.toFixed(2);
    });

    document.getElementById('total-daily-lab-revenue').textContent = `${totalLabRevenue.toFixed(2)} ريال`;

    // 2.3. حساب وتقسيم إيرادات المختبر
    const clinicShare = totalLabRevenue * LAB_SPLIT_CLINIC_PERCENT;
    const labOwnerShare = totalLabRevenue - clinicShare;

    document.getElementById('lab-revenue-for-split').textContent = `${totalLabRevenue.toFixed(2)} ريال`;
    document.getElementById('clinic-share').textContent = `${clinicShare.toFixed(2)} ريال`;
    document.getElementById('lab-owner-share').textContent = `${labOwnerShare.toFixed(2)} ريال`;


    // 3. تحليل المصروفات - **الخصم لليوم الحالي فقط**
    let totalExpense = 0;
    const today = new Date().toISOString().substring(0, 10); // تاريخ اليوم بتنسيق YYYY-MM-DD

    Object.keys(monthlyExpenses).forEach(recipientName => {
        // تصفية المصروفات لتاريخ اليوم فقط
        const dailyExpenses = monthlyExpenses[recipientName].filter(e => e.date === today);

        if (dailyExpenses.length > 0) {
            const recipientTotal = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
            totalExpense += recipientTotal;

            const row = expenseTableBody.insertRow();
            row.insertCell().textContent = recipientName;
            row.insertCell().textContent = dailyExpenses.length;
            row.insertCell().textContent = recipientTotal.toFixed(2);
        }
    });

    document.getElementById('total-daily-expense').textContent = `${totalExpense.toFixed(2)} ريال`;


    // 4. حساب صافي الربح
    // صافي الربح = (إيرادات الخدمات العامة + حصة العيادة من المختبر) - المصروفات اليومية
    const netProfitCalculation = totalGeneralRevenue + clinicShare - totalExpense;

    const netProfitElement = document.getElementById('report-net-profit');
    netProfitElement.textContent = `${netProfitCalculation.toFixed(2)} ريال`;

    // تنسيق صافي الربح
    if (netProfitCalculation > 0) {
        netProfitElement.style.color = 'green';
    } else if (netProfitCalculation < 0) {
        netProfitElement.style.color = 'red';
    } else {
        netProfitElement.style.color = 'black';
    }
}