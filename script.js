// ==================== DATA ====================
let jobdeskData = [];
let rencanaKerja = { m8: "", m9: "", m10: "", m11: "", m12: "", m13: "", m14: "" };

// ==================== DEADLINE ====================
function hitungSisaHari() {
    const targetDate = new Date(2026, 6, 12);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function updateDeadline() {
    const sisaHari = hitungSisaHari();
    const deadlineElement = document.getElementById("deadlineCount");
    if (deadlineElement) {
        deadlineElement.innerText = sisaHari + " Hari Lagi";
    }
}

function saveData() {
    localStorage.setItem("pbl_jobdesk_data", JSON.stringify(jobdeskData));
    localStorage.setItem("pbl_rencana_kerja", JSON.stringify(rencanaKerja));
}

function loadData() {
    const stored = localStorage.getItem("pbl_jobdesk_data");
    if (stored) {
        jobdeskData = JSON.parse(stored);
    } else {
        jobdeskData = [
            { id: 1, nama: "Pengolahan Peta Batimetri", detail: "Digitasi dan koreksi pasang surut", pic: ["Joana", "Anju", "Nadia"], catatan: "" }
        ];
        saveData();
    }
    
    const storedRencana = localStorage.getItem("pbl_rencana_kerja");
    if (storedRencana) {
        rencanaKerja = JSON.parse(storedRencana);
    }
}

// ==================== STATS ====================
function updateStats() {
    const anggotaSet = new Set();
    for (let i = 0; i < jobdeskData.length; i++) {
        for (let j = 0; j < jobdeskData[i].pic.length; j++) {
            anggotaSet.add(jobdeskData[i].pic[j].trim());
        }
    }
    document.getElementById("totalAnggota").innerText = anggotaSet.size;
    document.getElementById("totalJob").innerText = jobdeskData.length;
}

// ==================== RENCANA KERJA ====================
function renderRencanaKerja() {
    const container = document.getElementById("rencanaContainer");
    if (!container) return;
    
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    const mingguNama = ["Minggu 8", "Minggu 9", "Minggu 10", "Minggu 11", "Minggu 12", "Minggu 13", "Minggu 14"];
    
    let html = "";
    for (let i = 0; i < mingguList.length; i++) {
        const minggu = mingguList[i];
        const mingguNamaText = mingguNama[i];
        const nilai = rencanaKerja[minggu] || "";
        
        html += '<div class="rencana-group">';
        html += '<div class="rencana-group-header" onclick="toggleRencanaGroup(this)">';
        html += '<div class="rencana-week">' + mingguNamaText + '</div>';
        html += '<button class="btn-expand"><i class="fas fa-chevron-down"></i></button>';
        html += '</div>';
        html += '<div class="rencana-group-body">';
        html += '<textarea id="rencana_' + minggu + '" class="rencana-text" rows="3" placeholder="Tulis rencana pekerjaan untuk ' + mingguNamaText + '...">' + escapeHtml(nilai) + '</textarea>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function toggleRencanaGroup(element) {
    const group = element.closest('.rencana-group');
    const body = group.querySelector('.rencana-group-body');
    const icon = group.querySelector('.btn-expand i');
    
    if (body.style.display === "none") {
        body.style.display = "block";
        icon.className = "fas fa-chevron-down";
    } else {
        body.style.display = "none";
        icon.className = "fas fa-chevron-right";
    }
}

function simpanRencana() {
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    for (let i = 0; i < mingguList.length; i++) {
        const m = mingguList[i];
        const textarea = document.getElementById("rencana_" + m);
        if (textarea) rencanaKerja[m] = textarea.value;
    }
    saveData();
    renderTimelinePage();
    alert("Rencana pekerjaan berhasil disimpan!");
}

// ==================== JOBDESK ====================
function renderFullJobdesk() {
    const container = document.getElementById("jobListFull");
    if (!container) return;
    container.innerHTML = "";
    
    for (let i = 0; i < jobdeskData.length; i++) {
        const job = jobdeskData[i];
        
        let picHtml = "";
        for (let j = 0; j < job.pic.length; j++) {
            picHtml += '<span class="pic-badge"><i class="fas fa-user"></i> ' + escapeHtml(job.pic[j]) + '</span>';
        }
        
        const hasNote = job.catatan && job.catatan.trim() !== "";
        
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = '<div class="job-header">' +
            '<div style="flex:1">' +
            '<div class="job-title">' +
            '<i class="fas fa-anchor"></i> ' + escapeHtml(job.nama) +
            '<button class="note-btn ' + (hasNote ? "has-note" : "") + '" onclick="openNoteModal(' + job.id + ')">' +
            '<i class="fas ' + (hasNote ? "fa-pen" : "fa-pen-fancy") + '"></i> ' + (hasNote ? "Edit Catatan" : "Tambah Catatan") +
            '</button>' +
            '</div>' +
            '<div class="job-detail">' + escapeHtml(job.detail) + '</div>' +
            '<div class="pic-list">' + picHtml + '</div>' +
            (hasNote ? '<div class="note-display">📝 <strong>Catatan:</strong> ' + escapeHtml(job.catatan) + '</div>' : '') +
            '</div>' +
            '<div class="job-actions">' +
            '<button class="action-btn" onclick="editJob(' + job.id + ')"><i class="fas fa-edit"></i> Edit</button>' +
            '<button class="action-btn danger" onclick="deleteJob(' + job.id + ')"><i class="fas fa-trash"></i> Hapus</button>' +
            '</div>' +
            '</div>';
        container.appendChild(card);
    }
    document.getElementById("jobCount2").innerHTML = jobdeskData.length + " items";
}

// ==================== TIMELINE ====================
function renderTimelinePage() {
    const container = document.getElementById("timelineDetailedTable");
    if (!container) return;
    
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    const mingguNama = ["Minggu 8", "Minggu 9", "Minggu 10", "Minggu 11", "Minggu 12", "Minggu 13", "Minggu 14"];
    
    let html = '<div class="timeline-table-container"><table class="timeline-table"><thead>';
    html += '<tr><th class="col-minggu">Minggu</th><th class="col-rencana">Rencana Pekerjaan</th></tr>';
    html += '</thead><tbody>';
    
    for (let i = 0; i < mingguList.length; i++) {
        const rencana = rencanaKerja[mingguList[i]] || "-";
        html += '<tr>';
        html += '<td class="col-minggu"><strong>' + mingguNama[i] + '</strong></td>';
        html += '<td class="col-rencana">' + escapeHtml(rencana) + '</div></td>';
        html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ==================== ANGGOTA ====================
function renderAnggota() {
    const container = document.getElementById("anggotaListFull");
    if (!container) return;
    
    const avatarList = [
        { bg: "linear-gradient(135deg, #3b82f6, #8b5cf6)", icon: "fas fa-user-astronaut" },
        { bg: "linear-gradient(135deg, #10b981, #34d399)", icon: "fas fa-user-ninja" },
        { bg: "linear-gradient(135deg, #f59e0b, #ef4444)", icon: "fas fa-user-secret" }
    ];
    
    const anggotaMap = new Map();
    for (let i = 0; i < jobdeskData.length; i++) {
        const job = jobdeskData[i];
        for (let j = 0; j < job.pic.length; j++) {
            let nama = job.pic[j].trim();
            if (!anggotaMap.has(nama)) anggotaMap.set(nama, []);
            anggotaMap.get(nama).push(job.nama);
        }
    }
    
    const sorted = Array.from(anggotaMap.entries()).sort(function(a, b) {
        return a[0].localeCompare(b[0]);
    });
    
    if (sorted.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;"><i class="fas fa-users" style="font-size:48px;margin-bottom:16px;opacity:0.5;"></i><p>Belum ada anggota</p></div>';
        document.getElementById("anggotaCount").innerHTML = "0 anggota";
        return;
    }
    
    let idx = 0;
    let html = "";
    for (let i = 0; i < sorted.length; i++) {
        const nama = sorted[i][0];
        const tugas = sorted[i][1];
        const avatar = avatarList[idx % avatarList.length];
        let tugasHtml = "";
        for (let j = 0; j < tugas.length; j++) {
            tugasHtml += '<span class="tugas-badge">' + escapeHtml(tugas[j]) + '</span>';
        }
        html += '<div class="anggota-card">';
        html += '<div class="anggota-avatar" style="background:' + avatar.bg + '"><i class="' + avatar.icon + '"></i></div>';
        html += '<div class="anggota-info">';
        html += '<h4>' + escapeHtml(nama) + '</h4>';
        html += '<div class="anggota-tugas">' + tugasHtml + '</div>';
        html += '<div class="anggota-stats"><span class="job-count"><i class="fas fa-briefcase"></i> ' + tugas.length + ' Jobdesk</span></div>';
        html += '</div></div>';
        idx++;
    }
    container.innerHTML = html;
    document.getElementById("anggotaCount").innerHTML = sorted.length + " anggota";
}

// ==================== CRUD ====================
function tambahJobdesk() {
    const picInput = document.getElementById("namaAnggota")?.value.trim();
    const jenis = document.getElementById("jenisPekerjaan")?.value.trim();
    const detail = document.getElementById("detailTugas")?.value.trim();
    
    if (!picInput || !jenis || !detail) {
        alert("Harap isi semua field!");
        return;
    }
    
    const newJob = {
        id: Date.now(),
        nama: jenis,
        detail: detail,
        pic: picInput.split(",").map(function(p) { return p.trim(); }),
        catatan: ""
    };
    
    jobdeskData.push(newJob);
    saveData();
    renderFullJobdesk();
    renderAnggota();
    updateStats();
    
    document.getElementById("namaAnggota").value = "";
    document.getElementById("jenisPekerjaan").value = "";
    document.getElementById("detailTugas").value = "";
    
    alert("Jobdesk baru berhasil ditambahkan!");
}

function editJob(jobId) {
    const job = jobdeskData.find(function(j) { return j.id === jobId; });
    if (!job) return;
    
    const newNama = prompt("Edit Jobdesk:", job.nama);
    if (newNama && newNama.trim()) job.nama = newNama;
    const newDetail = prompt("Edit Detail Tugas:", job.detail);
    if (newDetail && newDetail.trim()) job.detail = newDetail;
    const newPic = prompt("Edit PIC (pisah koma):", job.pic.join(", "));
    if (newPic && newPic.trim()) job.pic = newPic.split(",").map(function(p) { return p.trim(); });
    
    saveData();
    renderFullJobdesk();
    renderAnggota();
    updateStats();
    alert("Jobdesk berhasil diperbarui!");
}

function deleteJob(jobId) {
    if (!confirm("Hapus jobdesk ini?")) return;
    jobdeskData = jobdeskData.filter(function(j) { return j.id !== jobId; });
    saveData();
    renderFullJobdesk();
    renderAnggota();
    updateStats();
    alert("Jobdesk berhasil dihapus!");
}

function openNoteModal(jobId) {
    const job = jobdeskData.find(function(j) { return j.id === jobId; });
    if (job) {
        document.getElementById("noteJobTitle").innerHTML = '<i class="fas fa-briefcase"></i> ' + escapeHtml(job.nama);
        document.getElementById("noteText").value = job.catatan || "";
        document.getElementById("noteModal").style.display = "flex";
        window.currentNoteId = jobId;
    }
}

function saveNote() {
    if (window.currentNoteId) {
        const job = jobdeskData.find(function(j) { return j.id === window.currentNoteId; });
        if (job) {
            job.catatan = document.getElementById("noteText").value;
            saveData();
            renderFullJobdesk();
            alert("Catatan berhasil disimpan!");
        }
    }
    closeModal();
}

function closeModal() {
    document.getElementById("noteModal").style.display = "none";
    window.currentNoteId = null;
}

// ==================== NAVIGASI ====================
function navigateTo(page) {
    const pages = ["dashboardPage", "jobdeskPage", "timelinePage", "anggotaPage"];
    for (let i = 0; i < pages.length; i++) {
        const el = document.getElementById(pages[i]);
        if (el) el.style.display = "none";
    }
    
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    
    if (page === "dashboard") {
        document.getElementById("dashboardPage").style.display = "block";
        title.innerText = "Dashboard";
        subtitle.innerText = "Kelola jobdesk dan rencana kerja";
        renderRencanaKerja();
        updateStats();
    } else if (page === "jobdesk") {
        document.getElementById("jobdeskPage").style.display = "block";
        title.innerText = "Jobdesk";
        subtitle.innerText = "Daftar semua tugas tim";
        renderFullJobdesk();
    } else if (page === "timeline") {
        document.getElementById("timelinePage").style.display = "block";
        title.innerText = "Timeline";
        subtitle.innerText = "Rencana pekerjaan per minggu (M8-M14)";
        renderTimelinePage();
    } else if (page === "anggota") {
        document.getElementById("anggotaPage").style.display = "block";
        title.innerText = "Anggota";
        subtitle.innerText = "Daftar anggota tim";
        renderAnggota();
    }
    
    const navItems = document.querySelectorAll(".nav-item");
    for (let i = 0; i < navItems.length; i++) {
        const item = navItems[i];
        if (item.getAttribute("data-page") === page) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    }
    updateDeadline();
}

// ==================== UTILITY ====================
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", function() {
    loadData();
    navigateTo("dashboard");
    updateDeadline();
    
    document.getElementById("btnTambah")?.addEventListener("click", tambahJobdesk);
    document.getElementById("simpanRencana")?.addEventListener("click", simpanRencana);
    document.querySelector(".close-modal")?.addEventListener("click", closeModal);
    document.getElementById("cancelNote")?.addEventListener("click", closeModal);
    document.getElementById("saveNote")?.addEventListener("click", saveNote);
    
    window.addEventListener("click", function(e) {
        if (e.target === document.getElementById("noteModal")) closeModal();
    });
    
    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.addEventListener("click", function(e) {
            e.preventDefault();
            const page = item.getAttribute("data-page");
            if (page) navigateTo(page);
        });
    });
    
    setInterval(updateDeadline, 3600000);
    
    window.editJob = editJob;
    window.deleteJob = deleteJob;
    window.openNoteModal = openNoteModal;
    window.toggleRencanaGroup = toggleRencanaGroup;
    window.simpanRencana = simpanRencana;
});
